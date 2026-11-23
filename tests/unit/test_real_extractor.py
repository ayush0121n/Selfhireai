"""
Unit tests for SelfHire.ai Real Job Extractor & Discovery Endpoints.
Verifies:
- JSON-LD and semantic HTML parsing
- Platform policy restriction (LinkedIn/Indeed)
- Deduplication by canonical_url and SHA-256 jd_hash
- Explainable fit score calculation
- API endpoints: /jobs/sources, /jobs/companies, /jobs/live, /jobs/discover
"""

import json
import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.engine.discovery.real_extractor import RealJobExtractor

client = TestClient(app)


def test_extractor_parses_schema_org_json_ld():
    extractor = RealJobExtractor()
    html = """
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Senior Python & React Engineer",
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Acme Cloud"
          },
          "jobLocation": {
            "address": {
              "addressLocality": "Bengaluru",
              "addressCountry": "India"
            }
          },
          "employmentType": "FULL_TIME",
          "description": "We need a Senior Full-Stack Engineer with strong Python, FastAPI, React, Docker, and PostgreSQL experience."
        }
        </script>
      </head>
      <body></body>
    </html>
    """
    job = extractor.extract_from_html(html, "https://acme.com/jobs/senior-fullstack")
    assert job is not None
    assert job["title"] == "Senior Python & React Engineer"
    assert job["company_name"] == "Acme Cloud"
    assert "Bengaluru" in job["location_raw"]
    assert "Python" in job["extracted_keywords"]
    assert "FastAPI" in job["extracted_keywords"]
    assert "React" in job["extracted_keywords"]
    assert "PostgreSQL" in job["extracted_keywords"]
    assert len(job["jd_hash"]) == 64


def test_extractor_policy_restriction_gate():
    extractor = RealJobExtractor()
    assert extractor.is_policy_restricted("https://www.linkedin.com/jobs/view/12345") is True
    assert extractor.is_policy_restricted("https://in.indeed.com/viewjob?jk=abcdef") is True
    assert extractor.is_policy_restricted("https://jobicy.com/jobs/python-dev") is False
    assert extractor.is_policy_restricted("https://boards.greenhouse.io/stripe/jobs/1") is False

    # Calling import endpoint with LinkedIn URL must return 403 Forbidden
    resp = client.post("/api/v1/jobs/import", json={"url": "https://www.linkedin.com/jobs/view/99999"})
    assert resp.status_code == 403
    assert "Platform policy restricts" in resp.json()["detail"]


def test_extractor_deduplication_and_fit_score(tmp_path):
    test_db = str(tmp_path / "test_dedup.db")
    import sqlite3
    conn = sqlite3.connect(test_db)
    conn.execute("""
        CREATE TABLE jobs (
            id TEXT PRIMARY KEY,
            source_id TEXT,
            source_name TEXT,
            company_name TEXT NOT NULL,
            title TEXT NOT NULL,
            canonical_url TEXT NOT NULL UNIQUE,
            location_raw TEXT,
            work_mode TEXT DEFAULT 'REMOTE',
            salary_raw TEXT,
            jd_text TEXT,
            jd_hash TEXT NOT NULL,
            extracted_keywords TEXT,
            first_seen_at TEXT,
            last_verified_at TEXT,
            is_live INTEGER DEFAULT 1
        )
    """)
    conn.execute("""
        CREATE TABLE job_matches (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            overall_match_percentage INTEGER NOT NULL,
            matched_skills TEXT,
            missing_skills TEXT,
            match_explanation TEXT,
            computed_at TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            location TEXT,
            structured_data TEXT
        )
    """)
    profile = {
        "user_id": "usr_test",
        "target_role": "Full Stack Engineer",
        "skills": ["Python", "React", "FastAPI", "PostgreSQL"],
        "preferred_locations": ["Remote", "Bengaluru"],
        "summary": "Full Stack developer experienced in Python, React, FastAPI."
    }
    conn.execute("INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?)", (
        "usr_test", "Test User", "test@example.com", "+919999999999", "Remote", json.dumps(profile)
    ))
    conn.commit()
    conn.close()

    extractor = RealJobExtractor(db_path=test_db)
    raw_job = {
        "title": "Full Stack Software Engineer",
        "company_name": "Nova Labs",
        "canonical_url": "https://nova.ai/careers/fs-eng",
        "location_raw": "Remote",
        "work_mode": "REMOTE",
        "salary_raw": "$120,000 - $140,000",
        "jd_text": "Building SaaS platforms with Python, FastAPI, React, and PostgreSQL.",
        "jd_hash": extractor.compute_jd_hash("Building SaaS platforms with Python, FastAPI, React, and PostgreSQL."),
        "extracted_keywords": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"]
    }

    # First insert
    saved1 = extractor.deduplicate_and_save([raw_job], candidate_user_id="usr_test")
    assert len(saved1) == 1
    assert saved1[0]["fit_score"]["overall_match_percentage"] >= 60
    assert "Python" in saved1[0]["fit_score"]["matched_skills"]
    assert "Docker" in saved1[0]["fit_score"]["missing_skills"]

    # Second insert with same canonical_url - must deduplicate
    saved2 = extractor.deduplicate_and_save([raw_job], candidate_user_id="usr_test")
    assert len(saved2) == 1
    assert saved2[0]["id"] == saved1[0]["id"]

    # Verify database count is 1, not 2
    conn = sqlite3.connect(test_db)
    cnt = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
    conn.close()
    assert cnt == 1


def test_api_jobs_sources_endpoint():
    resp = client.get("/api/v1/jobs/sources?limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] > 1000
    assert len(data["sources"]) == 10
    assert "automation_mode" in data["sources"][0]
    assert "policy_status" in data["sources"][0]


def test_api_jobs_companies_endpoint():
    resp = client.get("/api/v1/jobs/companies?limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] > 600
    assert len(data["companies"]) == 10
    assert "ats_platform" in data["companies"][0]


def test_api_jobs_live_and_discovery_endpoints():
    # Test GET /api/v1/jobs/live
    resp = client.get("/api/v1/jobs/live?limit=10")
    assert resp.status_code == 200
    assert "jobs" in resp.json()

    # Test POST /api/v1/jobs/discover with empty payload (triggers standard discovery)
    resp = client.post("/api/v1/jobs/discover", json={"sources": ["Jobicy"], "limit_per_source": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "jobs" in data
