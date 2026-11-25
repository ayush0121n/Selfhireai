"""
Unit tests for SelfHire.ai Database Seeding Script.
Verifies table creation and idempotent data loading from CSVs and JSON fixtures.
"""

import sqlite3
import pytest
from scripts.seed_database import seed_database


def test_seed_database_execution(tmp_path):
    test_db_path = str(tmp_path / "seed_test.db")

    counts = seed_database(db_path=test_db_path)
    assert counts["job_sources"] >= 100
    assert counts["contacts"] >= 1000
    assert counts["profiles"] == 1

    # Verify tables in SQLite
    conn = sqlite3.connect(test_db_path)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM job_sources")
    sources_row = cur.fetchone()
    assert sources_row[0] >= 100

    cur.execute("SELECT COUNT(*) FROM contacts")
    contacts_row = cur.fetchone()
    assert contacts_row[0] >= 1000

    cur.execute("SELECT full_name, email FROM profiles WHERE user_id = 'usr_demo_01'")
    profile_row = cur.fetchone()
    assert profile_row is not None
    assert profile_row[0] == "Alex Rivera"
    assert profile_row[1] == "alex.rivera@example.com"

    conn.close()

    # Test idempotency (re-running should overwrite cleanly without unique constraint crashes)
    re_counts = seed_database(db_path=test_db_path)
    assert re_counts["job_sources"] == counts["job_sources"]
    assert re_counts["contacts"] == counts["contacts"]
