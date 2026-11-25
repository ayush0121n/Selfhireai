"""
Unit tests for SelfHire.ai Direct Target Outreach & Company Intelligence.
Verifies company background extraction, resume formatting, copy-paste email generation,
mailto: encoding, and API endpoint integration.
"""

import pytest
from fastapi.testclient import TestClient
from packages.contracts.models import CandidateProfile, DirectTargetOutreachRequest
from services.api.engine.intelligence.company_analyzer import CompanyAnalyzer
from services.api.engine.outreach.direct_engine import DirectOutreachEngine
from services.api.engine.resume.tailor import ResumeTailor
from services.api.main import app

client = TestClient(app)


SAMPLE_JD = """
About Stripe:
Stripe is a financial infrastructure platform for businesses. Millions of companies—from the world's largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

Role: Senior Backend Engineer - Payment Infrastructure
Location: Remote, Global

What you'll do:
- Design, build, and maintain high throughput APIs, distributed ledger services, and microservices.
- Optimize database query latency and fault tolerance across distributed PostgreSQL and Redis clusters.
- Collaborate with developer experience teams to ensure 99.999% uptime for global financial transactions.

Requirements:
- Strong experience with Python, Go, or Java building distributed systems.
- Experience with REST APIs, SQL, PostgreSQL, Redis, Docker, and Kubernetes.
- Passion for production reliability, system scalability, and developer experience.
"""


def test_company_analyzer_extraction():
    email = "recruiter@stripe.com"
    company, title = CompanyAnalyzer.infer_company_name_and_title(email, SAMPLE_JD)
    assert "Stripe" in company
    assert "Senior Backend Engineer" in title

    domain = CompanyAnalyzer.extract_domain(email)
    assert domain == "stripe.com"

    intelligence = CompanyAnalyzer.analyze(company, domain, SAMPLE_JD)
    assert intelligence.company_name == company
    assert intelligence.domain == "stripe.com"
    assert intelligence.industry == "FinTech & Payments"
    assert "Python" in intelligence.tech_stack
    assert "PostgreSQL" in intelligence.tech_stack
    assert "Redis" in intelligence.tech_stack
    assert len(intelligence.mission_themes) >= 1
    assert "Stripe" in intelligence.overview


def test_direct_outreach_generation_full_cycle():
    # Load candidate profile
    from services.api.main import _CURRENT_PROFILE, load_initial_profile
    if not _CURRENT_PROFILE:
        load_initial_profile()
    profile = _CURRENT_PROFILE
    assert profile is not None

    req = DirectTargetOutreachRequest(
        target_email="sarah.connor@stripe.com",
        jd_text=SAMPLE_JD,
        send_immediately=False
    )

    resp = DirectOutreachEngine.generate_direct_outreach(profile, req)

    # 1. Company Intelligence
    assert resp.company_intelligence.company_name == "Stripe"
    assert resp.company_intelligence.industry == "FinTech & Payments"

    # 2. Email Generation
    assert "sarah.connor@stripe.com" == resp.target_email
    assert "Stripe" in resp.email_subject
    assert "Senior Backend Engineer" in resp.email_subject
    assert "Hi Sarah" in resp.email_body or "Hi Hiring Team" in resp.email_body
    assert "FinTech & Payments" in resp.email_body
    assert "Alex Rivera" in resp.email_body

    # 3. Copy-Paste Email & Mailto URL
    assert "TO: sarah.connor@stripe.com" in resp.copy_paste_email
    assert "SUBJECT:" in resp.copy_paste_email
    assert resp.mailto_url.startswith("mailto:sarah.connor@stripe.com?subject=")
    assert "body=" in resp.mailto_url

    # 4. Tailored Resume Text & Markdown
    assert "PROFESSIONAL SUMMARY" in resp.tailored_resume_text
    assert "ALEX RIVERA" in resp.tailored_resume_text
    assert "CORE TECHNICAL SKILLS" in resp.tailored_resume_text
    assert "SHA-256" in resp.tailored_resume_text
    assert resp.tailored_resume.sha256_hash is not None
    assert resp.tailored_resume.unsupported_claims_found == 0

    assert "# Alex Rivera" in resp.tailored_resume_markdown


def test_api_direct_outreach_endpoints():
    # 1. Successful generation via REST API
    payload = {
        "target_email": "careers@stripe.com",
        "jd_text": SAMPLE_JD,
        "send_immediately": True
    }
    resp = client.post("/api/v1/outreach/direct-target", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["target_email"] == "careers@stripe.com"
    assert "Stripe" in data["company_intelligence"]["company_name"]
    assert "mailto:" in data["mailto_url"]
    assert "TO: careers@stripe.com" in data["copy_paste_email"]
    assert len(data["tailored_resume_text"]) > 200
    assert data["send_status"] in ["DISPATCHED_SIMULATED", "DISPATCHED_SMTP"]
    assert data["dispatch_receipt"] is not None

    # 2. Validation failures
    bad_email = client.post("/api/v1/outreach/direct-target", json={
        "target_email": "not-an-email",
        "jd_text": SAMPLE_JD
    })
    assert bad_email.status_code == 400

    bad_jd = client.post("/api/v1/outreach/direct-target", json={
        "target_email": "test@stripe.com",
        "jd_text": "short"
    })
    assert bad_jd.status_code == 400


def test_api_send_email_direct():
    send_payload = {
        "target_email": "founder@techcorp.io",
        "subject": "Senior Full Stack Engineer — Alex Rivera",
        "body": "Hi, I have attached my verified resume for your review."
    }
    resp = client.post("/api/v1/outreach/send-email", json=send_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["DISPATCHED_SIMULATED", "DISPATCHED_SMTP"]
    assert "receipt" in data
