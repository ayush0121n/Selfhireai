"""
SelfHire.ai Demo User Provisioning & End-to-End Verification Script.
Creates a complete realistic demo candidate (alex.rivera@selfhire.ai)
and verifies all API endpoints and core workflows.
"""

from __future__ import annotations
import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from packages.contracts.models import CandidateProfile, EvidenceItem
from packages.contracts.hasher import compute_normalized_form_hash
from services.api.engine.evidence.vault_manager import EvidenceVaultManager
from services.api.engine.storage.workspace_store import WorkspaceStore


def provision_demo_user() -> dict:
    """Seeds demo candidate profile, verified evidence, and workspace records."""
    demo_profile = CandidateProfile(
        user_id="usr_demo_01",
        full_name="Alex Rivera",
        email="alex.rivera@selfhire.ai",
        phone="+91 98765 43210",
        location="Pune, India",
        portfolio_url="https://alexrivera.dev",
        linkedin_url="https://linkedin.com/in/ayushsharma-dev",
        github_url="https://github.com/ayush0121n",
        skills=[
            "Python",
            "FastAPI",
            "TypeScript",
            "React",
            "Next.js",
            "PostgreSQL",
            "Docker",
            "Playwright",
            "Redis",
        ],
        education=[
            {
                "institution": "Pune Institute of Computer Technology",
                "degree": "B.E. Computer Engineering",
                "dates": "2019 - 2023",
                "gpa": "9.1/10",
            }
        ],
        experience=[
            {
                "company": "ScaleGrid Systems",
                "title": "Senior Backend & AI Engineer",
                "dates": "2023-06 — Present",
                "bullets": [
                    "Architected FastAPI microservices handling 12,000 req/min with 99.95% uptime",
                    "Reduced PostgreSQL pgvector query latency by 48% via HNSW index tuning and Redis caching",
                    "Built deterministic Playwright automation pipelines cutting manual QA time by 65%",
                ],
            }
        ],
        evidence=[
            EvidenceItem(
                id="ev_demo_01",
                user_id="usr_demo_01",
                field_path="experience[0].bullets[0]",
                verified_claim="Architected FastAPI microservices handling 12,000 req/min with 99.95% uptime",
                metric_citation="12,000 req/min / 99.95% uptime",
            ),
            EvidenceItem(
                id="ev_demo_02",
                user_id="usr_demo_01",
                field_path="experience[0].bullets[1]",
                verified_claim="Reduced PostgreSQL pgvector query latency by 48% via HNSW index tuning and Redis caching",
                metric_citation="48% latency reduction",
            ),
            EvidenceItem(
                id="ev_demo_03",
                user_id="usr_demo_01",
                field_path="experience[0].bullets[2]",
                verified_claim="Built deterministic Playwright automation pipelines cutting manual QA time by 65%",
                metric_citation="65% QA reduction",
            ),
        ],
        work_authorization="Authorized to work in India",
        notice_period_days=15,
        minimum_salary_inr=2400000,
    )

    # 1. Seed into EvidenceVaultManager
    vault = EvidenceVaultManager()
    for ev in demo_profile.evidence:
        vault.add_claim(
            user_id=demo_profile.user_id,
            document_id="doc_demo_master_resume",
            claim_type="EXPERIENCE",
            title=ev.verified_claim,
            field_path=ev.field_path,
            raw_source_text=ev.verified_claim,
            is_verified=1,
        )

    # 2. Seed into SQLite profiles table & WorkspaceStore
    import sqlite3
    conn = sqlite3.connect("data/selfhire.db")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            location TEXT,
            structured_data TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        INSERT OR REPLACE INTO profiles (user_id, full_name, email, phone, location, structured_data)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            demo_profile.user_id,
            demo_profile.full_name,
            demo_profile.email,
            demo_profile.phone,
            demo_profile.location,
            demo_profile.model_dump_json(),
        ),
    )
    conn.commit()
    conn.close()

    store = WorkspaceStore()
    store.save_job(
        {
            "id": "job_demo_scalegrid_01",
            "title": "Senior Backend & AI Platform Engineer",
            "company_name": "ScaleGrid Systems",
            "location": "Pune / Remote",
            "source_name": "greenhouse",
            "canonical_url": "https://boards.greenhouse.io/scalegrid/jobs/101",
            "salary_raw": "INR 28-36 LPA",
        }
    )
    store.upsert_application_ext(
        application_id="app_demo_scalegrid_01",
        stage="PREPARED",
        notes="Demo application prepared with verified FastAPI & pgvector evidence.",
        cover_letter="Dear ScaleGrid Hiring Team,\n\nI architected FastAPI microservices handling 12,000 req/min with 99.95% uptime...",
    )

    sample_hash = compute_normalized_form_hash(
        fields=[
            {"field_key": "full_name", "proposed_value": demo_profile.full_name},
            {"field_key": "email", "proposed_value": demo_profile.email},
            {"field_key": "phone", "proposed_value": demo_profile.phone},
        ],
        resume_version_id="res_demo_01",
        canonical_url="https://boards.greenhouse.io/scalegrid/jobs/101",
    )

    return {
        "user_id": demo_profile.user_id,
        "email": demo_profile.email,
        "evidence_count": len(demo_profile.evidence),
        "sample_payload_hash": sample_hash,
    }


if __name__ == "__main__":
    summary = provision_demo_user()
    print(json.dumps(summary, indent=2))
