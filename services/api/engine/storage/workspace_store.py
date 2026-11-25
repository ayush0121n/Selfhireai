"""
Persistent SQLite Workspace Store for SelfHire.ai.
Stores saved jobs, application stages/notes/cover-letters/refinements,
follow-ups CRM, user preferences, resume themes, startups hiring, and notifications.
"""

from __future__ import annotations

import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = os.path.join("data", "selfhire_workspace.db")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


BUILTIN_THEMES: List[Dict[str, Any]] = [
    {"id": "classic", "name": "Classic Editorial", "accent": "#B34A0E", "bg": "#FFFFFF", "font": "Georgia, serif", "layout": "single-column", "density": "comfortable"},
    {"id": "modern-terracotta", "name": "Espresso & Terracotta", "accent": "#B34A0E", "bg": "#FEF5E7", "font": "Inter, sans-serif", "layout": "single-column", "density": "balanced"},
    {"id": "minimal-slate", "name": "Minimal Slate", "accent": "#1E293B", "bg": "#FFFFFF", "font": "Inter, sans-serif", "layout": "single-column", "density": "compact"},
    {"id": "executive-serif", "name": "Executive Serif", "accent": "#2D0E03", "bg": "#FFFDF9", "font": "Merriweather, serif", "layout": "single-column", "density": "comfortable"},
    {"id": "engineering-mono", "name": "Engineering Mono", "accent": "#0F766E", "bg": "#FFFFFF", "font": "JetBrains Mono, monospace", "layout": "two-column", "density": "compact"},
    {"id": "nordic-clean", "name": "Nordic Clean", "accent": "#2563EB", "bg": "#F8FAFC", "font": "Plus Jakarta Sans, sans-serif", "layout": "single-column", "density": "balanced"},
    {"id": "swiss-grid", "name": "Swiss Grid", "accent": "#DC2626", "bg": "#FFFFFF", "font": "Helvetica Neue, sans-serif", "layout": "two-column", "density": "compact"},
    {"id": "academic-cv", "name": "Academic CV", "accent": "#374151", "bg": "#FFFFFF", "font": "Times New Roman, serif", "layout": "single-column", "density": "dense"},
    {"id": "startup-bold", "name": "Startup Bold", "accent": "#EA580C", "bg": "#FFFFFF", "font": "Geist, sans-serif", "layout": "single-column", "density": "balanced"},
    {"id": "carbon-ledger", "name": "Carbon Ledger", "accent": "#18181B", "bg": "#FAFAFA", "font": "Inter, sans-serif", "layout": "two-column", "density": "compact"},
    {"id": "emerald-quant", "name": "Emerald Quant", "accent": "#047857", "bg": "#FFFFFF", "font": "IBM Plex Sans, sans-serif", "layout": "single-column", "density": "compact"},
    {"id": "ats-ultra-plain", "name": "ATS Ultra-Plain", "accent": "#000000", "bg": "#FFFFFF", "font": "Arial, sans-serif", "layout": "single-column", "density": "dense"},
]

SEED_STARTUPS: List[Dict[str, Any]] = [
    {
        "id": "startup-yc-01",
        "company_name": "Meridian AI",
        "source": "YC Startups",
        "batch": "W25",
        "role_title": "Full Stack Product Engineer",
        "location": "San Francisco / Remote (India & Global)",
        "is_remote": 1,
        "stack": json.dumps(["Python", "FastAPI", "React", "TypeScript", "PostgreSQL"]),
        "compensation": "$120k–$165k + 0.5% equity",
        "apply_email": "founders@meridianai.dev",
        "apply_url": "https://www.ycombinator.com/companies",
        "summary": "Building deterministic agentic workflows for enterprise compliance. Small 6-person team shipping daily.",
        "posted_at": "2026-11-23",
    },
    {
        "id": "startup-hn-01",
        "company_name": "Kestrel Data Systems",
        "source": "HN Who is Hiring",
        "batch": "Nov 2026",
        "role_title": "Backend Systems Engineer (Python / Postgres)",
        "location": "Remote (UTC+0 to UTC+6)",
        "is_remote": 1,
        "stack": json.dumps(["Python", "PostgreSQL", "Docker", "Redis", "FastAPI"]),
        "compensation": "$110k–$150k",
        "apply_email": "jobs@kestreldata.io",
        "apply_url": "https://news.ycombinator.com/jobs",
        "summary": "High-throughput event ingestion and SQL query engine. Looking for engineers who care about p99 latency.",
        "posted_at": "2026-11-22",
    },
    {
        "id": "startup-yc-02",
        "company_name": "FinStack Ledger",
        "source": "YC Startups",
        "batch": "S24",
        "role_title": "Software Engineer — Core API & Integrations",
        "location": "Bengaluru / Remote",
        "is_remote": 1,
        "stack": json.dumps(["Python", "TypeScript", "Next.js", "PostgreSQL", "Docker"]),
        "compensation": "₹24L–₹38L + ESOPs",
        "apply_email": "hiring@finstackledger.com",
        "apply_url": "https://www.ycombinator.com/companies",
        "summary": "Automated reconciliation & treasury APIs for high-growth SaaS companies across India and SEA.",
        "posted_at": "2026-11-21",
    },
    {
        "id": "startup-hn-02",
        "company_name": "OrbitOps Cloud",
        "source": "HN Who is Hiring",
        "batch": "Nov 2026",
        "role_title": "Platform & DevTools Engineer",
        "location": "Remote (Global)",
        "is_remote": 1,
        "stack": json.dumps(["Docker", "Kubernetes", "Python", "TypeScript", "Git"]),
        "compensation": "$130k–$170k",
        "apply_email": "careers@orbitops.sh",
        "apply_url": "https://news.ycombinator.com/jobs",
        "summary": "Self-hosted preview environments and CI runners with sub-second cold starts.",
        "posted_at": "2026-11-20",
    },
    {
        "id": "startup-yc-03",
        "company_name": "Verve Health OS",
        "source": "YC Startups",
        "batch": "W26",
        "role_title": "Junior Full Stack Engineer",
        "location": "Pune / Hybrid",
        "is_remote": 0,
        "stack": json.dumps(["React", "Next.js", "Python", "FastAPI", "PostgreSQL"]),
        "compensation": "₹14L–₹22L + equity",
        "apply_email": "eng@vervehealth.in",
        "apply_url": "https://www.ycombinator.com/companies",
        "summary": "Clinical workflow automation and EHR interoperability for multi-specialty clinics.",
        "posted_at": "2026-11-19",
    },
]

SEED_FOLLOW_UPS: List[Dict[str, Any]] = [
    {
        "id": "fu-01",
        "recruiter_name": "Sarah Jenkins",
        "recruiter_title": "Staff Technical Recruiter",
        "company": "Stripe",
        "role": "Staff Infrastructure Engineer",
        "channel": "Email",
        "initial_sent_date": "2026-11-18",
        "stage": "Day 7 Value-Add",
        "due_status": "DUE_TODAY",
        "suggested_subject": "Re: Staff Infrastructure Engineer at Stripe — distributed caching benchmark",
        "suggested_body": (
            "Hi Sarah,\n\nFollowing up on my application last week. "
            "I wanted to share a quick note on how I optimized FastAPI + Redis worker pools to cut webhook latency by 42% at scale.\n\n"
            "Happy to share a 10-minute walkthrough if helpful for your Q4 engineering slate."
        ),
    },
    {
        "id": "fu-02",
        "recruiter_name": "David Chen",
        "recruiter_title": "Head of Talent",
        "company": "Meridian AI",
        "role": "Full Stack Product Engineer",
        "channel": "LinkedIn",
        "initial_sent_date": "2026-11-22",
        "stage": "Day 3 Bump",
        "due_status": "SCHEDULED",
        "suggested_subject": "Quick follow-up — Full Stack Product Engineer",
        "suggested_body": (
            "Hi David, following up to check if my background in FastAPI, React, and PostgreSQL caught your team's eye. "
            "Would love to connect!"
        ),
    },
    {
        "id": "fu-03",
        "recruiter_name": "Priya Sharma",
        "recruiter_title": "Principal Recruiter",
        "company": "Ramp",
        "role": "Senior Backend Systems Engineer",
        "channel": "Email",
        "initial_sent_date": "2026-11-11",
        "stage": "Day 14 Final Check",
        "due_status": "DUE_TODAY",
        "suggested_subject": "Closing the loop — Senior Backend Systems Engineer at Ramp",
        "suggested_body": (
            "Hi Priya,\n\nI understand your team's schedule is busy. Closing the loop on my application for the Senior Backend Systems Engineer role. "
            "If headcount has been filled, I would still love to stay connected for future backend openings."
        ),
    },
]


class WorkspaceStore:
    def __init__(self, db_path: str = DEFAULT_DB_PATH) -> None:
        self.db_path = db_path
        parent = os.path.dirname(self.db_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS saved_jobs (
                    job_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    location TEXT NOT NULL,
                    work_mode TEXT DEFAULT 'Remote',
                    score INTEGER DEFAULT 0,
                    source TEXT DEFAULT 'ATS',
                    canonical_url TEXT DEFAULT '',
                    jd_raw_text TEXT DEFAULT '',
                    saved_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS application_extensions (
                    application_id TEXT PRIMARY KEY,
                    stage TEXT NOT NULL DEFAULT 'CONFIRMED',
                    notes TEXT DEFAULT '',
                    cover_letter TEXT DEFAULT '',
                    tailored_bullets_json TEXT DEFAULT '[]',
                    refinement_history_json TEXT DEFAULT '[]',
                    interview_at TEXT DEFAULT '',
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS follow_ups (
                    id TEXT PRIMARY KEY,
                    recruiter_name TEXT NOT NULL,
                    recruiter_title TEXT DEFAULT '',
                    company TEXT NOT NULL,
                    role TEXT NOT NULL,
                    channel TEXT DEFAULT 'Email',
                    initial_sent_date TEXT NOT NULL,
                    stage TEXT DEFAULT 'Day 3 Bump',
                    due_status TEXT DEFAULT 'DUE_TODAY',
                    suggested_subject TEXT DEFAULT '',
                    suggested_body TEXT DEFAULT '',
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS user_preferences (
                    key TEXT PRIMARY KEY,
                    value_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS startups_hiring (
                    id TEXT PRIMARY KEY,
                    company_name TEXT NOT NULL,
                    source TEXT NOT NULL,
                    batch TEXT DEFAULT '',
                    role_title TEXT NOT NULL,
                    location TEXT NOT NULL,
                    is_remote INTEGER DEFAULT 1,
                    stack TEXT DEFAULT '[]',
                    compensation TEXT DEFAULT '',
                    apply_email TEXT DEFAULT '',
                    apply_url TEXT DEFAULT '',
                    summary TEXT DEFAULT '',
                    posted_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL,
                    category TEXT DEFAULT 'info',
                    href TEXT DEFAULT '/dashboard',
                    is_read INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS submitted_snapshots (
                    application_id TEXT PRIMARY KEY,
                    job_id TEXT,
                    company_name TEXT NOT NULL,
                    job_title TEXT NOT NULL,
                    destination_url TEXT,
                    submission_mode TEXT NOT NULL,
                    confirmation_number TEXT,
                    filled_fields_json TEXT NOT NULL,
                    resume_summary TEXT,
                    payload_hash TEXT,
                    ats_detected TEXT,
                    fill_success_rate REAL,
                    status TEXT DEFAULT 'CONFIRMED',
                    user_notes TEXT,
                    screenshot_key TEXT,
                    submitted_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_snapshots_status ON submitted_snapshots(status);
                CREATE INDEX IF NOT EXISTS idx_snapshots_submitted ON submitted_snapshots(submitted_at DESC);
                """
            )
            # Seed startups if empty
            count_startups = conn.execute("SELECT COUNT(*) FROM startups_hiring").fetchone()[0]
            if count_startups == 0:
                for st in SEED_STARTUPS:
                    conn.execute(
                        """
                        INSERT INTO startups_hiring
                        (id, company_name, source, batch, role_title, location, is_remote, stack, compensation, apply_email, apply_url, summary, posted_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            st["id"], st["company_name"], st["source"], st["batch"],
                            st["role_title"], st["location"], st["is_remote"], st["stack"],
                            st["compensation"], st["apply_email"], st["apply_url"],
                            st["summary"], st["posted_at"],
                        ),
                    )
            # Seed follow-ups if empty
            count_fu = conn.execute("SELECT COUNT(*) FROM follow_ups").fetchone()[0]
            if count_fu == 0:
                now = _utc_now_iso()
                for fu in SEED_FOLLOW_UPS:
                    conn.execute(
                        """
                        INSERT INTO follow_ups
                        (id, recruiter_name, recruiter_title, company, role, channel, initial_sent_date, stage, due_status, suggested_subject, suggested_body, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            fu["id"], fu["recruiter_name"], fu["recruiter_title"],
                            fu["company"], fu["role"], fu["channel"],
                            fu["initial_sent_date"], fu["stage"], fu["due_status"],
                            fu["suggested_subject"], fu["suggested_body"], now,
                        ),
                    )
            # Seed initial notifications if empty
            count_notif = conn.execute("SELECT COUNT(*) FROM notifications").fetchone()[0]
            if count_notif == 0:
                now = _utc_now_iso()
                seed_notifs = [
                    ("notif-1", "2 Follow-ups Due Today", "Stripe & Ramp recruiter follow-ups are ready for review.", "outreach", "/outreach/follow-ups", 0, now),
                    ("notif-2", "Startups Hiring Feed Updated", "5 YC & Hacker News startups matched against your verified stack.", "discovery", "/jobs?tab=startups", 0, now),
                    ("notif-3", "Exact-Action Approval Gate Active", "All external submissions require SHA-256 confirmation (30m TTL).", "security", "/approvals", 0, now),
                ]
                conn.executemany(
                    "INSERT INTO notifications (id, title, body, category, href, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    seed_notifs,
                )

    # ---- Saved Jobs ---- #
    def list_saved_jobs(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM saved_jobs ORDER BY saved_at DESC").fetchall()
            return [dict(r) for r in rows]

    def save_job(self, item: Dict[str, Any]) -> Dict[str, Any]:
        now = _utc_now_iso()
        job_id = str(item.get("job_id") or item.get("id") or f"saved_{uuid.uuid4().hex[:8]}")
        record = {
            "job_id": job_id,
            "title": item.get("title") or item.get("job_title") or "Untitled Role",
            "company": item.get("company") or item.get("company_name") or "Unknown Company",
            "location": item.get("location") or "Remote",
            "work_mode": item.get("work_mode") or "Remote",
            "score": int(item.get("score") or 0),
            "source": item.get("source") or item.get("source_name") or "ATS",
            "canonical_url": item.get("canonical_url") or "",
            "jd_raw_text": item.get("jd_raw_text") or "",
            "saved_at": now,
        }
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO saved_jobs (job_id, title, company, location, work_mode, score, source, canonical_url, jd_raw_text, saved_at)
                VALUES (:job_id, :title, :company, :location, :work_mode, :score, :source, :canonical_url, :jd_raw_text, :saved_at)
                ON CONFLICT(job_id) DO UPDATE SET
                    title=excluded.title,
                    company=excluded.company,
                    location=excluded.location,
                    work_mode=excluded.work_mode,
                    score=excluded.score,
                    source=excluded.source,
                    canonical_url=excluded.canonical_url,
                    jd_raw_text=excluded.jd_raw_text,
                    saved_at=excluded.saved_at
                """,
                record,
            )
        return record

    def remove_saved_job(self, job_id: str) -> bool:
        with self._connect() as conn:
            cur = conn.execute("DELETE FROM saved_jobs WHERE job_id = ?", (job_id,))
            return cur.rowcount > 0

    # ---- Application Extensions (Kanban stages, cover letter, notes, refinement history) ---- #
    def get_application_ext(self, application_id: str) -> Dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM application_extensions WHERE application_id = ?",
                (application_id,),
            ).fetchone()
            if not row:
                return {
                    "application_id": application_id,
                    "stage": None,
                    "notes": "",
                    "cover_letter": "",
                    "tailored_bullets": [],
                    "refinement_history": [],
                    "interview_at": "",
                    "updated_at": None,
                }
            d = dict(row)
            return {
                "application_id": d["application_id"],
                "stage": d["stage"],
                "notes": d["notes"] or "",
                "cover_letter": d["cover_letter"] or "",
                "tailored_bullets": json.loads(d["tailored_bullets_json"] or "[]"),
                "refinement_history": json.loads(d["refinement_history_json"] or "[]"),
                "interview_at": d["interview_at"] or "",
                "updated_at": d["updated_at"],
            }

    def list_application_exts(self) -> Dict[str, Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM application_extensions").fetchall()
            out: Dict[str, Dict[str, Any]] = {}
            for row in rows:
                d = dict(row)
                out[d["application_id"]] = {
                    "application_id": d["application_id"],
                    "stage": d["stage"],
                    "notes": d["notes"] or "",
                    "cover_letter": d["cover_letter"] or "",
                    "tailored_bullets": json.loads(d["tailored_bullets_json"] or "[]"),
                    "refinement_history": json.loads(d["refinement_history_json"] or "[]"),
                    "interview_at": d["interview_at"] or "",
                    "updated_at": d["updated_at"],
                }
            return out

    def upsert_application_ext(
        self,
        application_id: str,
        stage: Optional[str] = None,
        notes: Optional[str] = None,
        cover_letter: Optional[str] = None,
        tailored_bullets: Optional[List[Dict[str, Any]]] = None,
        refinement_history: Optional[List[Dict[str, Any]]] = None,
        interview_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        current = self.get_application_ext(application_id)
        now = _utc_now_iso()
        merged = {
            "application_id": application_id,
            "stage": stage if stage is not None else (current["stage"] or "CONFIRMED"),
            "notes": notes if notes is not None else current["notes"],
            "cover_letter": cover_letter if cover_letter is not None else current["cover_letter"],
            "tailored_bullets_json": json.dumps(tailored_bullets if tailored_bullets is not None else current["tailored_bullets"]),
            "refinement_history_json": json.dumps(refinement_history if refinement_history is not None else current["refinement_history"]),
            "interview_at": interview_at if interview_at is not None else current["interview_at"],
            "updated_at": now,
        }
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO application_extensions
                (application_id, stage, notes, cover_letter, tailored_bullets_json, refinement_history_json, interview_at, updated_at)
                VALUES (:application_id, :stage, :notes, :cover_letter, :tailored_bullets_json, :refinement_history_json, :interview_at, :updated_at)
                ON CONFLICT(application_id) DO UPDATE SET
                    stage=excluded.stage,
                    notes=excluded.notes,
                    cover_letter=excluded.cover_letter,
                    tailored_bullets_json=excluded.tailored_bullets_json,
                    refinement_history_json=excluded.refinement_history_json,
                    interview_at=excluded.interview_at,
                    updated_at=excluded.updated_at
                """,
                merged,
            )
        return self.get_application_ext(application_id)

    # ---- Follow-ups CRM ---- #
    def list_follow_ups(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM follow_ups ORDER BY updated_at DESC").fetchall()
            return [dict(r) for r in rows]

    def upsert_follow_up(self, item: Dict[str, Any]) -> Dict[str, Any]:
        now = _utc_now_iso()
        fid = str(item.get("id") or f"fu-{uuid.uuid4().hex[:8]}")
        record = {
            "id": fid,
            "recruiter_name": item.get("recruiter_name") or "Hiring Manager",
            "recruiter_title": item.get("recruiter_title") or "Talent Team",
            "company": item.get("company") or "Company",
            "role": item.get("role") or "Software Engineer",
            "channel": item.get("channel") or "Email",
            "initial_sent_date": item.get("initial_sent_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "stage": item.get("stage") or "Day 3 Bump",
            "due_status": item.get("due_status") or "DUE_TODAY",
            "suggested_subject": item.get("suggested_subject") or "",
            "suggested_body": item.get("suggested_body") or "",
            "updated_at": now,
        }
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO follow_ups
                (id, recruiter_name, recruiter_title, company, role, channel, initial_sent_date, stage, due_status, suggested_subject, suggested_body, updated_at)
                VALUES (:id, :recruiter_name, :recruiter_title, :company, :role, :channel, :initial_sent_date, :stage, :due_status, :suggested_subject, :suggested_body, :updated_at)
                ON CONFLICT(id) DO UPDATE SET
                    recruiter_name=excluded.recruiter_name,
                    recruiter_title=excluded.recruiter_title,
                    company=excluded.company,
                    role=excluded.role,
                    channel=excluded.channel,
                    initial_sent_date=excluded.initial_sent_date,
                    stage=excluded.stage,
                    due_status=excluded.due_status,
                    suggested_subject=excluded.suggested_subject,
                    suggested_body=excluded.suggested_body,
                    updated_at=excluded.updated_at
                """,
                record,
            )
        return record

    def update_follow_up(self, fid: str, patch: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM follow_ups WHERE id = ?", (fid,)).fetchone()
            if not row:
                return None
            current = dict(row)
            current.update({k: v for k, v in patch.items() if v is not None})
            current["updated_at"] = _utc_now_iso()
            conn.execute(
                """
                UPDATE follow_ups SET
                    due_status = :due_status,
                    stage = :stage,
                    suggested_subject = :suggested_subject,
                    suggested_body = :suggested_body,
                    updated_at = :updated_at
                WHERE id = :id
                """,
                current,
            )
            return current

    # ---- Preferences ---- #
    def get_preference(self, key: str, default: Any = None) -> Any:
        with self._connect() as conn:
            row = conn.execute("SELECT value_json FROM user_preferences WHERE key = ?", (key,)).fetchone()
            if not row:
                return default
            return json.loads(row["value_json"])

    def set_preference(self, key: str, value: Any) -> Any:
        now = _utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_preferences (key, value_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
                """,
                (key, json.dumps(value), now),
            )
        return value

    # ---- Startups ---- #
    def list_startups(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM startups_hiring ORDER BY posted_at DESC").fetchall()
            items = []
            for r in rows:
                d = dict(r)
                d["stack"] = json.loads(d["stack"] or "[]")
                d["is_remote"] = bool(d["is_remote"])
                items.append(d)
            return items

    # ---- Notifications ---- #
    def create_notification(
        self,
        title: str,
        body: str = "",
        category: str = "info",
        href: str = "/dashboard",
    ) -> Dict[str, Any]:
        notif_id = f"notif_{uuid.uuid4().hex[:10]}"
        now = _utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO notifications (id, title, body, category, href, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, 0, ?)
                """,
                (notif_id, title, body, category, href, now),
            )
        return {
            "id": notif_id,
            "title": title,
            "body": body,
            "category": category,
            "href": href,
            "is_read": False,
            "created_at": now,
        }

    def list_notifications(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30").fetchall()
            out = []
            for r in rows:
                d = dict(r)
                d["is_read"] = bool(d["is_read"])
                out.append(d)
            return out

    def mark_notification_read(self, notif_id: Optional[str] = None) -> None:
        with self._connect() as conn:
            if notif_id:
                conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notif_id,))
            else:
                conn.execute("UPDATE notifications SET is_read = 1")

    # ---- Submitted Application Snapshots ---- #
    def save_submitted_snapshot(
        self,
        application_id: str,
        company_name: str,
        job_title: str,
        filled_fields: List[Dict[str, Any]],
        submission_mode: str,
        job_id: Optional[str] = None,
        destination_url: Optional[str] = None,
        confirmation_number: Optional[str] = None,
        resume_summary: Optional[str] = None,
        payload_hash: Optional[str] = None,
        ats_detected: Optional[str] = None,
        fill_success_rate: Optional[float] = None,
        status: str = "CONFIRMED",
        user_notes: Optional[str] = None,
        screenshot_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = _utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO submitted_snapshots (
                    application_id, job_id, company_name, job_title, destination_url,
                    submission_mode, confirmation_number, filled_fields_json,
                    resume_summary, payload_hash, ats_detected, fill_success_rate,
                    status, user_notes, screenshot_key, submitted_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(application_id) DO UPDATE SET
                    confirmation_number = COALESCE(excluded.confirmation_number, submitted_snapshots.confirmation_number),
                    filled_fields_json = excluded.filled_fields_json,
                    status = excluded.status,
                    user_notes = COALESCE(excluded.user_notes, submitted_snapshots.user_notes),
                    screenshot_key = COALESCE(excluded.screenshot_key, submitted_snapshots.screenshot_key),
                    submitted_at = COALESCE(submitted_snapshots.submitted_at, excluded.submitted_at),
                    updated_at = excluded.updated_at
                """,
                (
                    application_id, job_id, company_name, job_title, destination_url,
                    submission_mode, confirmation_number, json.dumps(filled_fields),
                    resume_summary, payload_hash, ats_detected, fill_success_rate,
                    status, user_notes, screenshot_key, now, now, now,
                ),
            )
        return self.get_submitted_snapshot(application_id) or {}

    def get_submitted_snapshot(self, application_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM submitted_snapshots WHERE application_id = ?",
                (application_id,),
            ).fetchone()
            if not row:
                return None
            data = dict(row)
            data["filled_fields"] = json.loads(data.pop("filled_fields_json") or "[]")
            return data

    def list_submitted_snapshots(self, limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM submitted_snapshots"
        params: List[Any] = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY updated_at DESC LIMIT ?"
        params.append(limit)
        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()
            out = []
            for r in rows:
                d = dict(r)
                d["filled_fields"] = json.loads(d.pop("filled_fields_json") or "[]")
                out.append(d)
            return out

    def update_snapshot_status(
        self,
        application_id: str,
        status: str,
        confirmation_number: Optional[str] = None,
        screenshot_key: Optional[str] = None,
        user_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        now = _utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE submitted_snapshots
                SET status = ?,
                    confirmation_number = COALESCE(?, confirmation_number),
                    screenshot_key = COALESCE(?, screenshot_key),
                    user_notes = COALESCE(?, user_notes),
                    updated_at = ?,
                    submitted_at = COALESCE(submitted_at, ?)
                WHERE application_id = ?
                """,
                (status, confirmation_number, screenshot_key, user_notes, now, now, application_id),
            )
        return self.get_submitted_snapshot(application_id)

    def purge_all(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                DELETE FROM saved_jobs;
                DELETE FROM application_extensions;
                DELETE FROM follow_ups;
                DELETE FROM user_preferences;
                DELETE FROM notifications;
                DELETE FROM submitted_snapshots;
                """
            )
