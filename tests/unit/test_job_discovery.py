"""
Unit tests for SelfHire.ai Multi-Source Real Job Discovery & Ingestion Engine.
"""

from datetime import datetime, timezone, timedelta
import pytest
from services.api.engine.discovery.universal_scraper import UniversalJobScraper
from services.api.engine.discovery.verifier import JobVerifier
from services.api.engine.discovery.discovery_service import DiscoveryService
from packages.contracts.models import JobPosting


def test_universal_scraper_extracts_schema_org_json_ld():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Junior Full Stack Engineer",
            "hiringOrganization": {"@type": "Organization", "name": "Razorpay"},
            "jobLocation": {"address": {"addressLocality": "Bengaluru", "addressCountry": "IN"}},
            "description": "We are seeking a Junior Full Stack Engineer with expertise in Python, React, PostgreSQL, and Docker."
        }
        </script>
    </head>
    <body><h1>Razorpay Careers</h1></body>
    </html>
    """
    result = UniversalJobScraper.extract_from_html(html, "https://razorpay.com/jobs/101")
    assert result is not None
    assert result["title"] == "Junior Full Stack Engineer"
    assert result["company"] == "Razorpay"
    assert "Bengaluru" in result["location"]
    assert "Python" in result["must_have_skills"]
    assert "React" in result["must_have_skills"]
    assert "PostgreSQL" in result["must_have_skills"]


def test_job_verifier_flags_scam_signals():
    title = "Data Entry Trainee"
    company = "Quick Cash Agency"
    url = "http://untrusted-site.xyz/job1"
    jd_scam = "Work from home part time. Registration fee of ₹2000 required before interview on Telegram."
    
    is_valid, risk, reasons = JobVerifier.evaluate_job(title, company, url, jd_scam)
    assert not is_valid
    assert risk >= 0.4
    assert any("registration fee" in r for r in reasons)


def test_job_verifier_flags_ghost_job_older_than_30_days():
    title = "Senior Backend Engineer"
    company = "Stripe"
    url = "https://boards.greenhouse.io/stripe/jobs/456"
    jd_valid = "We are seeking a senior backend engineer to scale our payment processing platform using Go and distributed databases."
    old_date = datetime.now(timezone.utc) - timedelta(days=45)
    
    is_valid, risk, reasons = JobVerifier.evaluate_job(title, company, url, jd_valid, date_posted=old_date)
    assert not is_valid
    assert any("ghost listing" in r for r in reasons)


def test_discovery_service_deduplicates_cross_platform_postings():
    service = DiscoveryService()
    job1 = JobPosting(
        id="job_01",
        source_id="greenhouse_postman",
        source_name="Postman",
        canonical_url="https://boards.greenhouse.io/postman/jobs/1",
        company_name="Postman",
        job_title="Full Stack Developer",
        location="Bengaluru, India",
        jd_raw_text="Join Postman as a Full Stack Developer building developer tooling."
    )
    job2 = JobPosting(
        id="job_02",
        source_id="naukri_repost",
        source_name="Naukri",
        canonical_url="https://naukri.com/job/postman-full-stack",
        company_name="Postman",
        job_title="Full Stack Developer",
        location="Bengaluru, India",
        jd_raw_text="Postman is hiring Full Stack Developers in Bengaluru."
    )
    
    deduped = service.filter_and_deduplicate([job1, job2], target_titles=["Full Stack"])
    assert len(deduped) == 1
    assert deduped[0].id == "job_01"
