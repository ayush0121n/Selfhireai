"""
SelfHire.ai Seed Database Script.
Imports all 106 portals, 1,838 recruiter contacts, and candidate profile facts into local SQLite / Supabase tables.
"""

import csv
import json
import os
import sqlite3
from typing import Any, Dict, List


def seed_database(db_path: str = "data/selfhire.db") -> Dict[str, int]:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Create tables if not exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            portal_name TEXT NOT NULL,
            domain TEXT,
            category TEXT,
            website_url TEXT,
            policy_url TEXT,
            description TEXT,
            automation_mode TEXT DEFAULT 'MANUAL_LINK',
            policy_status TEXT DEFAULT 'APPROVED',
            created_at TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            job_title TEXT,
            linkedin_url TEXT,
            company TEXT,
            location TEXT,
            company_website TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            location TEXT,
            structured_data TEXT NOT NULL
        )
    """)

    # 2. Seed 106 Job Portals
    sources_count = 0
    portal_csv = "data/job_sources_seed.csv"
    if os.path.exists(portal_csv):
        cur.execute("DELETE FROM job_sources")
        with open(portal_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                cur.execute("""
                    INSERT INTO job_sources (name, portal_name, category, website_url, description, policy_status)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    r.get("Portal Name", ""),
                    r.get("Portal Name", ""),
                    r.get("Category", ""),
                    r.get("Website URL", ""),
                    r.get("Description", ""),
                    "APPROVED"
                ))
                sources_count += 1

    # 3. Seed 1,838 Recruiter Contacts
    contacts_count = 0
    recruiter_csv = "data/talent_acquisition_database.csv"
    if os.path.exists(recruiter_csv):
        cur.execute("DELETE FROM contacts")
        with open(recruiter_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                cur.execute("""
                    INSERT INTO contacts (name, job_title, linkedin_url, company, location, company_website)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    r.get("Name", ""),
                    r.get("Job Title", ""),
                    r.get("Linkedin URL", ""),
                    r.get("Company Name", ""),
                    r.get("Location", ""),
                    r.get("Company Website", "")
                ))
                contacts_count += 1

    # 4. Seed Candidate Profile & Evidence
    profile_json = "tests/fixtures/sample_profile.json"
    profile_seeded = 0
    if os.path.exists(profile_json):
        with open(profile_json, "r", encoding="utf-8") as f:
            p = json.load(f)
            cur.execute("""
                INSERT OR REPLACE INTO profiles (user_id, full_name, email, phone, location, structured_data)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                p.get("user_id", "usr_01"),
                p.get("full_name", ""),
                p.get("email", ""),
                p.get("phone", ""),
                p.get("location", ""),
                json.dumps(p)
            ))
            profile_seeded = 1

    conn.commit()
    conn.close()

    return {
        "job_sources": sources_count,
        "contacts": contacts_count,
        "profiles": profile_seeded
    }


if __name__ == "__main__":
    counts = seed_database()
    print(f"Successfully seeded database:")
    print(f" - {counts['job_sources']} job portals")
    print(f" - {counts['contacts']} recruiter contacts")
    print(f" - {counts['profiles']} candidate profile")
