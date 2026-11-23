"""
Unit tests for SelfHire.ai Fit-Scorer and Hard Filter Engine.
"""

from datetime import datetime, timezone
import pytest
from packages.contracts.models import CandidateProfile, JobPosting
from services.api.engine.matching.scorer import FitScorer


@pytest.fixture
def sample_candidate():
    return CandidateProfile(
        user_id="usr_01",
        full_name="Ayush Narkhede",
        email="ayush@example.com",
        phone="+91 9876543210",
        location="Pune, India",
        work_authorization="Authorized",
        skills=["Python", "React", "Node.js", "SQL", "Docker", "REST APIs"],
        preferred_locations=["Pune", "Bengaluru", "Remote"],
        willing_to_relocate=True,
        experience=[{"title": "Software Engineer Intern", "company": "Tech Corp"}]
    )


def test_fit_scorer_hard_filter_excludes_blacklisted_company(sample_candidate):
    job = JobPosting(
        id="job_blacklisted",
        source_id="test",
        source_name="SpamCorp",
        canonical_url="https://spamcorp.com/jobs/1",
        company_name="SpamCorp International",
        job_title="Python Developer",
        location="Pune",
        jd_raw_text="Join us."
    )
    
    score = FitScorer.calculate_fit_score(sample_candidate, job, excluded_companies=["SpamCorp"])
    assert score.overall_match_percentage == 0
    assert "Hard Filter Block" in score.match_explanation


def test_fit_scorer_calculates_high_match_for_compatible_job(sample_candidate):
    job = JobPosting(
        id="job_high_fit",
        source_id="greenhouse_stripe",
        source_name="Stripe",
        canonical_url="https://boards.greenhouse.io/stripe/jobs/101",
        company_name="Stripe",
        job_title="Junior Full Stack Developer",
        location="Remote",
        work_mode="Remote",
        must_have_skills=["Python", "React", "REST APIs", "SQL"],
        experience_min_years=1,
        first_seen_at=datetime.now(timezone.utc),
        jd_raw_text="Looking for a Full Stack Developer with Python, React, and REST API experience."
    )
    
    score = FitScorer.calculate_fit_score(sample_candidate, job)
    assert score.overall_match_percentage >= 85
    assert len(score.matched_skills) == 4
    assert len(score.missing_skills) == 0
