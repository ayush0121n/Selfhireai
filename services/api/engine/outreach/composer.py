"""
SelfHire.ai Cold Outreach Engine.
Cross-references target companies with the 1,800+ Talent Acquisition database.
Drafts personalized 1-to-1 emails (Google XYZ formula) and WhatsApp deep-links.
Strictly capped at max 5 drafts per day; approval required before any message is sent.
"""

from __future__ import annotations
import csv
import os
import re
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from packages.contracts.models import CandidateProfile, JobPosting


class RecruiterContact:
    def __init__(self, name: str, job_title: str, linkedin_url: str, company: str, location: str):
        self.name = name
        self.job_title = job_title
        self.linkedin_url = linkedin_url
        self.company = company
        self.location = location


class OutreachComposer:
    """Manages recruiter lookups and drafts 1-to-1 outreach."""

    def __init__(self, db_path: str = "data/talent_acquisition_database.csv"):
        self.db_path = db_path
        self._cache: Dict[str, List[RecruiterContact]] = {}
        self._load_database()

    def _load_database(self):
        if not os.path.exists(self.db_path):
            return
        with open(self.db_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                comp = (row.get("Company Name") or "").strip().lower()
                contact = RecruiterContact(
                    name=(row.get("Name") or "").strip(),
                    job_title=(row.get("Job Title") or "").strip(),
                    linkedin_url=(row.get("Linkedin URL") or "").strip(),
                    company=(row.get("Company Name") or "").strip(),
                    location=(row.get("Location") or "").strip()
                )
                if comp not in self._cache:
                    self._cache[comp] = []
                self._cache[comp].append(contact)

    def find_recruiters(self, company_name: str, location_hint: str | None = None) -> List[RecruiterContact]:
        """Finds recruiters for a specific company with optional location filtering."""
        norm_comp = company_name.strip().lower()
        matches = []
        for key, contacts in self._cache.items():
            if norm_comp in key or key in norm_comp:
                matches.extend(contacts)

        if location_hint:
            loc_lower = location_hint.lower()
            filtered = [c for c in matches if loc_lower in c.location.lower()]
            if filtered:
                return filtered
        return matches

    def draft_email(
        self,
        candidate: CandidateProfile,
        job: JobPosting,
        recruiter: RecruiterContact,
        daily_drafts_count: int = 0
    ) -> Dict[str, Any]:
        """Generates a personalized, de-AI-ified cold outreach email draft."""
        if daily_drafts_count >= 5:
            raise ValueError("Daily outreach limit reached (max 5 drafts/day). Protects recruiter reputation.")

        # Pick candidate's top verified metric citation from evidence
        top_metric = "optimizing production system throughput and latency"
        if candidate.evidence and candidate.evidence[0].metric_citation:
            top_metric = f"achieving {candidate.evidence[0].metric_citation}"

        subject = f"Application for {job.job_title} — {candidate.full_name}"

        body = (
            f"Hi {recruiter.name},\n\n"
            f"I noticed {job.company_name} is actively hiring for a {job.job_title} in {job.location}.\n\n"
            f"As a software engineer specializing in {', '.join(candidate.skills[:3])}, "
            f"I recently delivered measurable impact by {top_metric} at my previous role. "
            f"My technical background closely matches your requirements in {', '.join(job.must_have_skills[:3])}.\n\n"
            f"I have submitted my tailored application package through your careers portal and would welcome the chance "
            f"to briefly connect if my background aligns with your team's goals.\n\n"
            f"Best regards,\n"
            f"{candidate.full_name}\n"
            f"Portfolio: {candidate.portfolio_url or candidate.github_url or 'Available on request'}\n"
            f"LinkedIn: {candidate.linkedin_url or 'Available on request'}"
        )

        return {
            "recruiter_name": recruiter.name,
            "recruiter_title": recruiter.job_title,
            "company": job.company_name,
            "subject": subject,
            "body": body,
            "channel": "EMAIL",
            "requires_approval": True
        }

    def draft_whatsapp_link(
        self,
        phone_number: str,
        candidate: CandidateProfile,
        job: JobPosting,
        recruiter_name: str
    ) -> Dict[str, str]:
        """Generates an official WhatsApp deep-link with pre-filled message text."""
        clean_phone = re.sub(r"\D", "", phone_number)
        message = (
            f"Hi {recruiter_name}, I hope you are having a productive week. "
            f"I recently submitted my application for the {job.job_title} role at {job.company_name}. "
            f"With experience in {', '.join(candidate.skills[:3])}, I would love to share my portfolio if you have 2 minutes. "
            f"— {candidate.full_name}"
        )
        encoded_text = urllib.parse.quote(message)
        deep_link = f"https://wa.me/{clean_phone}?text={encoded_text}"

        return {
            "recruiter_name": recruiter_name,
            "phone_number": clean_phone,
            "message_text": message,
            "deep_link_url": deep_link,
            "channel": "WHATSAPP",
            "requires_approval": True
        }
