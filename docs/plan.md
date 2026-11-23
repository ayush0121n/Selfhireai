# SelfHire.ai — Implementation Plan & Work Order

## 1. Implementation Philosophy
Following the `superpowers` skill and senior developer standards, all work is broken into verifiable milestones with explicit exit tests. We implement the **local mock-employer slice first** before connecting to any real external portal.

---

## 2. Work Ordering & Sprints

### Sprint 1: Monorepo & Infrastructure Setup (M0–M1)
1. Initialize repository structure (`apps/web`, `apps/extension`, `services/api`, `services/worker`, `packages/contracts`).
2. Establish Supabase connection and run initial migration (`001_initial_schema.sql`).
3. Set up Pydantic contracts and TypeScript code generation via `packages/contracts`.
4. Implement document upload and text parser (`pdfplumber` / `python-docx`).
5. Write unit tests for RLS isolation and document checksums.

### Sprint 2: Job Intelligence & Resume Tailoring (M2–M3)
1. Ingest sample JDs and seed `job_sources` with 106 portals.
2. Implement keyword extraction with `sentence-transformers` and `spaCy`.
3. Build the ATS Resume Studio diff engine in Next.js 15.
4. Write deterministic blocker for unsupported claims.
5. Implement ATS single-column PDF export; verify with round-trip `pdfplumber` tests.

### Sprint 3: Mock Employer Adapter & Approval Gate (M4–M6: First Vertical Slice Exit)
1. Build local mock employer web form in `adapters/mock_employer`.
2. Implement Playwright headed browser autofill for text, selects, radios, and uploads.
3. Implement SHA-256 canonical payload hasher and single-use approval lease.
4. Build Final Review Approval UI in Next.js and Chrome Extension MV3.
5. Execute end-to-end slice test: Synthetic profile -> JD -> Tailored resume -> Form fill -> Approval -> Submit -> Receipt #CONFIRMED.

### Sprint 4: Live Portals, Outreach & 3D Visuals (M7–M8)
1. Implement Greenhouse public job board adapter.
2. Build 1,800+ Recruiter CRM and cold email / WhatsApp deep-link composer.
3. Integrate Three.js 3D Career Intelligence Core in Next.js hero.
4. Build Expo mobile review companion.
