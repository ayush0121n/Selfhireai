"""
Unit tests for SelfHire.ai ATS Resume Tailoring Engine & Evidence Blocker.
"""

import json
import pytest
from packages.contracts.models import CandidateProfile, JobPosting
from services.api.engine.resume.tailor import ResumeTailor


@pytest.fixture
def candidate_with_evidence():
    with open("tests/fixtures/sample_profile.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return CandidateProfile(**data)


def test_resume_tailor_reorders_bullets_by_relevance(candidate_with_evidence):
    job = JobPosting(
        id="job_tc_01",
        source_id="test",
        source_name="TechCorp",
        canonical_url="https://techcorp.com/jobs/01",
        company_name="TechCorp",
        job_title="Junior Backend Engineer",
        location="Pune",
        must_have_skills=["REST APIs", "Redis", "Latency"],
        jd_raw_text="We need someone skilled in REST APIs, latency optimization, and Redis caching."
    )

    tailored = ResumeTailor.tailor_resume(candidate_with_evidence, job)
    
    assert tailored.unsupported_claims_found == 0
    assert len(tailored.sha256_hash) == 64
    assert "Junior Backend Engineer" in tailored.tailored_headline
    
    # Check that bullets are organized with evidence
    bullets = tailored.tailored_experience_bullets[0]["bullets"]
    assert len(bullets) == 2
    for b in bullets:
        assert b["evidence_id"] in ["ev_exp_01", "ev_exp_02"]
        assert b["relevance_score"] >= 1


def test_resume_tailor_blocks_unsupported_bullet(candidate_with_evidence):
    # Artificially inject an unverified claim into candidate experience without evidence
    candidate_with_evidence.experience[0]["bullets"].append(
        "Fictional claim: Spearheaded a machine learning team of 50 researchers."
    )
    
    job = JobPosting(
        id="job_tc_02",
        source_id="test",
        source_name="TechCorp",
        canonical_url="https://techcorp.com/jobs/02",
        company_name="TechCorp",
        job_title="ML Engineer",
        location="Remote",
        jd_raw_text="Looking for someone to lead machine learning researchers."
    )

    tailored = ResumeTailor.tailor_resume(candidate_with_evidence, job)
    
    # The unverified claim must be blocked
    assert tailored.unsupported_claims_found == 1
    # Verify the unverified claim is absent from final bullets
    final_texts = [b["text"] for b in tailored.tailored_experience_bullets[0]["bullets"]]
    assert not any("Fictional claim" in text for text in final_texts)
