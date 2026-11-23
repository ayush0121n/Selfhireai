# SelfHire.ai — Product Requirements Document (PRD)

## 1. Product Overview & Vision
**SelfHire.ai** is an intelligent, privacy-first personal career automation SaaS platform that empowers job seekers to discover real vacancies, truthfully tailor resumes per job description, autofill complex multi-step application forms, and coordinate 1-to-1 cold recruiter outreach across Email and WhatsApp.

Unlike irresponsible auto-apply bots that blast generic resumes and cause account bans, SelfHire.ai operates under an **Immutable Exact-Action Approval Gate**: every submission and outbound communication requires explicit human confirmation bound to a cryptographic payload hash.

---

## 2. Core User Personas & Pain Points
- **Active Software Engineers & Tech Professionals**: Spent hundreds of hours manually re-typing employment history into Workday, Greenhouse, and Lever portals; tired of ATS black holes.
- **Early-Career & Fresh Graduates**: Struggle to align resume keywords with job descriptions without exaggerating skills or making untruthful claims.
- **Experienced Career Switchers**: Need to highlight transferrable skills and manage multi-portal tracking with warm-path recruiter connections.

---

## 3. Scope of Capabilities

### P0 (Must-Have for MVP Vertical Slice)
1. **Profile & Evidence Vault**: Structured storage of verified candidate facts (employment dates, achievements with Google XYZ formula, education, certifications, contact details).
2. **ATS Resume Customization Engine**: Dynamic keyword extraction from JDs, relevance scoring, and section reordering strictly linked to verified evidence (zero hallucinations).
3. **Smart Form Autofill (Playwright)**: Headed browser automation detecting form fields across test ATS and filling standard text, selects, radios, dates, and file uploads.
4. **Exact-Action Approval Gate**: Computes a canonical SHA-256 hash of the complete submission payload; stops before clicking "Submit"; consumes approval token once upon user click.
5. **Multi-Platform Foundations**: Next.js 15 Web Dashboard and Manifest V3 Chrome Extension paired to a unified backend.
6. **Supabase Cloud Infrastructure**: PostgreSQL relational schema, Supabase Auth, Supabase Storage for resume files, and Supabase Realtime status streaming.

### P1 (High-Priority Automation)
1. **Autonomous Job Discovery**: Scheduled search across 106 seeded job sources (India & Global) with freshness heuristics (< 30 days) and scam detection.
2. **Secure Credential Vault**: AES-256-GCM encrypted local storage for portal logins; automated login in headed browser with pause-and-resume on 2FA/CAPTCHA.
3. **Cold Outreach Hub**: Cross-referencing target employers with a verified 1,800+ recruiter database; drafting personalized 1:1 emails and WhatsApp deep-links.
4. **Live Conversational AI Agent**: Real-time interactive copilot guiding the user, answering questions, and executing tool calls (search, tailor, autofill).

### P2 (Career Intelligence & Ecosystem Expansion)
1. **Three.js Interactive Visualization**: 3D Career Intelligence Node Graph and interactive AI intelligence core visualizing skill matches and market demand.
2. **Interview War-Room**: STAR-method question generator grounded in verified candidate evidence and matching JD requirements.
3. **Skill-Gap 30-Day Learning Planner**: Aggregates missing skills across rejected or shortlisted roles to generate targeted learning projects.
4. **Mobile Companion Application**: React Native / Expo SDK 52 companion app paired via cryptographic QR code for remote approval review.

---

## 4. Non-Functional Requirements & Security
- **Data Privacy**: Local-first or strictly isolated Supabase Row-Level Security (`auth.uid() = user_id`).
- **Zero Prompt Credential Leakage**: Passwords and session cookies are never injected into LLM prompts or logs.
- **Deterministic Validation**: If an LLM fails schema validation twice, the system falls back to deterministic rule-based extraction.
- **Performance**: Resume tailoring roundtrip < 4 seconds; form field mapping readback < 1.5 seconds.
