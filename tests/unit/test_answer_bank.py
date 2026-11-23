"""
Unit tests for SelfHire.ai Typed Answer Bank Engine.
Verifies compliance with the Typed Answer Contract from agent.md.
"""

import json
import pytest
from packages.contracts.models import AnswerClassification, CandidateProfile
from services.api.engine.answers.answer_bank import AnswerBankEngine


@pytest.fixture
def sample_profile():
    with open("tests/fixtures/sample_profile.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return CandidateProfile(**data)


def test_answer_bank_resolves_work_authorization(sample_profile):
    q = "Are you legally authorized to work in India without restrictions?"
    mapping = AnswerBankEngine.resolve_question(q, sample_profile)
    
    assert mapping.classification == AnswerClassification.VERIFIED_FACT
    assert mapping.proposed_value == "Yes"
    assert mapping.requires_user_confirmation is False
    assert len(mapping.evidence_ids) > 0


def test_answer_bank_flags_sensitive_demographic(sample_profile):
    q = "What is your gender identity or race?"
    mapping = AnswerBankEngine.resolve_question(q, sample_profile)
    
    assert mapping.classification == AnswerClassification.SENSITIVE
    assert mapping.proposed_value == "I choose not to disclose"
    assert mapping.requires_user_confirmation is True


def test_answer_bank_flags_legal_attestation(sample_profile):
    q = "I certify that all statements made in this job application are true."
    mapping = AnswerBankEngine.resolve_question(q, sample_profile)
    
    assert mapping.classification == AnswerClassification.LEGAL_ATTESTATION
    assert mapping.requires_user_confirmation is True


def test_answer_bank_never_guesses_unknown_question(sample_profile):
    q = "Do you have commercial helicopter piloting license in Antarctica?"
    mapping = AnswerBankEngine.resolve_question(q, sample_profile)
    
    assert mapping.classification == AnswerClassification.UNKNOWN
    assert mapping.proposed_value == ""
    assert mapping.requires_user_confirmation is True
