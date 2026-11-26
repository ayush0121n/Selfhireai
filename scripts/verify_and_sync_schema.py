"""
SelfHire.ai Schema Sync & Verification Script.
Ensures all 21 normalized tables exist in data/selfhire.db as a local resilient mirror.
"""

import sqlite3
import os

DB_PATH = "data/selfhire.db"

def sync_schema(db_path: str = DB_PATH):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    tables = [
        # 1. users
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT DEFAULT 'USER',
            created_at TEXT,
            updated_at TEXT
        );
        """,
        # 2. profiles
        """
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            location TEXT,
            structured_data TEXT,
            created_at TEXT
        );
        """,
        # 3. documents
        """
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            sha256 TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_bytes INTEGER NOT NULL,
            doc_type TEXT DEFAULT 'MASTER_RESUME',
            raw_text TEXT,
            created_at TEXT
        );
        """,
        # 4. evidence
        """
        CREATE TABLE IF NOT EXISTS evidence (
            id TEXT PRIMARY KEY,
            evidence_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            document_id TEXT,
            field_path TEXT NOT NULL,
            claim_type TEXT NOT NULL,
            title TEXT NOT NULL,
            value_json TEXT NOT NULL,
            raw_source_text TEXT,
            is_verified INTEGER DEFAULT 1,
            verified_at TEXT,
            created_at TEXT
        );
        """,
        # 5. job_sources
        """
        CREATE TABLE IF NOT EXISTS job_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            portal_name TEXT,
            domain TEXT,
            category TEXT,
            website_url TEXT,
            policy_url TEXT,
            description TEXT,
            automation_mode TEXT DEFAULT 'EXTENSION_ASSIST',
            policy_status TEXT DEFAULT 'APPROVED',
            created_at TEXT
        );
        """,
        # 6. company_career_pages
        """
        CREATE TABLE IF NOT EXISTS company_career_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            career_url TEXT NOT NULL,
            domain TEXT,
            ats_platform TEXT,
            automation_mode TEXT DEFAULT 'EXTENSION_ASSIST',
            policy_status TEXT DEFAULT 'APPROVED',
            created_at TEXT
        );
        """,
        # 7. jobs
        """
        CREATE TABLE IF NOT EXISTS jobs (
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
        );
        """,
        # 8. job_matches
        """
        CREATE TABLE IF NOT EXISTS job_matches (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            overall_match_percentage INTEGER NOT NULL,
            matched_skills TEXT,
            missing_skills TEXT,
            match_explanation TEXT,
            computed_at TEXT,
            UNIQUE(job_id, user_id)
        );
        """,
        # 9. resume_versions
        """
        CREATE TABLE IF NOT EXISTS resume_versions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            job_id TEXT,
            variant_name TEXT NOT NULL,
            storage_path TEXT,
            sha256 TEXT NOT NULL,
            tailored_content TEXT NOT NULL,
            evidence_citations TEXT NOT NULL,
            validation_status TEXT DEFAULT 'PASSED',
            is_master INTEGER DEFAULT 0,
            created_at TEXT
        );
        """,
        # 10. answer_bank
        """
        CREATE TABLE IF NOT EXISTS answer_bank (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            canonical_question TEXT NOT NULL,
            answer_text TEXT NOT NULL,
            evidence_ids TEXT,
            classification TEXT DEFAULT 'VERIFIED_FACT',
            expires_at TEXT,
            updated_at TEXT,
            UNIQUE(user_id, canonical_question)
        );
        """,
        # 11. applications
        """
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            resume_version_id TEXT,
            state TEXT DEFAULT 'DISCOVERED',
            idempotency_key TEXT NOT NULL,
            submitted_at TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        """,
        # 12. application_fields
        """
        CREATE TABLE IF NOT EXISTS application_fields (
            id TEXT PRIMARY KEY,
            application_id TEXT NOT NULL,
            field_key TEXT NOT NULL,
            field_type TEXT NOT NULL,
            proposed_value TEXT,
            evidence_ids TEXT,
            classification TEXT NOT NULL,
            requires_user INTEGER DEFAULT 0,
            created_at TEXT
        );
        """,
        # 13. approvals
        """
        CREATE TABLE IF NOT EXISTS approvals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            application_id TEXT,
            action_type TEXT DEFAULT 'SUBMIT_APPLICATION',
            payload_hash TEXT UNIQUE NOT NULL,
            payload_json TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            approved_at TEXT,
            consumed_at TEXT,
            status TEXT DEFAULT 'PENDING',
            created_at TEXT
        );
        """,
        # 14. submission_attempts
        """
        CREATE TABLE IF NOT EXISTS submission_attempts (
            id TEXT PRIMARY KEY,
            application_id TEXT NOT NULL,
            approval_id TEXT NOT NULL,
            started_at TEXT,
            outcome TEXT,
            logs TEXT
        );
        """,
        # 15. receipts
        """
        CREATE TABLE IF NOT EXISTS receipts (
            id TEXT PRIMARY KEY,
            application_id TEXT UNIQUE NOT NULL,
            confirmation_id TEXT,
            final_destination_url TEXT NOT NULL,
            screenshot_storage_path TEXT,
            captured_at TEXT
        );
        """,
        # 16. credentials_vault
        """
        CREATE TABLE IF NOT EXISTS credentials_vault (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            portal_domain TEXT NOT NULL,
            username_or_email TEXT NOT NULL,
            encrypted_secret TEXT NOT NULL,
            iv TEXT NOT NULL,
            tag TEXT NOT NULL,
            updated_at TEXT,
            UNIQUE(user_id, portal_domain)
        );
        """,
        # 17. contacts
        """
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            name TEXT,
            full_name TEXT,
            job_title TEXT,
            designation TEXT,
            company TEXT,
            company_name TEXT,
            location TEXT,
            linkedin_url TEXT,
            company_website TEXT,
            email_encrypted TEXT,
            consent_basis TEXT DEFAULT 'LEGITIMATE_INTEREST',
            created_at TEXT
        );
        """,
        # 18. messages
        """
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            contact_id TEXT,
            channel TEXT,
            subject TEXT,
            body_text TEXT NOT NULL,
            payload_hash TEXT NOT NULL,
            state TEXT DEFAULT 'DRAFT',
            approval_id TEXT,
            sent_at TEXT,
            created_at TEXT
        );
        """,
        # 19. audit_events
        """
        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            actor TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_name TEXT NOT NULL,
            entity_id TEXT,
            metadata_json TEXT,
            created_at TEXT
        );
        """,
        # 20. agent_tasks
        """
        CREATE TABLE IF NOT EXISTS agent_tasks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            task_type TEXT NOT NULL,
            status TEXT DEFAULT 'RUNNING',
            payload_json TEXT,
            result_json TEXT,
            created_at TEXT,
            finished_at TEXT
        );
        """,
        # 21. portal_accounts
        """
        CREATE TABLE IF NOT EXISTS portal_accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            portal_name TEXT NOT NULL,
            account_identifier TEXT NOT NULL,
            status TEXT DEFAULT 'CONNECTED',
            profile_data TEXT,
            last_synced_at TEXT,
            created_at TEXT,
            UNIQUE(user_id, portal_name)
        );
        """
    ]

    for ddl in tables:
        cur.execute(ddl)

    conn.commit()
    existing_tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall() if r[0] != 'sqlite_sequence']
    conn.close()
    return existing_tables

if __name__ == "__main__":
    t_list = sync_schema()
    print(f"Total tables synced in {DB_PATH}: {len(t_list)}")
    print("Tables:", sorted(t_list))
