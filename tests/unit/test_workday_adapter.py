"""
Unit tests for Workday Multi-Step Wizard ATS Adapter.
Verifies payload structuring, step progression, and anti-tamper hash verification.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from adapters.workday.adapter import WorkdayAdapter
from packages.contracts.hasher import compute_canonical_payload_hash


def test_workday_payload_mapping():
    candidate = {
        "full_name": "Alex Rivera",
        "email": "alex.rivera@example.com",
        "phone": "+91 98765 43210",
        "location": "Pune, India",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "work_authorization": "Authorized"
    }

    payload = WorkdayAdapter.map_workday_payload(candidate)
    assert payload["contact"]["legalNameSection_firstName"] == "Alex"
    assert payload["contact"]["legalNameSection_lastName"] == "Rivera"
    assert payload["contact"]["email"] == "alex.rivera@example.com"
    assert "Python" in payload["experience"]["skills"]
    assert payload["questions"]["work_authorization"] == "Authorized"


@pytest.mark.anyio
async def test_workday_approval_tamper_protection():
    adapter = WorkdayAdapter(portal_url="https://wd5.myworkdayjobs.com/techcorp/job/101")

    # Mock Review step state
    mock_page = MagicMock()
    mock_page.input_value = AsyncMock(side_effect=lambda sel: {
        "[data-automation-id='legalNameSection_firstName']": "Ayush",
        "[data-automation-id='legalNameSection_lastName']": "Rivera",
        "[data-automation-id='email']": "alex.rivera@example.com",
        "[data-automation-id='phone-number']": "+91 98765 43210"
    }.get(sel, ""))

    mock_locator = MagicMock()
    mock_locator.click = AsyncMock()
    mock_page.locator.return_value = mock_locator

    legit_hash = compute_canonical_payload_hash({
        "portal_url": adapter.portal_url,
        "first_name": "Ayush",
        "last_name": "Rivera",
        "email": "alex.rivera@example.com",
        "phone": "+91 98765 43210",
        "work_auth": "Authorized"
    })

    # Legitimate approved submission must succeed
    result = await adapter.submit_with_approval(mock_page, legit_hash)
    assert result["status"] == "SUBMITTED"
    assert result["verified_hash"] == legit_hash

    # Tampered submission with modified hash must trigger PermissionError
    tampered_hash = "deadbeef" * 8
    with pytest.raises(PermissionError, match="Workday tamper alert"):
        await adapter.submit_with_approval(mock_page, tampered_hash)
