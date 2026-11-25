# SelfHire.ai — Autonomous AI Job Application Agent

> **Your Career. Your Personal AI Agent. Zero Hallucinations.**

SelfHire.ai is a privacy-first, local-first AI career automation operating system. It combines cloud-relational storage (Supabase PostgreSQL), headed browser automation (Playwright), and local open-source AI (Ollama) to autonomously find real jobs, truthfully tailor resumes, autofill complex application forms, and coordinate personalized 1:1 recruiter outreach—all protected by an immutable human approval gate.

---

## Key Capabilities

- **Autonomous Job Discovery**: Continuous scanning across 106 verified Indian and global job portals with freshness (<30 days) and scam detection.
- **Truthful ATS Resume Customization**: Rewrites and reorders resume achievement bullets using the Google XYZ formula (`Accomplished [X], measured by [Y], by doing [Z]`), strictly backed by verified `evidence_id`s (zero hallucinated skills).
- **Reactive Resume & JSON Resume Standard**: Seamless JSON Resume v1.0 schema import/export interoperability with Reactive Resume v4, featuring an interactive paper sheet previewer with 3 layout templates (Single-Column ATS, Two-Column Executive, Modern Accent), optical palette selection, and native print-to-PDF.
- **RenderCV & CareerOps Compiler**: Deterministic YAML formatting and quantifiable metric validation (CareerOps XYZ formula) for LaTeX CV generation.
- **Smart Form Autofill Engine**: Headed browser automation (Playwright) that navigates complex employer forms (Greenhouse, Lever, Workday) step-by-step and maps candidate data.
- **Exact-Action Approval Gate**: Always stops before clicking "Submit", computes a canonical SHA-256 payload hash, and requires explicit user review.
- **Encrypted Credential Vault**: Stores job-site passwords locally using AES-256-GCM. Passwords never touch AI prompts or cloud logs.
- **Cold Outreach Hub**: Cross-references employers with a verified 1,800+ Talent Acquisition database to draft personalized 1:1 emails and WhatsApp deep-links (capped at 5/day).
- **Three.js & Motion AI Experience**: Industrial luxury aesthetic (Warm Espresso & Terracotta `#2D0E03` / `#B34A0E` / `#FEF5E7`) with an interactive 3D particle intelligence core.

---

## Monorepo Layout

```
selfhire-ai/
├── apps/
│   ├── web/               # Next.js 15 Web Application (React 19, Tailwind, Motion, Three.js)
│   └── extension/         # Google Chrome Extension Manifest V3 (Shadow DOM, Side Panel)
├── services/
│   ├── api/               # FastAPI REST & WebSocket Server (Python 3.12, asyncpg, Pydantic)
│   └── worker/            # Playwright Automation Worker & Lease Queue
├── packages/
│   ├── contracts/         # Canonical Pydantic & TypeScript Schemas
│   └── prompts/           # Versioned Prompts (Extraction, Tailoring, Outreach)
├── adapters/
│   ├── mock_employer/     # Local HTML test harness simulating real ATS forms
│   ├── greenhouse/        # Greenhouse ATS Adapter
│   └── workday/           # Workday multi-step Adapter
├── docs/                  # 17 Complete Technical Engineering Specifications
└── data/                  # Seed datasets (106 India job portals & 1,800+ TA contacts)
```

---

## Quickstart & Launching the Platform

### Single-Command Launch (Windows & Cross-Platform)

```bash
# Option A: Windows Interactive Batch Launcher
run.bat

# Option B: PowerShell Platform Launcher
.\run.ps1
# or launch everything in parallel:
.\run.ps1 -Mode all

# Option C: Docker Compose (Full Stack Containerized)
docker-compose up --build

# Option D: Cross-Platform Python Orchestrator
python scripts/run_all.py --all
```

### Manual Individual Commands

```bash
# 1. Start FastAPI REST & WebSocket Backend (http://127.0.0.1:8000)
python -m uvicorn services.api.main:app --port 8000 --reload

# 2. Start Next.js Web Dashboard (http://localhost:3000)
cd apps/web && npm run dev

# 3. Start Distributed Background Worker
python -m services.worker.runner

# 4. Run Full Verification Test Suite (71/71 tests passing)
python -m pytest tests/unit/ -v
```

---

## Direct Target Outreach & Instant Resume Studio

Provide a recipient email address and job description:
1. **Company Background Analysis**: Automatically extracts company name, domain, industry sector, detected tech stack, and matches against the 1,838 recruiter database.
2. **ATS Resume Tailoring**: Tailors your resume to the exact JD keywords using the Google XYZ formula backed by verified `evidence_id`s (0 hallucination).
3. **Personalized Cold Outreach**: Crafts a hyper-personalized email citing the company's tech stack and your matching metrics.
4. **Copy-Paste & Direct Dispatch**:
   - 1-Click Copy Email & 1-Click Copy Resume.
   - `mailto:` deep link for 1-click dispatch via your native email client (Gmail / Outlook).
   - "Send Mail" via agent with cryptographic audit logging (`POST /api/v1/outreach/direct-target` & `POST /api/v1/outreach/send-email`).

