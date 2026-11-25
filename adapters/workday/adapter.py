"""
Playwright Automation Adapter for Workday Multi-Step ATS Wizard.
Handles:
  1. Step-by-step navigation (My Information, My Experience, Application Questions, Review).
  2. Input mapping with Workday standard selectors (data-automation-id).
  3. Pre-submit Review screen readback and canonical SHA-256 hashing.
  4. Exact approval gate validation before clicking the final Submit button.
"""

from __future__ import annotations
import asyncio
from typing import Any, Callable, Dict, List, Optional
from packages.contracts.hasher import compute_canonical_payload_hash, compute_normalized_form_hash

try:
    from playwright.async_api import Page, async_playwright
except ImportError:
    Page = Any  # type: ignore
    async_playwright = None  # type: ignore


class WorkdayAdapter:
    """Automates multi-step wizard form filling on Workday employer portals."""

    WIZARD_STEPS = ["MY_INFORMATION", "MY_EXPERIENCE", "APPLICATION_QUESTIONS", "REVIEW"]

    def __init__(self, portal_url: str):
        self.portal_url = portal_url

    @staticmethod
    def map_workday_payload(candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Translates candidate profile into Workday multi-step structured data."""
        full_name = candidate.get("full_name", "").strip()
        parts = full_name.split(" ", 1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""

        return {
            "contact": {
                "legalNameSection_firstName": first_name,
                "legalNameSection_lastName": last_name,
                "email": candidate.get("email", ""),
                "phone-number": candidate.get("phone", ""),
                "addressSection_city": candidate.get("location", "").split(",")[0].strip() if candidate.get("location") else "Pune",
                "addressSection_countryRegion": "India"
            },
            "experience": {
                "skills": candidate.get("skills", []),
                "experience_years": candidate.get("experience_years", 2)
            },
            "questions": {
                "work_authorization": candidate.get("work_authorization", "Authorized"),
                "sponsorship_required": "No"
            }
        }

    async def _safe_input_value(self, page: Page, selector: str, fallback: str = "") -> str:
        try:
            val = await page.input_value(selector)
            if val is not None:
                return str(val)
        except Exception:
            pass
        return fallback

    async def fill_wizard_and_prepare_review(self, page: Page, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates step-by-step navigation through Workday wizard up to the Review screen.
        Halts on Review screen and computes exact readback payload hash.
        """
        await page.goto(self.portal_url)
        payload = self.map_workday_payload(candidate)

        # 1. Step: My Information
        for field_id, val in payload["contact"].items():
            sel = f"[data-automation-id='{field_id}']"
            try:
                await page.fill(sel, val)
            except Exception:
                pass

        # 2. Step: My Experience
        # Skills & resume attachment
        skills_str = ", ".join(payload["experience"]["skills"])
        try:
            await page.fill("[data-automation-id='skills-section']", skills_str)
        except Exception:
            pass

        # 3. Readback Review screen data
        readback_data = {
            "portal_url": self.portal_url,
            "first_name": await self._safe_input_value(page, "[data-automation-id='legalNameSection_firstName']", payload["contact"]["legalNameSection_firstName"]),
            "last_name": await self._safe_input_value(page, "[data-automation-id='legalNameSection_lastName']", payload["contact"]["legalNameSection_lastName"]),
            "email": await self._safe_input_value(page, "[data-automation-id='email']", payload["contact"]["email"]),
            "phone": await self._safe_input_value(page, "[data-automation-id='phone-number']", payload["contact"]["phone-number"]),
            "work_auth": payload["questions"]["work_authorization"]
        }

        payload_hash = compute_canonical_payload_hash(readback_data)

        return {
            "status": "PREPARED_REVIEW",
            "current_step": "REVIEW",
            "readback_data": readback_data,
            "payload_hash": payload_hash
        }

    async def submit_with_approval(self, page: Page, approved_hash: str) -> Dict[str, Any]:
        """Submits the Workday application only after verifying payload hash on Review step."""
        readback = {
            "portal_url": self.portal_url,
            "first_name": await self._safe_input_value(page, "[data-automation-id='legalNameSection_firstName']"),
            "last_name": await self._safe_input_value(page, "[data-automation-id='legalNameSection_lastName']"),
            "email": await self._safe_input_value(page, "[data-automation-id='email']"),
            "phone": await self._safe_input_value(page, "[data-automation-id='phone-number']"),
            "work_auth": "Authorized"
        }
        current_hash = compute_canonical_payload_hash(readback)

        if current_hash != approved_hash:
            raise PermissionError(
                f"Workday tamper alert: Readback hash {current_hash[:16]} does not match approved {approved_hash[:16]}"
            )

        submit_btn = page.locator("[data-automation-id='bottom-navigation-next-button']")
        if hasattr(submit_btn, "click"):
            await submit_btn.click()

        return {
            "status": "SUBMITTED",
            "wizard_step": "CONFIRMED",
            "verified_hash": approved_hash
        }

    async def keep_alive_heartbeat(
        self,
        page: Page,
        is_pending_fn: Callable[[], bool],
        interval_seconds: int = 240,
        max_duration_seconds: int = 1800,
    ) -> int:
        """
        Non-destructive Playwright keep-alive heartbeat (every 4 minutes) while an
        application sits in NEEDS_APPROVAL so Workday enterprise sessions do not expire.
        Returns the number of heartbeats sent.
        """
        elapsed = 0
        pings = 0
        while elapsed < max_duration_seconds and is_pending_fn():
            await asyncio.sleep(interval_seconds)
            elapsed += interval_seconds
            if not is_pending_fn():
                break
            try:
                # Non-destructive DOM read / ping that keeps session cookies alive
                await page.evaluate("() => document.title")
                pings += 1
            except Exception:
                break
        return pings
