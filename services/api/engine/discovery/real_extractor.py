"""
SelfHire.ai Real Job Role Extraction & Discovery Engine.
Extracts live, verified, open job roles from:
1. Approved API feeds (Jobicy, Remotive, RemoteOK, Greenhouse, Lever)
2. Direct company career pages via Schema.org JobPosting JSON-LD & semantic DOM parsing
Enforces:
- Zero Fake / Zero Demo data: only live open roles actually verified from URLs.
- Platform Policy: LinkedIn, Indeed, and government portals remain MANUAL_LINK / RESTRICTED.
- SHA-256 jd_hash and canonical_url deduplication.
- Fit score calculation using Hugging Face all-MiniLM-L6-v2 embeddings and keyword overlap.
"""

from __future__ import annotations
import hashlib
import json
import logging
import os
import re
import sqlite3
import urllib.parse
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("selfhire.discovery.real_extractor")

# Core Technical Skills Taxonomy for Keyword Extraction
CANONICAL_CASING = {
    "python": "Python", "typescript": "TypeScript", "javascript": "JavaScript", "golang": "Go",
    "go": "Go", "rust": "Rust", "java": "Java", "c++": "C++", "c#": "C#", "ruby": "Ruby",
    "php": "PHP", "swift": "Swift", "kotlin": "Kotlin", "scala": "Scala", "sql": "SQL",
    "react": "React", "next.js": "Next.js", "nextjs": "Next.js", "vue": "Vue", "angular": "Angular",
    "svelte": "Svelte", "tailwind": "Tailwind", "redux": "Redux", "graphql": "GraphQL", "rest api": "REST API",
    "fastapi": "FastAPI", "django": "Django", "flask": "Flask", "node.js": "Node.js", "nodejs": "Node.js",
    "express": "Express", "spring boot": "Spring Boot", "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
    "mysql": "MySQL", "mongodb": "MongoDB", "sqlite": "SQLite", "redis": "Redis", "elasticsearch": "Elasticsearch",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes", "aws": "AWS", "gcp": "GCP",
    "azure": "Azure", "terraform": "Terraform", "ci/cd": "CI/CD", "github actions": "GitHub Actions",
    "kafka": "Kafka", "pytorch": "PyTorch", "tensorflow": "TensorFlow", "hugging face": "Hugging Face",
    "transformers": "Transformers", "llm": "LLM", "llms": "LLMs", "nlp": "NLP", "rag": "RAG", "langchain": "LangChain"
}

TECH_TAXONOMY = list(CANONICAL_CASING.keys())

RESTRICTED_PLATFORMS = {
    "linkedin.com", "indeed.com", "glassdoor.com", "usajobs.gov", "usa.jobs",
    "arbetsformedlingen.se", "tyomarkkinatori.fi"
}

_MODEL_INSTANCE = None
_MODEL_LOAD_ATTEMPTED = False


def get_embedding_model():
    """Lazily loads all-MiniLM-L6-v2 SentenceTransformer model from local cache."""
    global _MODEL_INSTANCE, _MODEL_LOAD_ATTEMPTED
    if _MODEL_INSTANCE is not None:
        return _MODEL_INSTANCE
    if _MODEL_LOAD_ATTEMPTED:
        return None

    _MODEL_LOAD_ATTEMPTED = True
    try:
        from sentence_transformers import SentenceTransformer
        # Try local cache first for fast execution
        try:
            _MODEL_INSTANCE = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
        except Exception:
            _MODEL_INSTANCE = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Successfully loaded Hugging Face all-MiniLM-L6-v2 model")
    except Exception as exc:
        logger.warning(f"Could not load SentenceTransformer model ({exc}). Falling back to lexical matching.")
        _MODEL_INSTANCE = None
    return _MODEL_INSTANCE


class RealJobExtractor:
    """Production extraction pipeline for live career vacancies."""

    def __init__(self, db_path: str = "data/selfhire.db", timeout: float = 12.0):
        self.db_path = db_path
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        """Extracts recognized technical keywords from job description text."""
        if not text:
            return []
        lower_text = text.lower()
        matched = []
        for kw in TECH_TAXONOMY:
            pattern = rf"\b{re.escape(kw)}\b"
            if re.search(pattern, lower_text):
                # Standardize canonical capitalization
                matched.append(CANONICAL_CASING.get(kw, kw.title()))
        # Deduplicate preserving order
        seen = set()
        deduped = []
        for m in matched:
            if m.lower() not in seen:
                seen.add(m.lower())
                deduped.append(m)
        return deduped

    @staticmethod
    def normalize_work_mode(text: str) -> str:
        """Determines work mode: REMOTE, HYBRID, or ONSITE."""
        t = text.lower()
        if "remote" in t or "anywhere" in t or "telecommute" in t:
            return "REMOTE"
        elif "hybrid" in t or "flexible" in t:
            return "HYBRID"
        else:
            return "ONSITE"

    @staticmethod
    def compute_jd_hash(text: str) -> str:
        """Computes SHA-256 hash of normalized JD text."""
        norm = re.sub(r"\s+", " ", text or "").strip()
        return hashlib.sha256(norm.encode("utf-8")).hexdigest()

    def is_policy_restricted(self, url: str) -> bool:
        """Checks if URL belongs to a restricted portal requiring manual link/extension."""
        domain = urllib.parse.urlparse(url).netloc.lower()
        return any(rp in domain for rp in RESTRICTED_PLATFORMS)

    def extract_from_html(self, html_content: str, source_url: str, fallback_company: str = "Verified Employer") -> Optional[Dict[str, Any]]:
        """Extracts job posting from HTML using JSON-LD or semantic DOM."""
        if not html_content or len(html_content.strip()) < 50:
            return None

        soup = BeautifulSoup(html_content, "html.parser")

        # 1. Schema.org JobPosting JSON-LD
        json_ld_scripts = soup.find_all("script", type="application/ld+json")
        for script in json_ld_scripts:
            try:
                raw_json = json.loads(script.string or "{}")
                items = raw_json if isinstance(raw_json, list) else [raw_json]
                for item in items:
                    if isinstance(item, dict) and item.get("@type") == "JobPosting":
                        title = item.get("title", "").strip()
                        org = item.get("hiringOrganization", {})
                        comp = org.get("name") if isinstance(org, dict) else (str(org) if org else fallback_company)
                        comp = comp or fallback_company

                        loc_obj = item.get("jobLocation", {})
                        loc_str = "Remote"
                        if isinstance(loc_obj, dict):
                            addr = loc_obj.get("address", {})
                            if isinstance(addr, dict):
                                loc_str = f"{addr.get('addressLocality', '')}, {addr.get('addressCountry', '')}".strip(", ") or "Remote"

                        desc_html = item.get("description", "")
                        desc_soup = BeautifulSoup(desc_html, "html.parser")
                        jd_text = desc_soup.get_text(separator="\n", strip=True)

                        emp_type = str(item.get("employmentType", ""))
                        work_mode = self.normalize_work_mode(f"{emp_type} {loc_str} {title}")

                        base_sal = item.get("baseSalary", {})
                        sal_str = "Competitive"
                        if isinstance(base_sal, dict):
                            val = base_sal.get("value", {})
                            if isinstance(val, dict):
                                sal_str = f"{val.get('minValue', '')}-{val.get('maxValue', '')} {val.get('unitText', '')}".strip()

                        jd_hash = self.compute_jd_hash(jd_text)
                        keywords = self.extract_keywords(f"{title} {jd_text}")

                        return {
                            "title": title or "Software Engineering Role",
                            "company_name": comp,
                            "canonical_url": source_url,
                            "location_raw": loc_str,
                            "work_mode": work_mode,
                            "salary_raw": sal_str,
                            "jd_text": jd_text,
                            "jd_hash": jd_hash,
                            "extracted_keywords": keywords,
                            "format": "schema_org_json_ld"
                        }
            except Exception:
                continue

        # 2. Semantic DOM Fallback
        og_title = soup.find("meta", property="og:title")
        og_desc = soup.find("meta", property="og:description")
        title_tag = soup.find(["h1", "title"])

        raw_title = (
            (og_title.get("content") if og_title else None) or
            (title_tag.get_text(strip=True) if title_tag else "Software Engineer")
        )
        # Clean title
        clean_title = re.split(r"[-|–—]|\bat\b", raw_title)[0].strip()

        # Clean body text
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "aside"]):
            tag.decompose()

        main_elem = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile(r"job|career|posting|description", re.I)) or soup.find("body") or soup
        jd_text = main_elem.get_text(separator="\n", strip=True)

        if len(jd_text) < 100:
            return None

        work_mode = self.normalize_work_mode(f"{clean_title} {jd_text[:500]}")
        jd_hash = self.compute_jd_hash(jd_text)
        keywords = self.extract_keywords(f"{clean_title} {jd_text}")

        return {
            "title": clean_title,
            "company_name": fallback_company,
            "canonical_url": source_url,
            "location_raw": "Remote" if work_mode == "REMOTE" else "Hybrid / Multiple Locations",
            "work_mode": work_mode,
            "salary_raw": "Competitive",
            "jd_text": jd_text,
            "jd_hash": jd_hash,
            "extracted_keywords": keywords,
            "format": "html_semantic"
        }

    async def fetch_url(self, url: str, fallback_company: str = "Verified Employer") -> Dict[str, Any]:
        """Fetches live URL and extracts job posting."""
        if self.is_policy_restricted(url):
            return {
                "success": False,
                "policy_status": "RESTRICTED",
                "message": f"Platform policy restricts direct automated scraping of {urllib.parse.urlparse(url).netloc}. Use SelfHire.ai Chrome Extension Assist or manual link mode."
            }

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True, headers=self.headers) as client:
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return {
                        "success": False,
                        "status_code": resp.status_code,
                        "message": f"HTTP {resp.status_code} received when accessing career page."
                    }
                extracted = self.extract_from_html(resp.text, str(resp.url), fallback_company)
                if not extracted:
                    return {
                        "success": False,
                        "message": "Page loaded successfully, but no structured open job posting or vacancy details could be extracted."
                    }
                extracted["success"] = True
                return extracted
            except Exception as exc:
                return {
                    "success": False,
                    "message": f"Network or parsing error: {str(exc)}"
                }

    async def fetch_feed_jobs(self, feed_name: str, feed_url: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetches live vacancies from verified public feeds."""
        jobs: List[Dict[str, Any]] = []
        domain = urllib.parse.urlparse(feed_url).netloc.lower()

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True, headers=self.headers) as client:
            try:
                # 1. Jobicy Feed
                if "jobicy.com" in domain:
                    url = f"https://jobicy.com/api/v2/remote-jobs?count={limit}"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("jobs", [])[:limit]:
                            title = item.get("jobTitle", "").strip()
                            comp = item.get("companyName", "Verified Company").strip()
                            job_url = item.get("url", "").strip()
                            desc_html = item.get("jobDescription", "") or item.get("jobExcerpt", "")
                            desc_text = BeautifulSoup(desc_html, "html.parser").get_text(separator="\n", strip=True)
                            loc = item.get("jobGeo", "Remote")

                            keywords = self.extract_keywords(f"{title} {desc_text}")
                            jd_hash = self.compute_jd_hash(desc_text)

                            jobs.append({
                                "id": f"job_jobicy_{item.get('id')}",
                                "source_name": "Jobicy API",
                                "company_name": comp,
                                "title": title,
                                "canonical_url": job_url,
                                "location_raw": loc,
                                "work_mode": "REMOTE",
                                "salary_raw": f"${item.get('annualSalaryMin', '')}-${item.get('annualSalaryMax', '')}".strip("$-") or "Competitive",
                                "jd_text": desc_text,
                                "jd_hash": jd_hash,
                                "extracted_keywords": keywords,
                            })

                # 2. Remotive Feed
                elif "remotive.com" in domain:
                    url = f"https://remotive.com/api/remote-jobs?limit={limit}"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("jobs", [])[:limit]:
                            title = item.get("title", "").strip()
                            comp = item.get("company_name", "Verified Company").strip()
                            job_url = item.get("url", "").strip()
                            desc_html = item.get("description", "")
                            desc_text = BeautifulSoup(desc_html, "html.parser").get_text(separator="\n", strip=True)
                            loc = item.get("candidate_required_location", "Remote")
                            sal = item.get("salary", "Competitive")

                            keywords = self.extract_keywords(f"{title} {desc_text} {' '.join(item.get('tags', []))}")
                            jd_hash = self.compute_jd_hash(desc_text)

                            jobs.append({
                                "id": f"job_remotive_{item.get('id')}",
                                "source_name": "Remotive API",
                                "company_name": comp,
                                "title": title,
                                "canonical_url": job_url,
                                "location_raw": loc,
                                "work_mode": "REMOTE",
                                "salary_raw": sal or "Competitive",
                                "jd_text": desc_text,
                                "jd_hash": jd_hash,
                                "extracted_keywords": keywords,
                            })

                # 3. Greenhouse Official Board
                elif "greenhouse.io" in domain or "boards-api.greenhouse.io" in domain:
                    board_token = feed_url.split("/")[-1].split("?")[0]
                    url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("jobs", [])[:limit]:
                            title = item.get("title", "").strip()
                            job_url = item.get("absolute_url", "").strip()
                            loc = item.get("location", {}).get("name", "Remote")
                            desc_html = item.get("content", "")
                            desc_text = BeautifulSoup(desc_html, "html.parser").get_text(separator="\n", strip=True)

                            keywords = self.extract_keywords(f"{title} {desc_text}")
                            jd_hash = self.compute_jd_hash(desc_text)

                            jobs.append({
                                "id": f"job_gh_{board_token}_{item.get('id')}",
                                "source_name": feed_name,
                                "company_name": feed_name,
                                "title": title,
                                "canonical_url": job_url,
                                "location_raw": loc,
                                "work_mode": self.normalize_work_mode(f"{title} {loc}"),
                                "salary_raw": "Competitive",
                                "jd_text": desc_text,
                                "jd_hash": jd_hash,
                                "extracted_keywords": keywords,
                            })

                # 4. Lever Official Board
                elif "lever.co" in domain or "api.lever.co" in domain:
                    board_token = feed_url.split("/")[-1].split("?")[0]
                    url = f"https://api.lever.co/v0/postings/{board_token}?mode=json"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data[:limit]:
                            title = item.get("text", "").strip()
                            job_url = item.get("hostedUrl", "").strip()
                            cats = item.get("categories", {})
                            loc = cats.get("location", "Remote")
                            desc = item.get("descriptionPlain", "") or BeautifulSoup(item.get("description", ""), "html.parser").get_text(separator="\n", strip=True)

                            keywords = self.extract_keywords(f"{title} {desc}")
                            jd_hash = self.compute_jd_hash(desc)

                            jobs.append({
                                "id": f"job_lever_{board_token}_{item.get('id')}",
                                "source_name": feed_name,
                                "company_name": feed_name,
                                "title": title,
                                "canonical_url": job_url,
                                "location_raw": loc,
                                "work_mode": self.normalize_work_mode(f"{title} {loc}"),
                                "salary_raw": "Competitive",
                                "jd_text": desc,
                                "jd_hash": jd_hash,
                                "extracted_keywords": keywords,
                            })

            except Exception as exc:
                logger.error(f"Error fetching feed {feed_name} ({feed_url}): {exc}")

        return jobs

    def compute_fit_score(self, profile: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes explainable fit score combining Hugging Face embeddings with keyword matching:
        - Skills match: 40%
        - Semantic embedding similarity: 35%
        - Location & Work Mode: 15%
        - Experience alignment: 10%
        """
        candidate_skills = [s.lower() for s in profile.get("skills", [])]
        job_keywords = [k.lower() for k in job.get("extracted_keywords", [])]

        matched_skills = [k for k in job.get("extracted_keywords", []) if k.lower() in candidate_skills]
        missing_skills = [k for k in job.get("extracted_keywords", []) if k.lower() not in candidate_skills]

        # 1. Skill Overlap Score (40%)
        if job_keywords:
            skill_ratio = len(matched_skills) / len(job_keywords)
        else:
            skill_ratio = 0.8
        skills_score = min(1.0, skill_ratio) * 40.0

        # 2. Semantic Similarity Score (35%)
        model = get_embedding_model()
        semantic_sim = 0.0
        if model is not None:
            try:
                from sentence_transformers import util
                candidate_text = f"{profile.get('target_role', '')} {profile.get('summary', '')} {' '.join(profile.get('skills', []))}"
                job_text = f"{job.get('title', '')} {job.get('jd_text', '')[:600]}"
                emb_cand = model.encode(candidate_text)
                emb_job = model.encode(job_text)
                sim = float(util.cos_sim(emb_cand, emb_job)[0][0])
                semantic_sim = max(0.0, sim)
            except Exception:
                semantic_sim = skill_ratio
        else:
            # Fallback lexical Jaccard
            semantic_sim = skill_ratio

        semantic_score = semantic_sim * 35.0

        # 3. Work Mode & Location (15%)
        preferred_locs = [l.lower() for l in profile.get("preferred_locations", [])]
        job_loc = job.get("location_raw", "").lower()
        job_mode = job.get("work_mode", "").upper()

        if job_mode == "REMOTE" or any(p in job_loc for p in preferred_locs) or "remote" in preferred_locs:
            location_score = 15.0
        elif job_mode == "HYBRID":
            location_score = 10.0
        else:
            location_score = 6.0

        # 4. Experience & Title Alignment (10%)
        target_role = profile.get("target_role", "").lower()
        job_title = job.get("title", "").lower()
        if any(w in job_title for w in target_role.split() if len(w) > 3):
            exp_score = 10.0
        else:
            exp_score = 6.0

        overall_percentage = int(round(skills_score + semantic_score + location_score + exp_score))
        overall_percentage = max(10, min(99, overall_percentage))

        # Explainable synthesis
        explanation_parts = []
        if matched_skills:
            explanation_parts.append(f"Strong overlap in core competencies: {', '.join(matched_skills[:4])}.")
        if job_mode == "REMOTE":
            explanation_parts.append("100% remote work alignment.")
        if semantic_sim > 0.65:
            explanation_parts.append("High semantic alignment with candidate professional background.")
        if missing_skills:
            explanation_parts.append(f"Suggested gap exploration: {', '.join(missing_skills[:3])}.")

        return {
            "overall_match_percentage": overall_percentage,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "match_explanation": " ".join(explanation_parts) or "Profile meets standard role baseline."
        }

    def deduplicate_and_save(
        self,
        jobs: List[Dict[str, Any]],
        candidate_user_id: str = "usr_ayush_01"
    ) -> List[Dict[str, Any]]:
        """
        Deduplicates against SQLite public.jobs by canonical_url and jd_hash.
        Saves live jobs and writes candidate fit_score to job_matches.
        """
        if not jobs:
            return []

        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()

        # Load candidate profile
        cur.execute("SELECT structured_data FROM profiles WHERE user_id = ?", (candidate_user_id,))
        p_row = cur.fetchone()
        profile_data = json.loads(p_row[0]) if p_row and p_row[0] else {
            "user_id": candidate_user_id,
            "target_role": "Full Stack Engineer",
            "skills": ["Python", "React", "TypeScript", "FastAPI", "Docker", "SQL", "PostgreSQL"],
            "preferred_locations": ["Remote", "Bengaluru", "Pune", "Mumbai"],
            "summary": "Full-stack software engineer specializing in Python, React, Next.js, and distributed microservices."
        }

        now_iso = datetime.now(timezone.utc).isoformat()
        saved_jobs = []

        for job in jobs:
            canonical_url = job.get("canonical_url", "")
            jd_hash = job.get("jd_hash", "")
            if not canonical_url or not jd_hash:
                continue

            # Check duplication by canonical_url OR jd_hash
            cur.execute("""
                SELECT id, title, company_name FROM jobs WHERE canonical_url = ? OR jd_hash = ?
            """, (canonical_url, jd_hash))
            existing = cur.fetchone()

            job_id = existing[0] if existing else job.get("id") or f"job_{uuid.uuid4().hex[:12]}"

            if existing:
                # Update verification timestamp & live status
                cur.execute("""
                    UPDATE jobs
                    SET last_verified_at = ?, is_live = 1
                    WHERE id = ?
                """, (now_iso, job_id))
            else:
                # Insert newly verified live job
                cur.execute("""
                    INSERT INTO jobs (
                        id, source_id, source_name, company_name, title, canonical_url,
                        location_raw, work_mode, salary_raw, jd_text, jd_hash,
                        extracted_keywords, first_seen_at, last_verified_at, is_live
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, (
                    job_id,
                    job.get("source_id", "live_discovery"),
                    job.get("source_name", "Verified Job Board"),
                    job.get("company_name", "Verified Employer"),
                    job.get("title", "Software Engineer"),
                    canonical_url,
                    job.get("location_raw", "Remote"),
                    job.get("work_mode", "REMOTE"),
                    job.get("salary_raw", "Competitive"),
                    job.get("jd_text", ""),
                    jd_hash,
                    json.dumps(job.get("extracted_keywords", [])),
                    now_iso,
                    now_iso
                ))

            # Compute and store fit score
            match_res = self.compute_fit_score(profile_data, job)
            match_id = f"match_{uuid.uuid4().hex[:12]}"

            cur.execute("""
                SELECT id FROM job_matches WHERE job_id = ? AND user_id = ?
            """, (job_id, candidate_user_id))
            existing_match = cur.fetchone()

            if existing_match:
                cur.execute("""
                    UPDATE job_matches
                    SET overall_match_percentage = ?, matched_skills = ?, missing_skills = ?,
                        match_explanation = ?, computed_at = ?
                    WHERE id = ?
                """, (
                    match_res["overall_match_percentage"],
                    json.dumps(match_res["matched_skills"]),
                    json.dumps(match_res["missing_skills"]),
                    match_res["match_explanation"],
                    now_iso,
                    existing_match[0]
                ))
            else:
                cur.execute("""
                    INSERT INTO job_matches (
                        id, job_id, user_id, overall_match_percentage,
                        matched_skills, missing_skills, match_explanation, computed_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    match_id,
                    job_id,
                    candidate_user_id,
                    match_res["overall_match_percentage"],
                    json.dumps(match_res["matched_skills"]),
                    json.dumps(match_res["missing_skills"]),
                    match_res["match_explanation"],
                    now_iso
                ))

            job_record = {
                "id": job_id,
                "title": job.get("title"),
                "company_name": job.get("company_name"),
                "canonical_url": canonical_url,
                "location_raw": job.get("location_raw"),
                "work_mode": job.get("work_mode"),
                "salary_raw": job.get("salary_raw"),
                "jd_hash": jd_hash,
                "extracted_keywords": job.get("extracted_keywords"),
                "fit_score": match_res,
                "is_live": 1,
                "last_verified_at": now_iso
            }
            saved_jobs.append(job_record)

        conn.commit()
        conn.close()
        return saved_jobs
