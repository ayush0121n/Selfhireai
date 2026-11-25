"""
Unit tests for Reactive Resume & JSON Resume v1.0 standard adapter.
"""

import pytest
from packages.contracts.models import CandidateProfile, JobPosting, EvidenceItem
from services.api.engine.resume.tailor import ResumeTailor
from services.api.engine.resume.reactive_resume_adapter import ReactiveResumeAdapter


@pytest.fixture
def candidate_profile():
    return CandidateProfile(
        user_id="usr_demo_01",
        full_name="Alex Rivera",
        email="alex.rivera@example.com",
        phone="+91 98765 43210",
        location="Pune, India",
        work_authorization="Authorized",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
        experience=[
            {
                "company": "NextGen Systems",
                "title": "Senior Systems Engineer",
                "dates": "2023-01 — Present",
                "bullets": [
                    "Architected REST APIs handling 10,000 requests/minute with 99.9% uptime",
                    "Optimized database query latency by 42% using index tuning and Redis caching"
                ]
            }
        ],
        evidence=[
            EvidenceItem(
                id="ev_exp_01",
                user_id="usr_demo_01",
                field_path="experience[0].bullets[0]",
                verified_claim="Architected REST APIs handling 10,000 requests/minute with 99.9% uptime",
                metric_citation="10,000 rpm / 99.9% uptime"
            )
        ]
    )


@pytest.fixture
def job_posting():
    return JobPosting(
        id="job_stripe_01",
        source_id="gh_stripe",
        source_name="greenhouse",
        company_name="Stripe",
        job_title="Systems Engineer",
        location="Remote",
        canonical_url="https://stripe.com",
        jd_raw_text="Python, PostgreSQL, REST APIs",
        must_have_skills=["Python", "PostgreSQL"]
    )


def test_export_to_json_resume_schema(candidate_profile, job_posting):
    tailored = ResumeTailor.tailor_resume(candidate_profile, job_posting)
    json_resume = ReactiveResumeAdapter.to_json_resume(candidate_profile, tailored)

    assert json_resume["$schema"] == ReactiveResumeAdapter.SCHEMA_URL
    assert json_resume["basics"]["name"] == "Alex Rivera"
    assert json_resume["basics"]["email"] == "alex.rivera@example.com"
    assert len(json_resume["work"]) == 1
    assert json_resume["work"][0]["name"] == "NextGen Systems"
    assert len(json_resume["work"][0]["highlights"]) >= 1
    assert "Evidence: ev_exp_01" in json_resume["work"][0]["highlights"][0]
    assert json_resume["meta"]["compatible_with"] == "Reactive Resume v4"


def test_import_from_json_resume_schema():
    raw_json_resume = {
        "$schema": "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
        "basics": {
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+91 91234 56789",
            "location": {"city": "Bengaluru", "countryCode": "IN"},
            "url": "https://linkedin.com/in/priya-sharma"
        },
        "skills": [
            {"name": "Frontend", "keywords": ["React", "TypeScript", "Next.js", "Tailwind CSS"]}
        ],
        "work": [
            {
                "name": "Razorpay",
                "position": "Frontend Tech Lead",
                "startDate": "2022-04-01",
                "endDate": "2024-02-01",
                "highlights": [
                    "Decreased checkout bundle size by 35% through dynamic code splitting",
                    "Redesigned payment modal increasing successful conversion by 4.8%"
                ]
            }
        ]
    }

    imported_profile = ReactiveResumeAdapter.from_json_resume(raw_json_resume, user_id="usr_priya_01")

    assert imported_profile.full_name == "Priya Sharma"
    assert imported_profile.email == "priya.sharma@example.com"
    assert "React" in imported_profile.skills
    assert len(imported_profile.experience) == 1
    assert imported_profile.experience[0]["company"] == "Razorpay"
    assert len(imported_profile.evidence) == 2
    assert "Decreased checkout bundle size" in imported_profile.evidence[0].verified_claim
