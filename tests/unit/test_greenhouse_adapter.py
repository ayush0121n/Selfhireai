"""
Unit tests for Greenhouse ATS Adapter (Phase M7).
Verifies field translation, canonical payload hashing, and anti-tamper approval enforcement.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from adapters.greenhouse.adapter import GreenhouseAdapter
from packages.contracts.hasher import compute_canonical_payload_hash


def test_greenhouse_field_mapping():
    candidate = {
        "full_name": "Ayush Narkhede",
        "email": "ayush@example.com",
        "phone": "+91 98765 43210",
        "location": "Pune, India",
        "linkedin_url": "https://linkedin.com/in/ayush",
        "portfolio_url": "https://ayush.dev",
        "cover_letter": "Excited for this role."
    }

    fields = GreenhouseAdapter.map_candidate_fields(candidate)
    assert fields["first_name"] == "Ayush"
    assert fields["last_name"] == "Narkhede"
    assert fields["email"] == "ayush@example.com"
    assert fields["linkedin"] == "https://linkedin.com/in/ayush"
    assert fields["website"] == "https://ayush.dev"


@pytest.mark.anyio
async def test_greenhouse_tamper_detection_protection():
    adapter = GreenhouseAdapter(board_token="techcorp", job_id="12345")

    # Mock page DOM state
    mock_page = MagicMock()
    mock_page.input_value = AsyncMock(side_effect=lambda sel: {
        "#first_name": "Ayush",
        "#last_name": "Narkhede",
        "#email": "ayush@example.com",
        "#phone": "+91 98765 43210"
    }.get(sel, ""))
    
    mock_locator = MagicMock()
    mock_locator.click = AsyncMock()
    mock_page.locator.return_value = mock_locator

    legit_hash = compute_canonical_payload_hash({
        "board_url": adapter.board_url,
        "first_name": "Ayush",
        "last_name": "Narkhede",
        "email": "ayush@example.com",
        "phone": "+91 98765 43210"
    })

    # Legitimate approved submission must succeed
    result = await adapter.submit_with_approval(mock_page, legit_hash)
    assert result["status"] == "SUBMITTED"
    assert result["verified_hash"] == legit_hash

    # Tampered submission with modified hash must trigger PermissionError
    tampered_hash = "deadbeef" * 8
    with pytest.raises(PermissionError, match="Tamper detection alert"):
        await adapter.submit_with_approval(mock_page, tampered_hash)
