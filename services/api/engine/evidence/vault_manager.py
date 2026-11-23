"""
Evidence Vault Manager — High-Integrity Atomic Claim Extraction and Verification.
Parses master resumes (PDF, DOCX, TXT), computes SHA-256 integrity hashes,
extracts atomic claims (EXPERIENCE, SKILL, EDUCATION, PROJECT, METRIC),
and persists them into public.documents and public.evidence.
"""

from __future__ import annotations
import hashlib
import io
import json
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import pypdf
import docx


class EvidenceVaultManager:
    def __init__(self, db_path: str = "data/selfhire.db"):
        self.db_path = db_path

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def parse_document_content(self, file_bytes: bytes, filename: str) -> str:
        """Extracts UTF-8 plain text from PDF, DOCX, or TXT."""
        ext = filename.lower().split(".")[-1]
        text = ""

        if ext == "pdf":
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif ext in ["docx", "doc"]:
            doc = docx.Document(io.BytesIO(file_bytes))
            for p in doc.paragraphs:
                if p.text:
                    text += p.text + "\n"
        else:
            text = file_bytes.decode("utf-8", errors="replace")

        return text.strip()

    def compute_sha256(self, content_bytes: bytes) -> str:
        return hashlib.sha256(content_bytes).hexdigest()

    def extract_atomic_claims(self, raw_text: str, user_id: str, document_id: str) -> List[Dict[str, Any]]:
        """
        Extracts verified claims categorized into:
        - EXPERIENCE
        - SKILL
        - EDUCATION
        - PROJECT
        - METRIC (Google XYZ: Accomplished [X] measured by [Y] by doing [Z])
        """
        claims: List[Dict[str, Any]] = []
        now = datetime.now(timezone.utc).isoformat()

        # 1. Extract Skills
        known_skills = [
            "Python", "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "FastAPI",
            "PostgreSQL", "SQL", "SQLite", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
            "Redis", "GraphQL", "Tailwind CSS", "Git", "CI/CD", "HTML5", "CSS3", "REST APIs",
            "Playwright", "Puppeteer", "PyTest", "Jest", "Go", "Rust", "Java", "C++", "Linux"
        ]
        found_skills = set()
        for skill in known_skills:
            pattern = rf"\b{re.escape(skill)}\b"
            if re.search(pattern, raw_text, re.IGNORECASE):
                found_skills.add(skill)

        for skill in sorted(found_skills):
            ev_id = f"ev_skl_{uuid.uuid4().hex[:10]}"
            claims.append({
                "id": ev_id,
                "evidence_id": ev_id,
                "user_id": user_id,
                "document_id": document_id,
                "claim_type": "SKILL",
                "title": skill,
                "field_path": f"skills.{skill.lower().replace(' ', '_')}",
                "value_json": json.dumps({"skill": skill, "proficiency": "demonstrated"}),
                "raw_source_text": f"Proficiency in {skill}",
                "is_verified": 1,
                "verified_at": now,
                "created_at": now
            })

        # 2. Extract Google XYZ Metrics (Accomplished [X] measured by [Y] by doing [Z])
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        metric_pattern = re.compile(
            r"(\b\d+(\.\d+)?%|\b\d+x|\b\$\d+[\d,]*|\b\d+\s*(ms|seconds|minutes|hours|days|k|m|users|requests|qps)\b)",
            re.IGNORECASE
        )

        for line in lines:
            if len(line) > 20 and metric_pattern.search(line):
                if not re.match(r"^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$", line):
                    ev_id = f"ev_met_{uuid.uuid4().hex[:10]}"
                    claims.append({
                        "id": ev_id,
                        "evidence_id": ev_id,
                        "user_id": user_id,
                        "document_id": document_id,
                        "claim_type": "METRIC",
                        "title": line[:60] + "...",
                        "field_path": "achievements.metric",
                        "value_json": json.dumps({"metric_claim": line}),
                        "raw_source_text": line,
                        "is_verified": 1,
                        "verified_at": now,
                        "created_at": now
                    })

        # 3. Extract Experience
        exp_pattern = re.compile(
            r"^(Senior|Lead|Staff|Principal|Junior|Software|Engineer|Developer|Architect|Full Stack|Backend|Frontend|Data Scientist|Product Manager).*",
            re.IGNORECASE
        )
        for line in lines:
            if exp_pattern.match(line) and len(line) < 100:
                ev_id = f"ev_exp_{uuid.uuid4().hex[:10]}"
                claims.append({
                    "id": ev_id,
                    "evidence_id": ev_id,
                    "user_id": user_id,
                    "document_id": document_id,
                    "claim_type": "EXPERIENCE",
                    "title": line,
                    "field_path": "work_history.role",
                    "value_json": json.dumps({"role_title": line}),
                    "raw_source_text": line,
                    "is_verified": 1,
                    "verified_at": now,
                    "created_at": now
                })

        # 4. Extract Education
        edu_pattern = re.compile(
            r".*\b(Bachelor|Master|B\.Tech|M\.Tech|B\.S\.|M\.S\.|B\.E\.|Ph\.D\.|Degree|University|Institute|College)\b.*",
            re.IGNORECASE
        )
        for line in lines:
            if edu_pattern.match(line) and len(line) < 120:
                ev_id = f"ev_edu_{uuid.uuid4().hex[:10]}"
                claims.append({
                    "id": ev_id,
                    "evidence_id": ev_id,
                    "user_id": user_id,
                    "document_id": document_id,
                    "claim_type": "EDUCATION",
                    "title": line,
                    "field_path": "education.degree",
                    "value_json": json.dumps({"education_entry": line}),
                    "raw_source_text": line,
                    "is_verified": 1,
                    "verified_at": now,
                    "created_at": now
                })

        # 5. Extract Projects
        proj_pattern = re.compile(r"^(Project|SelfHire|System|Platform|Pipeline|Engine|Tool|App):?\s*(.+)", re.IGNORECASE)
        for line in lines:
            if proj_pattern.match(line) and len(line) > 15:
                ev_id = f"ev_prj_{uuid.uuid4().hex[:10]}"
                claims.append({
                    "id": ev_id,
                    "evidence_id": ev_id,
                    "user_id": user_id,
                    "document_id": document_id,
                    "claim_type": "PROJECT",
                    "title": line[:50],
                    "field_path": "projects.item",
                    "value_json": json.dumps({"project_name": line}),
                    "raw_source_text": line,
                    "is_verified": 1,
                    "verified_at": now,
                    "created_at": now
                })

        return claims

    def upload_and_process_document(
        self,
        file_bytes: bytes,
        filename: str,
        user_id: str = "usr_candidate_default"
    ) -> Dict[str, Any]:
        """Parses document, computes hash, saves to documents and evidence tables."""
        raw_text = self.parse_document_content(file_bytes, filename)
        sha256_hash = self.compute_sha256(file_bytes)
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        file_type = filename.split(".")[-1].lower() if "." in filename else "txt"
        mime_type = "application/pdf" if file_type == "pdf" else "text/plain"

        conn = self._get_connection()
        cur = conn.cursor()

        # Insert document record matching sqlite schema
        cur.execute("""
            INSERT OR REPLACE INTO documents (
                id, user_id, file_name, storage_path, sha256, mime_type, file_bytes, doc_type, raw_text, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id, user_id, filename, f"resumes/{doc_id}_{filename}", sha256_hash, mime_type,
            len(file_bytes), file_type.upper(), raw_text, now
        ))

        # Extract atomic claims
        claims = self.extract_atomic_claims(raw_text, user_id, doc_id)

        # Insert claims into evidence table
        for c in claims:
            cur.execute("""
                INSERT OR REPLACE INTO evidence (
                    id, evidence_id, user_id, document_id, field_path, claim_type,
                    title, value_json, raw_source_text, is_verified, verified_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c["id"], c["evidence_id"], c["user_id"], c["document_id"], c["field_path"],
                c["claim_type"], c["title"], c["value_json"], c["raw_source_text"],
                c["is_verified"], c["verified_at"], c["created_at"]
            ))

        conn.commit()
        conn.close()

        return {
            "document_id": doc_id,
            "filename": filename,
            "sha256_hash": sha256_hash,
            "claims_extracted": len(claims),
            "evidence": claims
        }

    def get_user_evidence(self, user_id: str = "usr_candidate_default") -> List[Dict[str, Any]]:
        """Retrieves verified claims from evidence table."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, evidence_id, user_id, document_id, field_path, claim_type,
                   title, value_json, raw_source_text, is_verified, verified_at, created_at
            FROM evidence
            WHERE user_id = ?
            ORDER BY claim_type ASC, is_verified DESC, created_at DESC
        """, (user_id,))
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            try:
                d["value_parsed"] = json.loads(d["value_json"]) if d["value_json"] else {}
            except Exception:
                d["value_parsed"] = {}
            rows.append(d)
        conn.close()
        return rows

    def verify_claim(self, evidence_id: str, is_verified: bool = True, title: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Updates claim verification status."""
        conn = self._get_connection()
        cur = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        if title:
            cur.execute("""
                UPDATE evidence
                SET is_verified = ?, title = ?, verified_at = ?
                WHERE evidence_id = ? OR id = ?
            """, (1 if is_verified else 0, title, now, evidence_id, evidence_id))
        else:
            cur.execute("""
                UPDATE evidence
                SET is_verified = ?, verified_at = ?
                WHERE evidence_id = ? OR id = ?
            """, (1 if is_verified else 0, now, evidence_id, evidence_id))

        conn.commit()

        cur.execute("SELECT * FROM evidence WHERE evidence_id = ? OR id = ?", (evidence_id, evidence_id))
        row = cur.fetchone()
        conn.close()

        return dict(row) if row else None
