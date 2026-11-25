"""
Dossier & Workspace Router for SelfHire.ai.
Integrates Dossier-inspired capabilities (Profile Strength Meter, Startups Hiring,
Kanban stage persistence, Cover Letter & Chat Refinement with Undo, Funnel Analytics,
12 Resume Themes, Full-Bundle Import, Global Search, and Notifications) and
connects all dashboard pages to real SQLite-backed state.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel, Field, ValidationError

from services.api.engine.storage.workspace_store import BUILTIN_THEMES, WorkspaceStore


class SaveJobRequest(BaseModel):
    job_id: Optional[str] = None
    title: str
    company: str
    location: str = "Remote"
    work_mode: str = "Remote"
    score: int = 0
    source: str = "ATS"
    canonical_url: str = ""
    jd_raw_text: str = ""


class StageUpdateRequest(BaseModel):
    stage: str


class NotesUpdateRequest(BaseModel):
    notes: str


class CoverLetterRequest(BaseModel):
    tone: str = "Direct"
    company_name: Optional[str] = None
    job_title: Optional[str] = None


class RefineRequest(BaseModel):
    instruction: str
    target: str = "cover_letter"  # cover_letter | notes
    undo: bool = False


class FollowUpCreateRequest(BaseModel):
    recruiter_name: str
    recruiter_title: str = "Talent Team"
    company: str
    role: str
    channel: str = "Email"
    stage: str = "Day 3 Bump"
    suggested_subject: str = ""
    suggested_body: str = ""


class FollowUpPatchRequest(BaseModel):
    due_status: Optional[str] = None
    stage: Optional[str] = None
    suggested_subject: Optional[str] = None
    suggested_body: Optional[str] = None


class PreferencesPayload(BaseModel):
    min_salary: str = "₹10,00,000"
    work_mode: str = "Hybrid"
    notice_period: str = "15 Days"
    sponsorship_required: bool = False
    target_role: str = "Full Stack Engineer"
    headline: Optional[str] = None


class CustomThemeRequest(BaseModel):
    id: Optional[str] = None
    name: str
    accent: str = "#B34A0E"
    bg: str = "#FFFFFF"
    font: str = "Inter, sans-serif"
    layout: str = "single-column"
    density: str = "balanced"


class AccountImportRequest(BaseModel):
    profile: Optional[Dict[str, Any]] = None
    saved_jobs: Optional[List[Dict[str, Any]]] = None
    follow_ups: Optional[List[Dict[str, Any]]] = None
    preferences: Optional[Dict[str, Any]] = None
    custom_themes: Optional[List[Dict[str, Any]]] = None


def create_dossier_router(
    store: WorkspaceStore,
    get_profile_fn: Callable[[], Any],
    set_profile_fn: Callable[[Dict[str, Any]], Any],
    get_jobs_fn: Callable[[], Dict[str, Any]],
    get_resumes_fn: Callable[[], Dict[str, Any]],
    list_applications_fn: Callable[[], Dict[str, Any]],
    create_manual_app_fn: Callable[[str, str, str, str], Dict[str, Any]],
) -> APIRouter:
    router = APIRouter(prefix="/api/v1", tags=["dossier-workspace"])

    # ---------------- Profile Strength Meter ---------------- #
    @router.get("/profile/strength")
    def get_profile_strength():
        profile = get_profile_fn()
        if not profile:
            return {
                "score": 0,
                "tier": "Incomplete",
                "checks": [],
                "missing": ["Initialize candidate profile"],
            }

        checks = [
            {
                "key": "basics",
                "label": "Contact Basics (Name, Email, Phone, Location)",
                "weight": 15,
                "passed": bool(profile.full_name and profile.email and profile.phone and profile.location),
            },
            {
                "key": "links",
                "label": "Public Links (GitHub, LinkedIn, or Portfolio)",
                "weight": 10,
                "passed": bool(profile.github_url or profile.linkedin_url or profile.portfolio_url),
            },
            {
                "key": "skills",
                "label": "Core Skills (at least 5 verified skills)",
                "weight": 15,
                "passed": len(profile.skills or []) >= 5,
            },
            {
                "key": "experience",
                "label": "Work Experience Entries",
                "weight": 20,
                "passed": len(profile.experience or []) >= 1,
            },
            {
                "key": "projects",
                "label": "Technical Projects",
                "weight": 15,
                "passed": len(profile.projects or []) >= 1,
            },
            {
                "key": "education",
                "label": "Education History",
                "weight": 10,
                "passed": len(profile.education or []) >= 1,
            },
            {
                "key": "evidence",
                "label": "Evidence Citations (at least 2 immutable claims)",
                "weight": 15,
                "passed": len(profile.evidence or []) >= 2,
            },
        ]

        score = sum(c["weight"] for c in checks if c["passed"])
        missing = [c["label"] for c in checks if not c["passed"]]
        tier = (
            "Interview-Ready" if score >= 85
            else "Strong" if score >= 65
            else "Developing" if score >= 40
            else "Needs Setup"
        )
        return {
            "score": score,
            "tier": tier,
            "checks": checks,
            "missing": missing,
        }

    # ---------------- Saved Jobs ---------------- #
    @router.get("/saved-jobs")
    def list_saved_jobs():
        items = store.list_saved_jobs()
        return {"total": len(items), "saved_jobs": items}

    @router.post("/saved-jobs")
    def save_job(req: SaveJobRequest):
        record = store.save_job(req.model_dump())
        return {"status": "SAVED", "saved_job": record}

    @router.delete("/saved-jobs/{job_id}")
    def delete_saved_job(job_id: str):
        removed = store.remove_saved_job(job_id)
        if not removed:
            raise HTTPException(status_code=404, detail=f"Saved job {job_id} not found")
        return {"status": "DELETED", "job_id": job_id}

    # ---------------- Startups Hiring (YC + HN) ---------------- #
    @router.get("/startups")
    def list_startups(remote_only: bool = False, source: Optional[str] = None, q: Optional[str] = None, live: bool = False):
        profile = get_profile_fn()
        candidate_skills = {s.lower() for s in (profile.skills if profile else [])}
        startups = store.list_startups()

        if live:
            try:
                import httpx
                resp = httpx.get(
                    "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=hiring&hitsPerPage=5",
                    timeout=3.0,
                )
                if resp.status_code == 200:
                    for hit in resp.json().get("hits", [])[:3]:
                        title = hit.get("title") or ""
                        obj_id = hit.get("objectID") or ""
                        if title and obj_id:
                            startups.insert(
                                0,
                                {
                                    "id": f"hn-live-{obj_id}",
                                    "company_name": hit.get("author") or "HN Startup",
                                    "source": "HN Live Feed",
                                    "batch": "Live",
                                    "role_title": title[:80],
                                    "location": "Remote",
                                    "is_remote": True,
                                    "stack": ["Python", "TypeScript", "React"],
                                    "compensation": "Competitive",
                                    "apply_email": "",
                                    "apply_url": hit.get("url") or f"https://news.ycombinator.com/item?id={obj_id}",
                                    "summary": title,
                                    "posted_at": str(hit.get("created_at", ""))[:10],
                                },
                            )
            except Exception:
                pass

        results = []
        for st in startups:
            if remote_only and not st["is_remote"]:
                continue
            if source and source.lower() not in st["source"].lower():
                continue
            if q:
                hay = f"{st['company_name']} {st['role_title']} {st['location']} {' '.join(st['stack'])}".lower()
                if q.lower() not in hay:
                    continue

            stack_lower = [s.lower() for s in st["stack"]]
            matched = [s for s in st["stack"] if s.lower() in candidate_skills]
            missing = [s for s in st["stack"] if s.lower() not in candidate_skills]
            fit_score = int(round((len(matched) / max(len(stack_lower), 1)) * 100)) if candidate_skills else 72
            results.append({
                **st,
                "fit_score": fit_score,
                "matched_skills": matched,
                "missing_skills": missing,
            })

        results.sort(key=lambda x: x["fit_score"], reverse=True)
        return {"total": len(results), "startups": results}

    @router.post("/startups/{startup_id}/apply")
    def start_startup_application(startup_id: str):
        startups = {s["id"]: s for s in store.list_startups()}
        st = startups.get(startup_id)
        if not st:
            raise HTTPException(status_code=404, detail=f"Startup {startup_id} not found")

        receipt_resp = create_manual_app_fn(
            startup_id,
            st["company_name"],
            st["role_title"],
            st["apply_url"] or f"mailto:{st['apply_email']}",
        )
        app_id = receipt_resp["receipt"].application_id
        store.upsert_application_ext(
            application_id=app_id,
            stage="PREPARED",
            notes=f"Startup application prepared for {st['company_name']} ({st['source']} {st['batch']}). Apply contact: {st['apply_email']}",
        )
        return {"status": "PREPARED", "application_id": app_id, "startup": st}

    # ---------------- Application Analytics & Funnel ---------------- #
    @router.get("/applications/analytics/summary")
    def get_application_analytics():
        base = list_applications_fn()
        apps = base.get("applications", [])
        exts = store.list_application_exts()

        stage_counts: Dict[str, int] = {
            "PREPARED": 0,
            "NEEDS_APPROVAL": 0,
            "CONFIRMED": 0,
            "INTERVIEW": 0,
            "OFFER": 0,
            "ARCHIVED": 0,
        }
        enriched = []
        for a in apps:
            app_id = a.get("application_id") or a.get("id")
            ext = exts.get(app_id) or exts.get(a.get("id", ""))
            stage = (ext["stage"] if ext and ext.get("stage") else a.get("status", "CONFIRMED")).upper()
            if stage == "SUBMITTED":
                stage = "CONFIRMED"
            if stage not in stage_counts:
                stage_counts[stage] = 0
            stage_counts[stage] += 1
            enriched.append({**a, "stage": stage})

        follow_ups = store.list_follow_ups()
        due_follow_ups = [f for f in follow_ups if f.get("due_status") == "DUE_TODAY"]

        next_actions: List[Dict[str, Any]] = []
        for a in enriched:
            if a["stage"] == "NEEDS_APPROVAL":
                next_actions.append({
                    "type": "APPROVAL_REQUIRED",
                    "title": f"Approve {a.get('company_name', 'Application')}",
                    "subtitle": a.get("job_title", "Pending SHA-256 signature"),
                    "href": "/approvals",
                })
            elif a["stage"] == "PREPARED":
                next_actions.append({
                    "type": "DRAFT_READY",
                    "title": f"Review draft for {a.get('company_name', 'Role')}",
                    "subtitle": a.get("job_title", "Prepared application"),
                    "href": f"/applications/{a.get('application_id') or a.get('id')}",
                })
        for fu in due_follow_ups[:3]:
            next_actions.append({
                "type": "FOLLOW_UP_DUE",
                "title": f"Follow up with {fu['recruiter_name']} ({fu['company']})",
                "subtitle": f"{fu['stage']} • {fu['channel']}",
                "href": "/outreach/follow-ups",
            })

        # Compute 4-week velocity from actual application timestamps
        now_dt = datetime.now(timezone.utc)
        week_buckets = [
            {"label": "W-3", "submitted": 0, "interviews": 0},
            {"label": "W-2", "submitted": 0, "interviews": 0},
            {"label": "W-1", "submitted": 0, "interviews": 0},
            {"label": "This Week", "submitted": 0, "interviews": 0},
        ]
        for a in enriched:
            ts = a.get("submitted_at") or a.get("created_at") or ""
            bucket_idx = 3
            if ts:
                try:
                    dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    days_ago = max(0, (now_dt - dt).days)
                    if days_ago >= 21:
                        bucket_idx = 0
                    elif days_ago >= 14:
                        bucket_idx = 1
                    elif days_ago >= 7:
                        bucket_idx = 2
                    else:
                        bucket_idx = 3
                except ValueError:
                    bucket_idx = 3
            week_buckets[bucket_idx]["submitted"] += 1
            if a["stage"] in ("INTERVIEW", "OFFER"):
                week_buckets[bucket_idx]["interviews"] += 1

        return {
            "total_applications": len(enriched),
            "stage_counts": stage_counts,
            "next_actions": next_actions[:6],
            "weekly_velocity": [
                {"week": b["label"], "submitted": b["submitted"], "interviews": b["interviews"]}
                for b in week_buckets
            ],
        }

    # ---------------- Application Detail, Stage, Cover Letter & Refinement ---------------- #
    def _find_application(application_id: str) -> Optional[Dict[str, Any]]:
        apps = list_applications_fn().get("applications", [])
        for a in apps:
            if a.get("application_id") == application_id or a.get("id") == application_id:
                return a
        return None

    @router.get("/applications/snapshots")
    def list_application_snapshots(limit: int = 50, status: Optional[str] = None):
        return {"snapshots": store.list_submitted_snapshots(limit=limit, status=status)}

    @router.get("/applications/{application_id}")
    def get_application_detail(application_id: str):
        app_row = _find_application(application_id)
        ext = store.get_application_ext(application_id)
        snapshot = store.get_submitted_snapshot(application_id)
        if not app_row and not ext.get("updated_at") and not snapshot:
            raise HTTPException(status_code=404, detail=f"Application {application_id} not found")

        base = app_row or {
            "id": application_id,
            "application_id": application_id,
            "status": (snapshot or {}).get("status") or ext.get("stage") or "PREPARED",
            "company_name": (snapshot or {}).get("company_name") or "Target Company",
            "job_title": (snapshot or {}).get("job_title") or "Software Engineer",
            "destination_url": (snapshot or {}).get("destination_url") or "https://boards.greenhouse.io",
            "confirmation_number": (snapshot or {}).get("confirmation_number"),
            "payload_hash": (snapshot or {}).get("payload_hash") or hashlib.sha256(application_id.encode()).hexdigest(),
            "submitted_at": (snapshot or {}).get("submitted_at") or ext.get("updated_at"),
        }
        effective_stage = (ext["stage"] or base.get("status") or "CONFIRMED").upper()
        return {
            "application": {**base, "stage": effective_stage},
            "workspace": ext,
            "snapshot": snapshot,
        }

    @router.get("/applications/{application_id}/preview")
    def get_application_preview(application_id: str):
        snapshot = store.get_submitted_snapshot(application_id)
        if not snapshot:
            raise HTTPException(status_code=404, detail=f"No submitted snapshot found for {application_id}")
        return snapshot

    @router.post("/applications/{application_id}/confirm-submitted")
    def confirm_submitted_snapshot(application_id: str, req: Dict[str, Any] = Body(default={})):
        updated = store.update_snapshot_status(
            application_id=application_id,
            status="CONFIRMED",
            confirmation_number=req.get("confirmation_number"),
            screenshot_key=req.get("screenshot_key"),
            user_notes=req.get("user_notes"),
        )
        if not updated:
            raise HTTPException(status_code=404, detail=f"Snapshot {application_id} not found")
        store.upsert_application_ext(application_id=application_id, stage="CONFIRMED", notes=req.get("user_notes"))
        store.create_notification(
            title=f"Application Confirmed: {updated.get('company_name')}",
            body=f"Confirmed submission for {updated.get('job_title')}.",
            category="application",
            href=f"/applications/{application_id}",
        )
        return updated

    @router.patch("/applications/{application_id}/stage")
    def update_application_stage(application_id: str, req: StageUpdateRequest):
        valid = {"PREPARED", "NEEDS_APPROVAL", "CONFIRMED", "INTERVIEW", "OFFER", "ARCHIVED"}
        stage = req.stage.upper()
        if stage not in valid:
            raise HTTPException(status_code=400, detail=f"Invalid stage {stage}. Must be one of {sorted(valid)}")
        ext = store.upsert_application_ext(application_id=application_id, stage=stage)
        return {"status": "UPDATED", "application_id": application_id, "stage": ext["stage"]}

    @router.post("/applications/{application_id}/notes")
    def update_application_notes(application_id: str, req: NotesUpdateRequest):
        ext = store.upsert_application_ext(application_id=application_id, notes=req.notes)
        return {"status": "SAVED", "workspace": ext}

    @router.post("/applications/{application_id}/cover-letter")
    def generate_cover_letter(application_id: str, req: CoverLetterRequest):
        profile = get_profile_fn()
        if not profile:
            raise HTTPException(status_code=400, detail="Candidate profile not initialized")

        app_row = _find_application(application_id) or {}
        company = req.company_name or app_row.get("company_name") or "your engineering team"
        role = req.job_title or app_row.get("job_title") or "Software Engineer"

        # Strictly ground in verified evidence items from the candidate profile
        evidence_lines = []
        for ev in (profile.evidence or [])[:3]:
            cite = f" ({ev.metric_citation})" if ev.metric_citation else ""
            evidence_lines.append(f"- {ev.verified_claim}{cite} [{ev.id}]")
        if not evidence_lines:
            evidence_lines = [f"- Core proficiency in {', '.join((profile.skills or ['Python', 'TypeScript'])[:5])}"]

        opening = (
            f"Dear {company} Hiring Team,\n\n"
            f"I am applying for the {role} position at {company}. "
            if req.tone != "Startup"
            else f"Hi {company} team,\n\nI'm excited to apply for {role} at {company}. "
        )
        body = (
            "Every point below comes directly from my verified work history:\n\n"
            + "\n".join(evidence_lines)
            + f"\n\nWith hands-on experience in {', '.join((profile.skills or [])[:6])}, "
            f"I would welcome the chance to contribute to {company}'s roadmap.\n\n"
            f"Best regards,\n{profile.full_name}\n{profile.email} | {profile.phone}"
        )
        letter = opening + body

        ext = store.get_application_ext(application_id)
        history = list(ext.get("refinement_history") or [])
        if ext.get("cover_letter"):
            history.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "instruction": f"Generated ({req.tone} tone)",
                "previous_cover_letter": ext["cover_letter"],
            })
        updated = store.upsert_application_ext(
            application_id=application_id,
            cover_letter=letter,
            refinement_history=history[-10:],
        )
        return {"status": "GENERATED", "cover_letter": letter, "workspace": updated}

    @router.post("/applications/{application_id}/refine")
    def refine_application_document(application_id: str, req: RefineRequest):
        ext = store.get_application_ext(application_id)
        history = list(ext.get("refinement_history") or [])
        target_field = "notes" if req.target == "notes" else "cover_letter"

        if req.undo:
            if not history:
                raise HTTPException(status_code=400, detail="No previous version to undo to")
            last = history.pop()
            if "previous_notes" in last and target_field == "notes":
                restored_notes = last.get("previous_notes", "")
                updated = store.upsert_application_ext(
                    application_id=application_id,
                    notes=restored_notes,
                    refinement_history=history,
                )
                return {"status": "UNDONE", "target": "notes", "notes": restored_notes, "cover_letter": updated.get("cover_letter", ""), "workspace": updated}
            restored = last.get("previous_cover_letter", "")
            updated = store.upsert_application_ext(
                application_id=application_id,
                cover_letter=restored,
                refinement_history=history,
            )
            return {"status": "UNDONE", "target": "cover_letter", "cover_letter": restored, "workspace": updated}

        current = ext.get(target_field) or ""
        if not current:
            msg = (
                "Add notes first before refining"
                if target_field == "notes"
                else "Generate a cover letter first before refining"
            )
            raise HTTPException(status_code=400, detail=msg)

        instruction_lower = req.instruction.lower()
        history_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "instruction": req.instruction,
            "target": target_field,
        }
        if target_field == "notes":
            history_entry["previous_notes"] = current
        else:
            history_entry["previous_cover_letter"] = current
        history.append(history_entry)

        # Deterministic, truthful refinement without inventing any facts
        refined = current
        if "shorter" in instruction_lower or "concise" in instruction_lower:
            lines = [ln for ln in current.splitlines() if ln.strip()]
            if target_field == "notes":
                refined = "\n".join(lines[:3]) if len(lines) > 3 else current
            else:
                refined = "\n\n".join(lines[:5] + lines[-2:]) if len(lines) > 7 else current
        elif ("metric" in instruction_lower or "impact" in instruction_lower) and target_field == "cover_letter":
            profile = get_profile_fn()
            skills_str = ", ".join((profile.skills or [])[:4]) if profile else "verified stack"
            refined = current.replace(
                "I would welcome the chance",
                f"Focused on measurable reliability and delivery ({skills_str}), I would welcome the chance",
            )
        else:
            refined = current + f"\n\n[Refinement note applied: {req.instruction}]"

        if target_field == "notes":
            updated = store.upsert_application_ext(
                application_id=application_id,
                notes=refined,
                refinement_history=history[-10:],
            )
            return {"status": "REFINED", "target": "notes", "notes": refined, "cover_letter": updated.get("cover_letter", ""), "workspace": updated}

        updated = store.upsert_application_ext(
            application_id=application_id,
            cover_letter=refined,
            refinement_history=history[-10:],
        )
        return {"status": "REFINED", "target": "cover_letter", "cover_letter": refined, "workspace": updated}

    # ---------------- Follow-ups CRM ---------------- #
    @router.get("/outreach/follow-ups")
    def list_follow_ups():
        items = store.list_follow_ups()
        return {"total": len(items), "follow_ups": items}

    @router.post("/outreach/follow-ups")
    def create_follow_up(req: FollowUpCreateRequest):
        record = store.upsert_follow_up(req.model_dump())
        return {"status": "CREATED", "follow_up": record}

    @router.patch("/outreach/follow-ups/{follow_up_id}")
    def patch_follow_up(follow_up_id: str, req: FollowUpPatchRequest):
        updated = store.update_follow_up(follow_up_id, req.model_dump(exclude_none=True))
        if not updated:
            raise HTTPException(status_code=404, detail=f"Follow-up {follow_up_id} not found")
        return {"status": "UPDATED", "follow_up": updated}

    # ---------------- Targeting Preferences ---------------- #
    @router.get("/preferences")
    def get_preferences():
        default_prefs = {
            "min_salary": "₹10,00,000",
            "work_mode": "Hybrid",
            "notice_period": "15 Days",
            "sponsorship_required": False,
            "target_role": "Full Stack Engineer",
            "headline": "Full Stack Engineer (Python, React, FastAPI)",
        }
        saved = store.get_preference("targeting", default_prefs)
        return {"preferences": saved}

    @router.post("/preferences")
    def save_preferences(req: PreferencesPayload):
        saved = store.set_preference("targeting", req.model_dump())
        profile = get_profile_fn()
        if profile:
            days = 0
            if "15" in req.notice_period:
                days = 15
            elif "30" in req.notice_period:
                days = 30
            elif "60" in req.notice_period:
                days = 60
            profile.notice_period_days = days
        return {"status": "SAVED", "preferences": saved}

    # ---------------- Resume Themes & List ---------------- #
    @router.get("/resumes/themes")
    def list_resume_themes():
        custom = store.get_preference("custom_themes", [])
        active = store.get_preference("active_theme", "classic")
        return {
            "active_theme": active,
            "builtin_themes": BUILTIN_THEMES,
            "custom_themes": custom,
            "total": len(BUILTIN_THEMES) + len(custom),
        }

    @router.post("/resumes/themes")
    def save_custom_theme(req: CustomThemeRequest):
        custom = list(store.get_preference("custom_themes", []))
        theme_id = req.id or f"custom-{uuid.uuid4().hex[:6]}"
        entry = {**req.model_dump(), "id": theme_id}
        custom = [t for t in custom if t["id"] != theme_id] + [entry]
        store.set_preference("custom_themes", custom)
        store.set_preference("active_theme", theme_id)
        return {"status": "SAVED", "theme": entry, "custom_themes": custom}

    @router.get("/resumes/list")
    def list_tailored_resumes():
        resumes = get_resumes_fn()
        items = []
        for r_id, r in resumes.items():
            items.append(r.model_dump() if hasattr(r, "model_dump") else r)
        return {"total": len(items), "resumes": items}

    # ---------------- Full-Bundle Account Import / Restore ---------------- #
    @router.post("/account/import")
    def import_account_bundle(req: AccountImportRequest):
        restored = {"profile": False, "saved_jobs": 0, "follow_ups": 0, "preferences": False, "custom_themes": 0}
        if req.profile:
            try:
                set_profile_fn(req.profile)
            except (ValidationError, ValueError, TypeError) as exc:
                raise HTTPException(status_code=400, detail=f"Invalid profile payload: {exc}") from exc
            restored["profile"] = True
        if req.saved_jobs:
            for sj in req.saved_jobs:
                store.save_job(sj)
                restored["saved_jobs"] += 1
        if req.follow_ups:
            for fu in req.follow_ups:
                store.upsert_follow_up(fu)
                restored["follow_ups"] += 1
        if req.preferences:
            store.set_preference("targeting", req.preferences)
            restored["preferences"] = True
        if req.custom_themes:
            store.set_preference("custom_themes", req.custom_themes)
            restored["custom_themes"] = len(req.custom_themes)
        return {"status": "IMPORTED", "restored": restored}

    # ---------------- Notifications & Global Search ---------------- #
    @router.get("/notifications")
    def list_notifications():
        items = store.list_notifications()
        unread = sum(1 for n in items if not n["is_read"])
        return {"unread_count": unread, "notifications": items}

    @router.post("/notifications/{notif_id}/read")
    def mark_notification_read(notif_id: str):
        store.mark_notification_read(notif_id)
        return {"status": "READ", "id": notif_id}

    @router.post("/notifications/read-all")
    def mark_all_notifications_read():
        store.mark_notification_read(None)
        return {"status": "ALL_READ"}

    @router.get("/search")
    def global_search(q: str = ""):
        term = q.strip().lower()
        results: List[Dict[str, Any]] = []
        if not term:
            return {"query": q, "results": []}

        # Search jobs
        for job in get_jobs_fn().values():
            title = getattr(job, "job_title", "")
            comp = getattr(job, "company_name", "")
            if term in title.lower() or term in comp.lower():
                results.append({"type": "job", "title": title, "subtitle": comp, "href": "/jobs"})

        # Search startups
        for st in store.list_startups():
            if term in st["company_name"].lower() or term in st["role_title"].lower() or any(term in s.lower() for s in st["stack"]):
                results.append({"type": "startup", "title": f"{st['company_name']} — {st['role_title']}", "subtitle": f"{st['source']} ({st['batch']})", "href": "/jobs?tab=startups"})

        # Search applications
        for app_item in list_applications_fn().get("applications", []):
            comp = app_item.get("company_name", "")
            role = app_item.get("job_title", "")
            aid = app_item.get("application_id") or app_item.get("id")
            if term in comp.lower() or term in role.lower():
                results.append({"type": "application", "title": f"{role} @ {comp}", "subtitle": app_item.get("status", "TRACKED"), "href": f"/applications/{aid}"})

        return {"query": q, "results": results[:12]}

    # ---------------- Job Detail Lookup ---------------- #
    @router.get("/jobs/detail/{job_id}")
    def get_job_detail(job_id: str):
        jobs_map = get_jobs_fn()
        job = jobs_map.get(job_id)
        if job:
            return {
                "job": job.model_dump() if hasattr(job, "model_dump") else job,
                "source_type": "live_store",
            }
        for sj in store.list_saved_jobs():
            if sj.get("job_id") == job_id:
                return {
                    "job": {
                        "id": sj["job_id"],
                        "job_title": sj["title"],
                        "company_name": sj["company"],
                        "location_raw": sj["location"],
                        "work_mode": sj["work_mode"],
                        "source_name": sj["source"],
                        "canonical_url": sj["canonical_url"],
                        "jd_raw_text": sj["jd_raw_text"],
                        "fit_score": sj["score"],
                    },
                    "source_type": "saved_job",
                }
        for st in store.list_startups():
            if st.get("id") == job_id:
                return {
                    "job": {
                        "id": st["id"],
                        "job_title": st["role_title"],
                        "company_name": st["company_name"],
                        "location_raw": st["location"],
                        "work_mode": "Remote" if st["is_remote"] else "Hybrid",
                        "source_name": st["source"],
                        "canonical_url": st["apply_url"],
                        "jd_raw_text": st["summary"],
                        "required_skills": st["stack"],
                        "compensation": st["compensation"],
                    },
                    "source_type": "startup",
                }
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return router
