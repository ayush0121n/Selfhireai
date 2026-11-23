"""
Unit tests for SelfHire.ai canonical payload hashing and contract validation.
Enforces Superpowers Plan-and-Test discipline.
"""

import json
import pytest
from packages.contracts.hasher import compute_canonical_payload_hash
from packages.contracts.models import CandidateProfile, EvidenceItem, AnswerClassification


def test_payload_hash_determinism_across_key_orders():
    """Asserts that dictionary key insertion order does not change the SHA-256 hash."""
    dict_a = {
        "full_name": "Ayush Narkhede",
        "email": "ayush@example.com",
        "salary": "1200000",
        "location": "Pune, India"
    }
    dict_b = {
        "location": "Pune, India",
        "salary": "1200000",
        "full_name": "Ayush Narkhede",
        "email": "ayush@example.com"
    }
    
    hash_a = compute_canonical_payload_hash(dict_a)
    hash_b = compute_canonical_payload_hash(dict_b)
    
    assert hash_a == hash_b
    assert len(hash_a) == 64  # Valid SHA-256 hex string


def test_payload_hash_changes_on_single_character_alteration():
    """Asserts that tampering with any field value invalidates the hash."""
    original = {"full_name": "Ayush Narkhede", "salary": "1200000"}
    tampered = {"full_name": "Ayush Narkhede", "salary": "1200001"}
    
    hash_orig = compute_canonical_payload_hash(original)
    hash_tamp = compute_canonical_payload_hash(tampered)
    
    assert hash_orig != hash_tamp


def test_candidate_profile_contract_validation():
    """Validates that synthetic profile fixtures conform to Pydantic contracts."""
    with open("tests/fixtures/sample_profile.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    profile = CandidateProfile(**data)
    assert profile.user_id == "usr_ayush_01"
    assert profile.full_name == "Ayush Narkhede"
    assert len(profile.skills) >= 5
    assert len(profile.evidence) == 2
    assert profile.evidence[0].id == "ev_exp_01"
