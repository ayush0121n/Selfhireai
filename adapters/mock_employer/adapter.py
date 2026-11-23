"""
Playwright Automation Adapter for Local Mock Employer Portal.
Demonstrates 100% deterministic form filling, readback, approval gate, and receipt capture.
"""

from __future__ import annotations
from typing import Any, Dict, Optional
from packages.contracts.hasher import compute_canonical_payload_hash
from packages.contracts.models import AnswerClassification, FormFieldMapping

try:
    from playwright.async_api import Page, async_playwright
except ImportError:
    Page = Any  # type: ignore
    async_playwright = None  # type: ignore


class MockEmployerAdapter:
    """Automates form filling on the local mock employer portal."""

    def __init__(self, form_url: str):
        self.form_url = form_url

    async def fill_form(self, page: Page, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Maps and fills form fields without clicking submit."""
        await page.goto(self.form_url)
        await page.wait_for_selector("#job-form")

        # 1. Fill basic contact & profile fields
        await page.fill("#full_name", candidate_data.get("full_name", ""))
        await page.fill("#email", candidate_data.get("email", ""))
        await page.fill("#phone", candidate_data.get("phone", ""))
        await page.fill("#location", candidate_data.get("location", ""))
        await page.fill("#skills", ", ".join(candidate_data.get("skills", [])))

        # 2. Handle radio buttons (Work Authorization)
        if candidate_data.get("work_authorization") == "Authorized":
            await page.check("input[name='work_auth'][value='Yes']")

        # 3. Handle dropdown
        await page.select_option("#experience_years", "1-3")

        # 4. Handle cover note
        if candidate_data.get("cover_letter"):
            await page.fill("#cover_letter", candidate_data["cover_letter"])

        # 5. Check terms certification
        await page.check("#terms")

        # 6. Readback active DOM values
        readback_data = {
            "full_name": await page.input_value("#full_name"),
            "email": await page.input_value("#email"),
            "phone": await page.input_value("#phone"),
            "location": await page.input_value("#location"),
            "skills": await page.input_value("#skills"),
            "work_auth": await page.locator("input[name='work_auth']:checked").input_value(),
            "experience_years": await page.input_value("#experience_years"),
            "destination_url": self.form_url,
        }

        # 7. Compute deterministic payload hash
        payload_hash = compute_canonical_payload_hash(readback_data)

        return {
            "status": "PREPARED",
            "readback_data": readback_data,
            "payload_hash": payload_hash,
        }

    async def submit_with_approval(self, page: Page, approved_hash: str) -> Dict[str, Any]:
        """Verifies payload integrity and submits the form only after matching approval."""
        # Read current DOM state to verify it hasn't changed since approval
        current_data = {
            "full_name": await page.input_value("#full_name"),
            "email": await page.input_value("#email"),
            "phone": await page.input_value("#phone"),
            "location": await page.input_value("#location"),
            "skills": await page.input_value("#skills"),
            "work_auth": await page.locator("input[name='work_auth']:checked").input_value(),
            "experience_years": await page.input_value("#experience_years"),
            "destination_url": self.form_url,
        }
        current_hash = compute_canonical_payload_hash(current_data)

        if current_hash != approved_hash:
            raise ValueError(
                f"Payload mismatch: form state modified after approval! "
                f"Approved: {approved_hash}, Current: {current_hash}"
            )

        # Click the submit button
        await page.click("#submit-btn")
        await page.wait_for_selector("#success-box", state="visible", timeout=5000)

        # Capture receipt
        receipt_id = await page.inner_text("#receipt-id")
        timestamp = await page.inner_text("#timestamp")

        return {
            "status": "CONFIRMED",
            "receipt_id": receipt_id,
            "timestamp": timestamp,
        }
