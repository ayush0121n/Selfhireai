"""
Unit tests for SelfHire.ai FastAPI REST Endpoints.
Verifies end-to-end API lifecycle: Profile -> Job Import -> Match -> Tailor -> Prepare -> Approve -> Receipt.
"""

import pytest
from fastapi.testclient import TestClient
from services.api.main import app

client = TestClient(app)


def test_health_check_endpoint():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "SelfHire.ai" in data["service"]


def test_profile_retrieval_endpoint():
    resp = client.get("/api/v1/profile")
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Alex Rivera"
    assert "Python" in data["skills"]


def test_complete_api_application_lifecycle():
    # 1. Import a real job description
    import_resp = client.post("/api/v1/jobs/import", json={
        "url": "https://boards.greenhouse.io/techcorp/jobs/98421",
        "company_name": "TechCorp India"
    })
    assert import_resp.status_code == 200
    job_id = import_resp.json()["id"]

    # 2. Calculate Match Score
    match_resp = client.post(f"/api/v1/jobs/{job_id}/match")
    assert match_resp.status_code == 200
    score_data = match_resp.json()
    assert score_data["overall_match_percentage"] > 0

    # 3. Tailor Resume
    tailor_resp = client.post("/api/v1/resumes/tailor", json={"job_id": job_id})
    assert tailor_resp.status_code == 200
    tailored_data = tailor_resp.json()
    assert len(tailored_data["sha256_hash"]) == 64

    # 4. Prepare Application (Form Mapping & Canonical Hash)
    prepare_resp = client.post("/api/v1/applications/prepare", json={
        "job_id": job_id,
        "destination_url": "https://boards.greenhouse.io/techcorp/jobs/98421"
    })
    assert prepare_resp.status_code == 200
    approval_pkg = prepare_resp.json()
    approval_id = approval_pkg["approval_id"]
    assert len(approval_pkg["payload_hash"]) == 64
    assert len(approval_pkg["field_mappings"]) >= 5

    # 5. Submit Approval Decision (Approve)
    decision_resp = client.post(f"/api/v1/approvals/{approval_id}/decision", json={"approved": True})
    assert decision_resp.status_code == 200
    receipt_data = decision_resp.json()
    assert receipt_data["status"] == "CONFIRMED"
    assert "receipt" in receipt_data

    # 6. Re-submitting with the same consumed approval must fail (Anti-Replay Protection)
    replay_resp = client.post(f"/api/v1/approvals/{approval_id}/decision", json={"approved": True})
    assert replay_resp.status_code == 400
    assert "already been consumed" in replay_resp.json()["detail"]


def test_websocket_career_copilot_chat():
    with client.websocket_connect("/api/v1/chat") as ws:
        # Handshake
        greeting = ws.receive_json()
        assert greeting["type"] == "agent_connected"
        assert "Career Copilot" in greeting["message"]

        # Send match query
        ws.send_text('{"query": "Show my top match score"}')
        resp = ws.receive_json()
        assert resp["type"] == "copilot_response"
        assert "85%" in resp["reply"] or "TechCorp" in resp["reply"]

        # Send ping
        ws.send_text('{"query": "ping"}')
        resp_ping = ws.receive_json()
        assert resp_ping["reply"] == "pong"

