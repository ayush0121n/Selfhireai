"""
Public ATS Board Ingestion Engine (Greenhouse, Lever, Ashby).
Direct, official, public JSON APIs for real active vacancies from hundreds of tech startups.
"""

from __future__ import annotations
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from packages.contracts.models import JobPosting
from services.api.engine.discovery.ats_registry import FEATURED_COMPANIES, CompanyATSEntry
from services.api.engine.discovery.universal_scraper import UniversalJobScraper
from services.api.engine.discovery.verifier import JobVerifier


class ATSIngester:
    """Fetches real jobs directly from official public company ATS APIs."""

    def __init__(self, timeout: float = 10.0):
        self.timeout = timeout

    async def fetch_greenhouse_jobs(self, client: httpx.AsyncClient, company: CompanyATSEntry) -> List[JobPosting]:
        """Fetches from https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"""
        url = f"https://boards-api.greenhouse.io/v1/boards/{company['board_token']}/jobs?content=true"
        jobs = []
        try:
            resp = await client.get(url, timeout=self.timeout)
            if resp.status_code != 200:
                return []
            data = resp.json()
            for item in data.get("jobs", []):
                title = item.get("title", "")
                job_url = item.get("absolute_url", "")
                location = item.get("location", {}).get("name", "Remote")
                content = item.get("content", "")
                
                # Clean HTML
                scraper_result = UniversalJobScraper.extract_from_html(
                    content, job_url, fallback_company=company["company_name"]
                )
                jd_text = scraper_result["jd_text"] if scraper_result else content

                # Verify
                is_valid, risk, _ = JobVerifier.evaluate_job(title, company["company_name"], job_url, jd_text)
                if not is_valid:
                    continue

                job_id = f"gh_{company['board_token']}_{item.get('id')}"
                jobs.append(
                    JobPosting(
                        id=job_id,
                        source_id=f"greenhouse_{company['board_token']}",
                        source_name=company["company_name"],
                        canonical_url=job_url,
                        company_name=company["company_name"],
                        job_title=title,
                        location=location,
                        work_mode="Remote" if "remote" in location.lower() else "Hybrid",
                        jd_raw_text=jd_text,
                        must_have_skills=scraper_result["must_have_skills"] if scraper_result else [],
                        scam_risk_score=risk,
                        first_seen_at=datetime.now(timezone.utc),
                        last_verified_at=datetime.now(timezone.utc),
                    )
                )
        except Exception:
            return []
        return jobs

    async def fetch_lever_jobs(self, client: httpx.AsyncClient, company: CompanyATSEntry) -> List[JobPosting]:
        """Fetches from https://api.lever.co/v0/postings/{board_token}?mode=json"""
        url = f"https://api.lever.co/v0/postings/{company['board_token']}?mode=json"
        jobs = []
        try:
            resp = await client.get(url, timeout=self.timeout)
            if resp.status_code != 200:
                return []
            data = resp.json()
            for item in data:
                title = item.get("text", "")
                job_url = item.get("hostedUrl", "")
                cats = item.get("categories", {})
                location = cats.get("location", "Remote")
                work_mode = cats.get("commitment", "Full-time")
                desc = item.get("descriptionPlain", "") or item.get("description", "")
                
                skills = UniversalJobScraper._extract_skills_heuristic(desc)
                is_valid, risk, _ = JobVerifier.evaluate_job(title, company["company_name"], job_url, desc)
                if not is_valid:
                    continue

                job_id = f"lever_{company['board_token']}_{item.get('id')}"
                jobs.append(
                    JobPosting(
                        id=job_id,
                        source_id=f"lever_{company['board_token']}",
                        source_name=company["company_name"],
                        canonical_url=job_url,
                        company_name=company["company_name"],
                        job_title=title,
                        location=location,
                        work_mode="Remote" if "remote" in location.lower() else "Hybrid",
                        jd_raw_text=desc,
                        must_have_skills=skills,
                        scam_risk_score=risk,
                        first_seen_at=datetime.now(timezone.utc),
                        last_verified_at=datetime.now(timezone.utc),
                    )
                )
        except Exception:
            return []
        return jobs
