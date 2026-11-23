# SelfHire.ai — API Specifications & WebSocket Contracts

## 1. REST API Architecture
- **Base URL**: `http://127.0.0.1:8000/api/v1`
- **Authentication**: Bearer JWT token issued by Supabase Auth; validated locally via Supabase public key.
- **Content-Type**: `application/json` (multipart/form-data for uploads).

---

## 2. Core REST Endpoints

### 2.1 Profile & Evidence Vault
- `GET /profile`: Retrieve candidate profile, target preferences, and verified status.
- `PATCH /profile`: Update preferences, notice period, locations, or salary bands.
- `POST /documents/upload`: Upload master resume (PDF/DOCX); triggers parser and entity extraction.
- `GET /evidence`: List all verified claims categorized by type (`EXPERIENCE`, `SKILL`, `PROJECT`).
- `POST /evidence/verify`: User manual confirmation of extracted claims.

### 2.2 Job Intelligence & Matching
- `POST /jobs/import`: Import job posting from URL, raw text, or HTML payload.
- `GET /jobs`: Query ingested jobs with faceted filters (location, match score, status).
- `POST /jobs/{id}/analyze`: Trigger keyword extraction and requirement classification.
- `POST /jobs/{id}/match`: Compute explainable fit score (40% must-haves, 25% experience, etc.).

### 2.3 ATS Resume Customization Studio
- `POST /resumes/tailor`: Generate tailored resume for specific `job_id` using verified `evidence_ids`.
- `GET /resumes/{id}/diff`: Return JSON diff between Master Resume and Tailored Variant.
- `POST /resumes/{id}/export`: Export tailored resume to ATS-tested single-column PDF or DOCX.

### 2.4 Smart Form Autofill & Applications
- `POST /applications/prepare`: Launch Playwright headed browser session to map and fill fields.
- `GET /applications/{id}/review`: Retrieve complete exact-action review package and computed SHA-256 payload hash.
- `POST /applications/{id}/submit`: Execute authorized submission using approved token.
- `POST /applications/{id}/verify-receipt`: Readback final confirmation page, store screenshot and receipt ID.

### 2.5 Exact Approval Gate
- `POST /approvals/{id}/approve`: Seal approval with user signature; marks single-use lease active.
- `POST /approvals/{id}/deny`: Reject proposed package; releases browser session safely.

### 2.6 Cold Outreach CRM
- `GET /contacts`: Search recruiter directory cross-referenced by company name.
- `POST /messages/draft`: Generate personalized 1:1 outreach draft using Google XYZ formula.
- `POST /messages/{id}/send`: Approve and trigger mail dispatch or WhatsApp deep-link generation.

---

## 3. Real-Time WebSocket / SSE Streaming
- **Endpoint**: `WS /api/v1/agent/chat`
- **Protocol**: Bidirectional JSON frames supporting streaming text, tool calling, and live telemetry:

```json
{
  "event": "agent_action",
  "data": {
    "action": "FILL_FORM_FIELD",
    "field": "phone_number",
    "status": "COMPLETED",
    "evidence_citation": "ev_contact_01"
  }
}
```
