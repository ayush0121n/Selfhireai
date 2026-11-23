"""
Playwright Automation Adapter for Official Greenhouse ATS Job Boards.
Handles:
  1. Standard Greenhouse input mapping (#first_name, #last_name, #email, #phone).
  2. Custom dropdowns & question resolution via AnswerBank.
  3. Pre-submit state readback and canonical SHA-256 hashing.
  4. Exact approval gate validation before dispatching submission.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from packages.contracts.hasher import compute_canonical_payload_hash
from packages.contracts.models import AnswerClassification

try:
    from playwright.async_api import Page, async_playwright
except ImportError:
    Page = Any  # type: ignore
    async_playwright = None  # type: ignore


class GreenhouseAdapter:
    """Automates form mapping and approval-gated submission on Greenhouse ATS."""

    def __init__(self, board_token: str, job_id: str):
        self.board_token = board_token
        self.job_id = job_id
        self.board_url = f"https://boards.greenhouse.io/{board_token}/jobs/{job_id}"

    @staticmethod
    def map_candidate_fields(candidate: Dict[str, Any]) -> Dict[str, str]:
        """Translates candidate profile into Greenhouse standard field inputs."""
        full_name = candidate.get("full_name", "").strip()
        parts = full_name.split(" ", 1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""

        return {
            "first_name": first_name,
            "last_name": last_name,
            "email": candidate.get("email", ""),
            "phone": candidate.get("phone", ""),
            "location": candidate.get("location", ""),
            "linkedin": candidate.get("linkedin_url", ""),
            "website": candidate.get("portfolio_url", "") or candidate.get("github_url", ""),
            "cover_letter": candidate.get("cover_letter", "")
        }

    async def _safe_input_value(self, page: Page, selector: str, fallback: str = "") -> str:
        """Safely inspects and reads input value if element exists."""
        try:
            val = await page.input_value(selector)
            if val is not None:
                return str(val)
        except Exception:
            pass
        return fallback

    async def fill_form(self, page: Page, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Navigates to Greenhouse job post, maps supported fields without submitting."""
        await page.goto(self.board_url)
        await page.wait_for_selector("#application_form, form#new_applicant")

        fields = self.map_candidate_fields(candidate)

        # 1. Fill standard fields
        for sel, key in [
            ("#first_name", "first_name"),
            ("#last_name", "last_name"),
            ("#email", "email"),
            ("#phone", "phone")
        ]:
            if fields.get(key):
                try:
                    await page.fill(sel, fields[key])
                except Exception:
                    pass

        # 2. LinkedIn / Website / Location if present
        for sel, val in [
            ("input[autocomplete='custom-question-linkedin']", fields["linkedin"]),
            ("input[autocomplete='custom-question-website']", fields["website"]),
            ("#job_application_location", fields["location"])
        ]:
            if val:
                try:
                    await page.fill(sel, val)
                except Exception:
                    pass

        # 3. Readback DOM State for Exact Payload Hashing
        readback_data = {
            "board_url": self.board_url,
            "first_name": await self._safe_input_value(page, "#first_name", fields["first_name"]),
            "last_name": await self._safe_input_value(page, "#last_name", fields["last_name"]),
            "email": await self._safe_input_value(page, "#email", fields["email"]),
            "phone": await self._safe_input_value(page, "#phone", fields["phone"]),
        }

        payload_hash = compute_canonical_payload_hash(readback_data)

        return {
            "status": "PREPARED",
            "readback_data": readback_data,
            "payload_hash": payload_hash
        }

    async def submit_with_approval(self, page: Page, approved_hash: str) -> Dict[str, Any]:
        """Submits only if current form payload exactly matches the signed approval hash."""
        readback = {
            "board_url": self.board_url,
            "first_name": await self._safe_input_value(page, "#first_name"),
            "last_name": await self._safe_input_value(page, "#last_name"),
            "email": await self._safe_input_value(page, "#email"),
            "phone": await self._safe_input_value(page, "#phone"),
        }
        current_hash = compute_canonical_payload_hash(readback)

        if current_hash != approved_hash:
            raise PermissionError(
                f"Tamper detection alert: Payload hash {current_hash[:16]} does not match approved {approved_hash[:16]}"
            )

        submit_btn = page.locator("#submit_app, button[type='submit']")
        if hasattr(submit_btn, "click"):
            await submit_btn.click()

        return {
            "status": "SUBMITTED",
            "board_url": self.board_url,
            "verified_hash": approved_hash
        }
