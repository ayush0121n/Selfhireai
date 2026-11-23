"""
Job Verification, Freshness & Anti-Scam Filter.
Protects candidates from ghost jobs, expired reposts, non-corporate scams, and fake offers.
"""

from __future__ import annotations
import re
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Tuple


# Known scam red-flags common on public boards and unregulated portals
SCAM_INDICATORS = [
    r"registration fee",
    r"security deposit",
    r"pay for training",
    r"processing charge",
    r"bank transfer required",
    r"telegram interview",
    r"whatsapp interview only",
    r"earn \$\d+ daily without experience",
    r"data entry typing part time ₹\d+",
]

# Trusted official ATS domains
OFFICIAL_ATS_DOMAINS = [
    "greenhouse.io",
    "lever.co",
    "ashbyhq.com",
    "myworkdayjobs.com",
    "smartrecruiters.com",
    "bamboohr.com",
    "workable.com",
    "icims.com",
    "taleo.net",
    "jobvite.com"
]


class JobVerifier:
    """Evaluates job authenticity, freshness, and employer trust."""

    @staticmethod
    def evaluate_job(
        title: str,
        company: str,
        url: str,
        jd_text: str,
        date_posted: datetime | None = None
    ) -> Tuple[bool, float, List[str]]:
        """
        Returns:
            (is_valid: bool, scam_risk: float, rejection_reasons: List[str])
        """
        reasons = []
        scam_risk = 0.0

        # 1. Freshness check: Skip postings older than 30 days (High Ghost-Job risk)
        if date_posted:
            now = datetime.now(timezone.utc)
            if (now - date_posted) > timedelta(days=30):
                reasons.append(f"Job is older than 30 days (posted {date_posted.strftime('%Y-%m-%d')}) - likely ghost listing")

        # 2. Check for scam keywords in JD text
        lower_jd = jd_text.lower()
        for pattern in SCAM_INDICATORS:
            if re.search(pattern, lower_jd):
                scam_risk += 0.4
                reasons.append(f"Scam signal detected: '{pattern}'")

        # 3. Check official ATS domain credibility
        is_official_ats = any(domain in url.lower() for domain in OFFICIAL_ATS_DOMAINS)
        if is_official_ats:
            scam_risk = max(0.0, scam_risk - 0.2)  # High credibility boost

        # 4. Check for company name and title presence
        if not title or len(title.strip()) < 3:
            reasons.append("Invalid or missing job title")
        if not company or company.lower() in ["unknown", "n/a", "confidential"]:
            scam_risk += 0.2
            reasons.append("Unverified or confidential employer")

        # 5. Check description depth
        if len(jd_text.strip()) < 150:
            scam_risk += 0.3
            reasons.append("Job description is suspiciously brief (<150 characters)")

        scam_risk = min(1.0, max(0.0, scam_risk))
        is_valid = (scam_risk < 0.5) and not any("ghost listing" in r for r in reasons)

        return is_valid, scam_risk, reasons
