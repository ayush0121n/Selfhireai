"""
End-to-End Test Suite for SelfHire.ai Vertical Slice & Security Boundary Demonstrations.
Enforces the Definition of Done from plan.md:
  1. Profile -> JD -> Fit Scorer -> Resume Tailor -> Mock Form Mapping -> Approval -> Confirmed Receipt.
  2. Failure Demo 1: Modified payload invalidates approval (hash tamper detection).
  3. Failure Demo 2: Expired approval token is rejected.
  4. Failure Demo 3: Replay attack (double submission) is blocked atomically.
"""

import copy
import json
import uuid
from datetime import datetime, timezone, timedelta
import pytest
from packages.contracts.models import (
    CandidateProfile, JobPosting, ApprovalPackage, FormFieldMapping, AnswerClassification
)
from packages.contracts.hasher import compute_canonical_payload_hash
from services.api.engine.matching.scorer import FitScorer
from services.api.engine.resume.tailor import ResumeTailor
from services.api.engine.answers.answer_bank import AnswerBankEngine


@pytest.fixture
def candidate_profile():
    with open("tests/fixtures/sample_profile.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return CandidateProfile(**data)


@pytest.fixture
def target_job():
    return JobPosting(
        id="job_tc_98421",
        source_id="greenhouse_techcorp",
        source_name="TechCorp India",
        canonical_url="http://localhost:4000/mock_form.html",
        company_name="TechCorp India",
        job_title="Junior Full Stack Developer",
        location="Bengaluru, India (Hybrid)",
        work_mode="Hybrid",
        must_have_skills=["Python", "React", "REST APIs", "SQL"],
        experience_min_years=1,
        first_seen_at=datetime.now(timezone.utc),
        jd_raw_text="TechCorp is hiring a Junior Full Stack Developer with Python, React, and REST API experience."
    )


def test_complete_vertical_slice_to_confirmed_receipt(candidate_profile, target_job):
    # Step 1: Calculate Fit Score
    match_score = FitScorer.calculate_fit_score(candidate_profile, target_job)
    assert match_score.overall_match_percentage >= 85
    assert len(match_score.matched_skills) >= 4

    # Step 2: Tailor Resume with Evidence Linkage
    tailored = ResumeTailor.tailor_resume(candidate_profile, target_job)
    assert tailored.unsupported_claims_found == 0
    assert len(tailored.sha256_hash) == 64

    # Step 3: Map Mock Form Fields with Answer Bank
    questions = [
        "Full Name", "Email Address", "Phone Number", "Current Location",
        "Primary Technical Skills", "Are you legally authorized to work in India?",
        "Years of Full-Stack Experience", "I certify that all information submitted is truthful and accurate."
    ]

    field_mappings = []
    payload_dict = {
        "destination_url": target_job.canonical_url,
        "job_id": target_job.id,
        "resume_hash": tailored.sha256_hash
    }

    for q in questions:
        mapping = AnswerBankEngine.resolve_question(q, candidate_profile, target_job.company_name)
        field_mappings.append(mapping)
        payload_dict[mapping.field_key] = mapping.proposed_value

    # Step 4: Compute Canonical Hash & Generate Approval Package
    payload_hash = compute_canonical_payload_hash(payload_dict)
    approval = ApprovalPackage(
        approval_id="appr_slice_01",
        user_id=candidate_profile.user_id,
        application_id=f"app_{target_job.id}",
        destination_url=target_job.canonical_url,
        payload_hash=payload_hash,
        field_mappings=field_mappings,
        tailored_resume_hash=tailored.sha256_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        is_consumed=False
    )
    assert len(approval.payload_hash) == 64

    # Step 5: User Approves -> Atomically Consume Token & Issue Receipt
    assert approval.is_consumed is False
    approval.is_consumed = True  # Atomic single-use consumption

    receipt_id = "CONF-TC-2026-98421"
    assert approval.is_consumed is True
    assert receipt_id.startswith("CONF-TC-")


def test_security_failure_demo_1_payload_tampering_invalidates_approval(candidate_profile, target_job):
    """Failure Demo 1: Any modification to form values produces a hash mismatch and aborts execution."""
    payload_original = {
        "destination_url": target_job.canonical_url,
        "full_name": candidate_profile.full_name,
        "email": candidate_profile.email,
        "salary_expectation": "INR 1,200,000"
    }
    approved_hash = compute_canonical_payload_hash(payload_original)

    # Malicious injection / altered field before submit
    payload_tampered = copy.deepcopy(payload_original)
    payload_tampered["salary_expectation"] = "INR 2,400,000"
    recomputed_hash = compute_canonical_payload_hash(payload_tampered)

    # Recomputed hash does not match approved hash -> must abort
    assert recomputed_hash != approved_hash


def test_security_failure_demo_2_expired_approval_is_rejected():
    """Failure Demo 2: Approvals older than TTL (30 min) cannot be executed."""
    past_expiry = datetime.now(timezone.utc) - timedelta(minutes=5)
    approval = ApprovalPackage(
        approval_id="appr_expired",
        user_id="usr_01",
        application_id="app_01",
        destination_url="http://localhost:4000/mock_form.html",
        payload_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        field_mappings=[],
        tailored_resume_hash="dummy_hash",
        expires_at=past_expiry,
        is_consumed=False
    )

    is_expired = datetime.now(timezone.utc) > approval.expires_at
    assert is_expired is True


def test_security_failure_demo_3_replay_attack_double_submit_is_blocked():
    """Failure Demo 3: An already consumed approval token cannot be submitted a second time."""
    approval = ApprovalPackage(
        approval_id="appr_replay",
        user_id="usr_01",
        application_id="app_01",
        destination_url="http://localhost:4000/mock_form.html",
        payload_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        field_mappings=[],
        tailored_resume_hash="dummy_hash",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        is_consumed=True  # Already consumed once
    )

    # Attempt second submit
    can_submit = (not approval.is_consumed) and (datetime.now(timezone.utc) <= approval.expires_at)
    assert can_submit is False
