"""
Unit tests for SelfHire.ai Recruiter Lookup & Cold Outreach Engine.
"""

import json
import pytest
from packages.contracts.models import CandidateProfile, JobPosting
from services.api.engine.outreach.composer import OutreachComposer, RecruiterContact


@pytest.fixture
def sample_candidate():
    with open("tests/fixtures/sample_profile.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return CandidateProfile(**data)


@pytest.fixture
def sample_job():
    return JobPosting(
        id="job_gokwik_01",
        source_id="test",
        source_name="GoKwik",
        canonical_url="https://gokwik.co/careers",
        company_name="GoKwik",
        job_title="Junior Full Stack Developer",
        location="Gurgaon, India",
        must_have_skills=["Python", "React", "REST APIs"],
        jd_raw_text="Join GoKwik as a Full Stack Developer building e-commerce checkout infrastructure."
    )


def test_recruiter_database_lookup():
    composer = OutreachComposer("data/talent_acquisition_database.csv")
    matches = composer.find_recruiters("GoKwik")
    
    assert len(matches) > 0
    names = [c.name for c in matches]
    assert "Chetna Gogia" in names or "Omkar Pradhan" in names or "Nirvesh Mehrotra" in names


def test_outreach_email_drafting_with_xyz_metric(sample_candidate, sample_job):
    composer = OutreachComposer("data/talent_acquisition_database.csv")
    recruiter = RecruiterContact(
        name="Chetna Gogia",
        job_title="Chief Human Resources Officer",
        linkedin_url="http://www.linkedin.com/in/chetna-gogia",
        company="GoKwik",
        location="Gurgaon, India"
    )

    draft = composer.draft_email(sample_candidate, sample_job, recruiter, daily_drafts_count=0)
    
    assert draft["channel"] == "EMAIL"
    assert "Junior Full Stack Developer" in draft["subject"]
    assert "Chetna" in draft["body"]
    assert "GoKwik" in draft["body"]
    assert "10,000 rpm / 99.9% uptime" in draft["body"]  # Verified citation from evidence vault
    assert draft["requires_approval"] is True


def test_outreach_whatsapp_deep_link(sample_candidate, sample_job):
    composer = OutreachComposer("data/talent_acquisition_database.csv")
    wa_draft = composer.draft_whatsapp_link("+91 98765 43210", sample_candidate, sample_job, "Iqbal Kaur")
    
    assert wa_draft["channel"] == "WHATSAPP"
    assert "https://wa.me/919876543210?text=" in wa_draft["deep_link_url"]
    assert "Junior%20Full%20Stack%20Developer" in wa_draft["deep_link_url"]
    assert wa_draft["requires_approval"] is True


def test_outreach_daily_limit_enforcement(sample_candidate, sample_job):
    composer = OutreachComposer("data/talent_acquisition_database.csv")
    recruiter = RecruiterContact("Recruiter", "Lead", "url", "Company", "Pune")
    
    # 5 drafts already created -> must raise ValueError
    with pytest.raises(ValueError, match="Daily outreach limit reached"):
        composer.draft_email(sample_candidate, sample_job, recruiter, daily_drafts_count=5)
