"""
Universal Job Scraper & Extractor.
Extracts real job postings from ANY URL (LinkedIn, Naukri, Indeed, Company Careers Pages)
by inspecting schema.org/JobPosting JSON-LD and semantic DOM elements.
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from packages.contracts.models import JobPosting


class UniversalJobScraper:
    """Parses real job postings from any arbitrary HTML page or structured metadata."""

    @staticmethod
    def extract_from_html(html_content: str, source_url: str, fallback_company: str = "Unknown Employer") -> Optional[Dict[str, Any]]:
        soup = BeautifulSoup(html_content, "html.parser")

        # 1. First priority: Check for standard schema.org/JobPosting JSON-LD
        # (Used by Google Jobs, LinkedIn, Workday, Greenhouse, Lever, Indeed, etc.)
        json_ld_scripts = soup.find_all("script", type="application/ld+json")
        for script in json_ld_scripts:
            try:
                data = json.loads(script.string or "{}")
                if isinstance(data, list):
                    for item in data:
                        if item.get("@type") == "JobPosting":
                            return UniversalJobScraper._parse_json_ld(item, source_url)
                elif data.get("@type") == "JobPosting":
                    return UniversalJobScraper._parse_json_ld(data, source_url)
            except Exception:
                continue

        # 2. Second priority: OpenGraph & Meta tag extraction
        og_title = soup.find("meta", property="og:title")
        og_desc = soup.find("meta", property="og:description")
        
        # 3. Third priority: Semantic HTML tag extraction
        title_tag = soup.find(["h1", "title"])
        page_title = (
            (og_title.get("content") if og_title else None) or
            (title_tag.get_text(strip=True) if title_tag else "Software Engineer Opportunity")
        )

        # Clean title (strip common portal suffixes like " - Careers | Company")
        clean_title = re.split(r"[-|–—]|\bat\b", page_title)[0].strip()

        # Extract main text
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()
        
        main_content = soup.find("main") or soup.find("article") or soup.find("body") or soup
        jd_text = main_content.get_text(separator="\n", strip=True)

        # Heuristic skill extraction from text
        extracted_skills = UniversalJobScraper._extract_skills_heuristic(jd_text)

        return {
            "title": clean_title,
            "company": fallback_company,
            "url": source_url,
            "location": "Remote / Unspecified",
            "jd_text": jd_text,
            "must_have_skills": extracted_skills,
            "format": "html_semantic"
        }

    @staticmethod
    def _parse_json_ld(data: Dict[str, Any], url: str) -> Dict[str, Any]:
        """Maps schema.org/JobPosting structure to standard fields."""
        title = data.get("title", "Software Engineer")
        org = data.get("hiringOrganization", {})
        company = org.get("name") if isinstance(org, dict) else str(org)
        
        location_obj = data.get("jobLocation", {})
        location_str = "Remote / Unspecified"
        if isinstance(location_obj, dict):
            address = location_obj.get("address", {})
            if isinstance(address, dict):
                location_str = f"{address.get('addressLocality', '')}, {address.get('addressCountry', '')}".strip(", ")
        
        description_raw = data.get("description", "")
        # Clean HTML in description
        soup = BeautifulSoup(description_raw, "html.parser")
        jd_text = soup.get_text(separator="\n", strip=True)
        
        skills = UniversalJobScraper._extract_skills_heuristic(jd_text)

        return {
            "title": title,
            "company": company or "Verified Employer",
            "url": url,
            "location": location_str or "Remote",
            "jd_text": jd_text,
            "must_have_skills": skills,
            "date_posted": data.get("datePosted"),
            "valid_through": data.get("validThrough"),
            "format": "schema_job_posting"
        }

    @staticmethod
    def _extract_skills_heuristic(text: str) -> List[str]:
        """Identifies standard tech keywords in JD text using regex word-boundaries."""
        COMMON_TECH_STACK = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Next.js",
            "FastAPI", "Django", "Flask", "Go", "Golang", "Java", "C++", "C#",
            "Rust", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "GraphQL", "REST APIs",
            "Git", "CI/CD", "Linux", "PyTorch", "TensorFlow", "Tailwind CSS"
        ]
        found = []
        for skill in COMMON_TECH_STACK:
            pattern = rf"\b{re.escape(skill)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                found.append(skill)
        return found
