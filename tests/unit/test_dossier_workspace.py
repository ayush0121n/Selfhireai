from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from services.api.engine.storage.workspace_store import WorkspaceStore
from services.api.routers.dossier_router import create_dossier_router
import services.api.main as api_main


@pytest.fixture()
def isolated_client(tmp_path):
    store = WorkspaceStore(db_path=str(tmp_path / "test_workspace.db"))
    state = {
        "profile": api_main._CURRENT_PROFILE,
        "apps": [
            {
                "id": "app-iso-1",
                "application_id": "app-iso-1",
                "status": "CONFIRMED",
                "company_name": "Acme Corp",
                "job_title": "Backend Engineer",
                "destination_url": "https://boards.greenhouse.io/acme/1",
                "submitted_at": "2026-11-24T10:00:00+00:00",
            }
        ],
    }

    def get_profile():
        return state["profile"]

    def set_profile(data):
        state["profile"] = api_main.CandidateProfile(**data)
        return state["profile"]

    def list_apps():
        exts = store.list_application_exts()
        out = []
        for a in state["apps"]:
            ext = exts.get(a["application_id"])
            stage = ext["stage"] if ext and ext.get("stage") else a["status"]
            out.append({**a, "stage": stage, "status": stage})
        return {"total": len(out), "applications": out}

    def create_manual_app(job_id: str, company_name: str, job_title: str, canonical_url: str):
        app_id = f"manual-{job_id}"
        state["apps"].append(
            {
                "id": app_id,
                "application_id": app_id,
                "status": "PREPARED",
                "company_name": company_name,
                "job_title": job_title,
                "destination_url": canonical_url,
                "submitted_at": "2026-11-25T07:00:00+00:00",
            }
        )

        class _Receipt:
            application_id = app_id

        return {"receipt": _Receipt()}

    test_app = FastAPI()
    test_app.include_router(
        create_dossier_router(
            store=store,
            get_profile_fn=get_profile,
            set_profile_fn=set_profile,
            get_jobs_fn=lambda: api_main._JOBS_STORE,
            get_resumes_fn=lambda: api_main._TAILORED_RESUMES,
            list_applications_fn=list_apps,
            create_manual_app_fn=create_manual_app,
        )
    )
    return TestClient(test_app), state, store


def test_profile_strength_meter_and_empty_state(isolated_client):
    client, state, _ = isolated_client
    res = client.get("/api/v1/profile/strength")
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data["score"] <= 100
    assert "checks" in data and "tier" in data

    # Empty profile should return 0 cleanly without crashing
    state["profile"] = None
    empty_res = client.get("/api/v1/profile/strength")
    assert empty_res.status_code == 200
    assert empty_res.json()["score"] == 0
    assert empty_res.json()["tier"] == "Incomplete"


def test_saved_jobs_crud_detail_and_404(isolated_client):
    client, _, _ = isolated_client
    job_id = "test-saved-job-99"
    res = client.post(
        "/api/v1/saved-jobs",
        json={
            "job_id": job_id,
            "title": "Senior Backend Engineer",
            "company": "Acme Labs",
            "location": "Remote",
            "score": 91,
            "source": "Greenhouse",
        },
    )
    assert res.status_code == 200
    assert res.json()["saved_job"]["job_id"] == job_id

    detail = client.get(f"/api/v1/jobs/detail/{job_id}")
    assert detail.status_code == 200
    assert detail.json()["job"]["company_name"] == "Acme Labs"
    assert detail.json()["source_type"] == "saved_job"

    del_res = client.delete(f"/api/v1/saved-jobs/{job_id}")
    assert del_res.status_code == 200
    assert client.delete(f"/api/v1/saved-jobs/{job_id}").status_code == 404
    assert client.get(f"/api/v1/jobs/detail/{job_id}").status_code == 404


def test_startups_feed_and_apply(isolated_client):
    client, _, _ = isolated_client
    res = client.get("/api/v1/startups?remote_only=true")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert all(s["is_remote"] for s in data["startups"])

    first_id = data["startups"][0]["id"]
    apply_res = client.post(f"/api/v1/startups/{first_id}/apply")
    assert apply_res.status_code == 200
    app_id = apply_res.json()["application_id"]

    detail_res = client.get(f"/api/v1/applications/{app_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["application"]["stage"] == "PREPARED"


def test_application_stage_cover_letter_notes_refine_and_undo(isolated_client):
    client, _, _ = isolated_client
    app_id = "app-iso-1"

    assert client.patch(f"/api/v1/applications/{app_id}/stage", json={"stage": "INVALID_STAGE"}).status_code == 400
    good_stage = client.patch(f"/api/v1/applications/{app_id}/stage", json={"stage": "INTERVIEW"})
    assert good_stage.status_code == 200
    assert good_stage.json()["stage"] == "INTERVIEW"

    cl_res = client.post(f"/api/v1/applications/{app_id}/cover-letter", json={"tone": "Direct"})
    assert cl_res.status_code == 200
    orig_letter = cl_res.json()["cover_letter"]

    ref_res = client.post(
        f"/api/v1/applications/{app_id}/refine",
        json={"instruction": "Make it more concise and shorter", "target": "cover_letter"},
    )
    assert ref_res.status_code == 200
    assert ref_res.json()["status"] == "REFINED"

    undo_res = client.post(
        f"/api/v1/applications/{app_id}/refine",
        json={"instruction": "undo", "target": "cover_letter", "undo": True},
    )
    assert undo_res.status_code == 200
    assert undo_res.json()["cover_letter"] == orig_letter

    # Notes refinement + undo
    notes_res = client.post(f"/api/v1/applications/{app_id}/notes", json={"notes": "Line 1\nLine 2\nLine 3\nLine 4"})
    assert notes_res.status_code == 200
    ref_notes = client.post(
        f"/api/v1/applications/{app_id}/refine",
        json={"instruction": "Make shorter", "target": "notes"},
    )
    assert ref_notes.status_code == 200
    assert ref_notes.json()["target"] == "notes"
    assert ref_notes.json()["notes"] == "Line 1\nLine 2\nLine 3"

    undo_notes = client.post(
        f"/api/v1/applications/{app_id}/refine",
        json={"instruction": "undo", "target": "notes", "undo": True},
    )
    assert undo_notes.status_code == 200
    assert undo_notes.json()["notes"] == "Line 1\nLine 2\nLine 3\nLine 4"


def test_follow_ups_preferences_themes_analytics_and_invalid_import(isolated_client):
    client, _, _ = isolated_client
    fu_list = client.get("/api/v1/outreach/follow-ups")
    assert fu_list.status_code == 200
    assert fu_list.json()["total"] >= 1

    created = client.post(
        "/api/v1/outreach/follow-ups",
        json={"recruiter_name": "Alex Rivera", "company": "Kestrel Data", "role": "Backend Engineer", "channel": "Email"},
    )
    assert created.status_code == 200
    fid = created.json()["follow_up"]["id"]
    assert client.patch(f"/api/v1/outreach/follow-ups/{fid}", json={"due_status": "REPLIED"}).status_code == 200

    pref_res = client.post(
        "/api/v1/preferences",
        json={"min_salary": "₹18,00,000", "work_mode": "Remote", "notice_period": "30 Days", "sponsorship_required": False},
    )
    assert pref_res.status_code == 200
    assert client.get("/api/v1/preferences").json()["preferences"]["work_mode"] == "Remote"

    themes_res = client.get("/api/v1/resumes/themes")
    assert themes_res.status_code == 200
    assert len(themes_res.json()["builtin_themes"]) == 12

    analytics_res = client.get("/api/v1/applications/analytics/summary")
    assert analytics_res.status_code == 200
    vel = analytics_res.json()["weekly_velocity"]
    assert sum(w["submitted"] for w in vel) == analytics_res.json()["total_applications"]

    # Invalid profile import must return 400, not 500
    bad_import = client.post("/api/v1/account/import", json={"profile": {"bad": 1}})
    assert bad_import.status_code == 400


def test_workspace_store_isolation(tmp_path):
    store = WorkspaceStore(db_path=str(tmp_path / "isolated.db"))
    assert len(store.list_startups()) >= 5
    saved = store.save_job({"job_id": "iso-1", "title": "Engineer", "company": "TestCo", "location": "Remote"})
    assert saved["job_id"] == "iso-1"
    assert store.remove_saved_job("iso-1") is True
    store.purge_all()
    assert store.list_saved_jobs() == []
