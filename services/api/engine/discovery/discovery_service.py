"""
Unified Discovery & Aggregation Service.
Aggregates real vacancies across all company ATS boards, public developer feeds, and custom URLs.
Deduplicates and filters jobs according to candidate target preferences.
"""

from __future__ import annotations
import asyncio
from typing import Any, Dict, List, Optional
import httpx
from packages.contracts.models import JobPosting
from services.api.engine.discovery.ats_registry import FEATURED_COMPANIES, PUBLIC_TECH_FEEDS
from services.api.engine.discovery.ats_ingester import ATSIngester
from services.api.engine.discovery.universal_scraper import UniversalJobScraper
from services.api.engine.discovery.verifier import JobVerifier


class DiscoveryService:
    """Orchestrates job discovery across all company platforms."""

    def __init__(self):
        self.ats_ingester = ATSIngester()

    def ingest_custom_url(self, html_content: str, source_url: str, company_hint: str = "Company") -> Optional[JobPosting]:
        """Ingests a real job from ANY webpage (LinkedIn, Naukri, Indeed, or career site)."""
        extracted = UniversalJobScraper.extract_from_html(html_content, source_url, fallback_company=company_hint)
        if not extracted:
            return None

        is_valid, risk, reasons = JobVerifier.evaluate_job(
            extracted["title"], extracted["company"], source_url, extracted["jd_text"]
        )

        if not is_valid:
            return None

        import hashlib
        job_id = f"custom_{hashlib.sha256(source_url.encode('utf-8')).hexdigest()[:16]}"

        return JobPosting(
            id=job_id,
            source_id="universal_capture",
            source_name=extracted["company"],
            canonical_url=source_url,
            company_name=extracted["company"],
            job_title=extracted["title"],
            location=extracted.get("location", "Remote"),
            work_mode="Remote" if "remote" in extracted.get("location", "").lower() else "Hybrid",
            jd_raw_text=extracted["jd_text"],
            must_have_skills=extracted.get("must_have_skills", []),
            scam_risk_score=risk
        )

    def filter_and_deduplicate(
        self,
        jobs: List[JobPosting],
        target_titles: List[str] | None = None,
        target_locations: List[str] | None = None
    ) -> List[JobPosting]:
        """Filters jobs against candidate preferences and removes duplicates."""
        seen_signatures = set()
        deduped = []

        for job in jobs:
            # Composite signature: company + normalized title
            norm_title = "".join(filter(str.isalnum, job.job_title.lower()))
            norm_company = "".join(filter(str.isalnum, job.company_name.lower()))
            signature = f"{norm_company}:{norm_title}"

            if signature in seen_signatures:
                continue
            seen_signatures.add(signature)

            # Match target titles if provided
            if target_titles:
                title_match = any(t.lower() in job.job_title.lower() for t in target_titles)
                if not title_match:
                    continue

            # Match target locations if provided
            if target_locations:
                loc_match = any(l.lower() in job.location.lower() for l in target_locations) or "remote" in job.location.lower()
                if not loc_match:
                    continue

            deduped.append(job)

        return deduped
