"""
Unit & E2E verification tests for:
1. Canonical normalized form SHA-256 hash stability
2. DeterministicFallbackEngine (Pydantic validation + retry + fallback)
3. WorkdayAdapter keep-alive heartbeat
4. Demo user provisioning & full API lifecycle via TestClient
"""

from __future__ import annotations
import asyncio
from pydantic import BaseModel
from fastapi.testclient import TestClient

from packages.contracts.hasher import compute_normalized_form_hash
from services.api.engine.deterministic import DeterministicFallbackEngine
from adapters.workday.adapter import WorkdayAdapter
from services.api.main import app


class _DemoOutputSchema(BaseModel):
    headline: str
    score: int


def test_normalized_form_hash_ignores_dom_noise():
    fields_a = [
        {"field_key": "full_name", "proposed_value": "  Alex Rivera ", "selector": "#id_123"},
        {"field_key": "email", "proposed_value": "alex.rivera@selfhire.ai", "selector": "input[name='e']"},
    ]
    fields_b = [
        {"field_key": "email", "proposed_value": "alex.rivera@selfhire.ai", "selector": "#react-select-99"},
        {"field_key": "full_name", "proposed_value": "Alex Rivera", "selector": ".dynamic-class-xyz"},
    ]
    hash_a = compute_normalized_form_hash(fields_a, "res_01", "https://boards.greenhouse.io/acme/jobs/1")
    hash_b = compute_normalized_form_hash(fields_b, "res_01", "https://boards.greenhouse.io/acme/jobs/1")
    assert hash_a == hash_b
    assert len(hash_a) == 64


def test_deterministic_fallback_engine_retries_and_falls_back(monkeypatch):
    engine = DeterministicFallbackEngine()
    calls = []

    def fake_ollama(prompt: str, temperature: float = 0.4) -> str:
        calls.append(temperature)
        return "not valid json"

    monkeypatch.setattr(engine, "_call_ollama", fake_ollama)

    res = engine.execute_with_fallback(
        prompt="Generate headline",
        schema_cls=_DemoOutputSchema,
        deterministic_fn=lambda: _DemoOutputSchema(headline="Deterministic Engineer", score=95),
        use_llm=True,
    )
    assert calls == [0.4, 0.1]
    assert res["mode"] == "DETERMINISTIC_FALLBACK"
    assert res["attempts"] == 2
    assert res["data"].headline == "Deterministic Engineer"


def test_workday_keep_alive_heartbeat():
    class _FakePage:
        def __init__(self):
            self.evals = 0

        async def evaluate(self, script: str):
            self.evals += 1
            return "Workday Careers"

    adapter = WorkdayAdapter("https://example.wd5.myworkdayjobs.com/job/1")
    page = _FakePage()
    state = {"count": 0}

    def is_pending():
        state["count"] += 1
        return state["count"] <= 2

    pings = asyncio.run(
        adapter.keep_alive_heartbeat(page, is_pending_fn=is_pending, interval_seconds=0, max_duration_seconds=10)
    )
    assert pings == 1
    assert page.evals == 1


def test_demo_user_end_to_end_api_flow():
    client = TestClient(app)

    # 1. Health & Profile
    assert client.get("/api/v1/health").status_code == 200
    prof_res = client.get("/api/v1/profile")
    assert prof_res.status_code == 200

    # 2. Job Sources & Contacts
    sources_res = client.get("/api/v1/jobs/sources?limit=10")
    assert sources_res.status_code == 200
    assert len(sources_res.json().get("sources", [])) > 0

    contacts_res = client.get("/api/v1/contacts?limit=5")
    assert contacts_res.status_code == 200

    # 3. Document Upload -> Claims -> Resume JSON & RenderCV
    upload_res = client.post(
        "/api/v1/documents/upload-json",
        json={
            "filename": "demo_ayush.txt",
            "raw_text": "Alex Rivera\nPython FastAPI PostgreSQL\n- Reduced PostgreSQL latency by 48% across 12,000 req/min",
            "user_id": "usr_demo_01",
        },
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["claims_extracted"] >= 1

    # 4. DPDP / GDPR Account Export
    export_res = client.get("/api/v1/account/export")
    assert export_res.status_code == 200
    assert export_res.json()["dpdp_compliance"] == "Digital Personal Data Protection Act 2023 Compliant"


def test_profile_persistence_and_resume_sync():
    client = TestClient(app)

    # Upload resume text and confirm profile skills/evidence sync
    upload_res = client.post(
        "/api/v1/documents/upload-json",
        json={
            "filename": "alex_sync.txt",
            "raw_text": "Alex Rivera\nalex.rivera@example.com | +91 98765 43210\nPython, FastAPI, Kubernetes, GraphQL\n- Scaled Kubernetes workloads by 3x",
            "user_id": "usr_demo_01",
        },
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["profile_synced"] is True

    prof_res = client.get("/api/v1/profile")
    assert prof_res.status_code == 200
    assert "Kubernetes" in prof_res.json()["skills"]

    # Update profile via POST /api/v1/profile and verify persistence
    updated_payload = prof_res.json()
    updated_payload["notice_period_days"] = 30
    save_res = client.post("/api/v1/profile", json=updated_payload)
    assert save_res.status_code == 200
    assert save_res.json()["notice_period_days"] == 30
