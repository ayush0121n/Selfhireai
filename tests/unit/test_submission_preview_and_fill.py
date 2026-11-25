"""
Unit & API tests for Submitted Application Snapshots, Open-and-Fill Portal Guard,
and Notification creation.
"""

from __future__ import annotations
from fastapi.testclient import TestClient

from services.api.engine.storage.workspace_store import WorkspaceStore
from services.api.main import app


def test_workspace_store_submitted_snapshot_lifecycle(tmp_path):
    store = WorkspaceStore(db_path=str(tmp_path / "ws.db"))
    snap = store.save_submitted_snapshot(
        application_id="app_snap_01",
        job_id="job_01",
        company_name="Supabase",
        job_title="Senior Full-Stack Engineer",
        destination_url="https://jobs.ashbyhq.com/supabase/123",
        submission_mode="MANUAL_APPLY",
        filled_fields=[{"label": "Full Name", "value": "Alex Rivera", "classification": "VERIFIED_FACT"}],
        status="AWAITING_USER_SUBMIT",
    )
    assert snap["application_id"] == "app_snap_01"
    assert snap["status"] == "AWAITING_USER_SUBMIT"
    assert snap["filled_fields"][0]["label"] == "Full Name"

    updated = store.update_snapshot_status("app_snap_01", status="CONFIRMED", confirmation_number="CONF-123")
    assert updated is not None
    assert updated["status"] == "CONFIRMED"
    assert updated["confirmation_number"] == "CONF-123"

    notif = store.create_notification(title="Test Notif", body="Body", category="application", href="/applications/app_snap_01")
    assert notif["title"] == "Test Notif"
    assert any(n["id"] == notif["id"] for n in store.list_notifications())


def test_open_and_fill_blocks_linkedin_and_prepares_official_portal():
    client = TestClient(app)

    # 1. LinkedIn must stay in MANUAL_LINK mode
    li_res = client.post(
        "/api/v1/applications/open-and-fill",
        json={
            "job_id": "job_li_01",
            "destination_url": "https://www.linkedin.com/jobs/view/123456",
            "company_name": "LinkedIn Role",
            "job_title": "Engineer",
            "launch_browser": False,
        },
    )
    assert li_res.status_code == 200
    assert li_res.json()["status"] == "MANUAL_LINK_REQUIRED"

    # 2. Official ATS URL returns AWAITING_USER_CLICK_SUBMIT with filled fields & snapshot
    gh_res = client.post(
        "/api/v1/applications/open-and-fill",
        json={
            "job_id": "job_gh_01",
            "destination_url": "https://boards.greenhouse.io/scalegrid/jobs/101",
            "company_name": "ScaleGrid",
            "job_title": "Backend Engineer",
            "launch_browser": False,
        },
    )
    assert gh_res.status_code == 200
    body = gh_res.json()
    assert body["status"] == "AWAITING_USER_CLICK_SUBMIT"
    assert body["ats_detected"] == "Greenhouse"
    assert body["filled_count"] >= 5
    app_id = body["application_id"]

    # 3. Confirm submitted updates snapshot & preview endpoint returns filled fields
    conf_res = client.post(f"/api/v1/applications/{app_id}/confirm-submitted", json={"confirmation_number": "GH-8812"})
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "CONFIRMED"

    prev_res = client.get(f"/api/v1/applications/{app_id}/preview")
    assert prev_res.status_code == 200
    assert prev_res.json()["confirmation_number"] == "GH-8812"
    assert len(prev_res.json()["filled_fields"]) >= 5


def test_manual_application_records_filled_snapshot():
    client = TestClient(app)
    res = client.post(
        "/api/v1/applications/manual",
        json={
            "job_id": "job_man_01",
            "company_name": "Razorpay",
            "job_title": "Platform Engineer",
            "canonical_url": "https://razorpay.com/jobs/1",
            "filled_fields": [
                {"label": "Full Name", "value": "Alex Rivera", "classification": "VERIFIED_FACT"},
                {"label": "Email Address", "value": "alex.rivera@selfhire.ai", "classification": "VERIFIED_FACT"},
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["snapshot"] is not None
    assert data["snapshot"]["submission_mode"] == "MANUAL_APPLY"
    assert len(data["snapshot"]["filled_fields"]) == 2
