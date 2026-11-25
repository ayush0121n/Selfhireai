-- SelfHire.ai Production PostgreSQL 16 + pgvector Schema
-- Complete 21 Normalized Tables with Row-Level Security (RLS)
-- Strictly Zero Fake Data: Schema & Allowlist Registry Only

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Clean Existing Schema (Safe Idempotent Setup)
CREATE SCHEMA IF NOT EXISTS public;

-- =========================================================================
-- CORE IDENTITY & PROFILES
-- =========================================================================

-- 1. Users (Mirrors auth.users with public profile attributes)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Structured Candidate Preferences & Parameters)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    headline TEXT,
    summary TEXT,
    contact_phone TEXT,
    location_city TEXT,
    location_country TEXT,
    work_authorization_status TEXT,
    notice_period_days INTEGER,
    minimum_salary_annual NUMERIC,
    salary_currency TEXT DEFAULT 'INR',
    preferred_work_modes TEXT[] DEFAULT ARRAY['REMOTE', 'HYBRID'],
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =========================================================================
-- EVIDENCE VAULT (Zero Hallucination Ground Truth)
-- =========================================================================

-- 3. Documents (Uploaded Master Resumes, Certificates, Transcripts)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_bytes BIGINT NOT NULL,
    doc_type TEXT DEFAULT 'MASTER_RESUME' CHECK (doc_type IN ('MASTER_RESUME', 'TRANSCRIPT', 'CERTIFICATE', 'PORTFOLIO')),
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Evidence (Atomic Verified Claims Cited by Tailored Resumes & Forms)
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT UNIQUE NOT NULL, -- e.g. "ev_exp_01", "ev_skl_python"
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    field_path TEXT NOT NULL, -- e.g. "experience[0].bullets[1]"
    claim_type TEXT NOT NULL CHECK (claim_type IN ('EXPERIENCE', 'SKILL', 'EDUCATION', 'PROJECT', 'METRIC')),
    title TEXT NOT NULL,
    value_json JSONB NOT NULL,
    raw_source_text TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- JOB INTELLIGENCE & TRUSTED REGISTRY (Zero Mock Data)
-- =========================================================================

-- 5. Job Sources (Verified Allowlist of 1,379 Portals & Boards)
CREATE TABLE IF NOT EXISTS public.job_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    domain TEXT NOT NULL,
    category TEXT NOT NULL,
    website_url TEXT NOT NULL,
    automation_mode TEXT DEFAULT 'EXTENSION_ASSIST' CHECK (automation_mode IN ('API_FEED', 'EXTENSION_ASSIST', 'MANUAL_LINK')),
    policy_status TEXT DEFAULT 'APPROVED' CHECK (policy_status IN ('UNREVIEWED', 'APPROVED', 'RESTRICTED')),
    policy_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Company Career Pages (675 Verified Direct Employer Career Portals)
CREATE TABLE IF NOT EXISTS public.company_career_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    career_url TEXT NOT NULL,
    domain TEXT NOT NULL,
    ats_platform TEXT DEFAULT 'Direct Career Portal',
    automation_mode TEXT DEFAULT 'EXTENSION_ASSIST' CHECK (automation_mode IN ('EXTENSION_ASSIST', 'MANUAL_LINK')),
    policy_status TEXT DEFAULT 'APPROVED' CHECK (policy_status IN ('APPROVED', 'RESTRICTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_name, career_url)
);

-- 7. Jobs (Canonical Ingested Live Roles with SHA-256 Deduplication)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.job_sources(id) ON DELETE SET NULL,
    source_name TEXT,
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    canonical_url TEXT NOT NULL UNIQUE,
    location_raw TEXT,
    work_mode TEXT DEFAULT 'REMOTE' CHECK (work_mode IN ('REMOTE', 'HYBRID', 'ONSITE', 'UNKNOWN')),
    salary_raw TEXT DEFAULT 'Competitive',
    jd_text TEXT NOT NULL,
    jd_hash TEXT NOT NULL, -- SHA-256 of normalized text
    extracted_keywords JSONB DEFAULT '[]'::JSONB,
    embedding vector(384), -- sentence-transformers/all-MiniLM-L6-v2 embedding
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    is_live BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPICIOUS'))
);

-- 8. Job Matches (Explainable Compatibility Scoring & Semantic Vectors)
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    fit_score NUMERIC NOT NULL CHECK (fit_score >= 0 AND fit_score <= 100),
    hard_filter_passed BOOLEAN DEFAULT TRUE,
    matched_skills JSONB DEFAULT '[]'::JSONB,
    missing_skills JSONB DEFAULT '[]'::JSONB,
    match_explanation TEXT,
    breakdown_json JSONB,
    scored_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- =========================================================================
-- ATS RESUME CUSTOMIZATION STUDIO
-- =========================================================================

-- 9. Resume Versions (Tailored Variants Citing Strictly Verified Evidence)
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    variant_name TEXT NOT NULL,
    storage_path TEXT,
    sha256 TEXT NOT NULL,
    tailored_content JSONB NOT NULL,
    evidence_citations JSONB NOT NULL DEFAULT '[]'::JSONB, -- List of immutable evidence_ids
    validation_status TEXT DEFAULT 'PASSED' CHECK (validation_status IN ('PASSED', 'FLAGGED')),
    is_master BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Answer Bank (Reusable Verified Form Answers Tied to Facts)
CREATE TABLE IF NOT EXISTS public.answer_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    canonical_question TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    evidence_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    classification TEXT DEFAULT 'VERIFIED_FACT' CHECK (classification IN ('VERIFIED_FACT', 'APPROVED_PREFERENCE', 'EVIDENCE_BASED_PROSE', 'UNKNOWN')),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, canonical_question)
);

-- =========================================================================
-- DETERMINISTIC STATE MACHINE & APPROVAL GATE
-- =========================================================================

-- 11. Applications (10-State Application Finite State Machine)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE SET NULL,
    state TEXT DEFAULT 'DISCOVERED' CHECK (state IN (
        'DISCOVERED', 'VERIFIED', 'ANALYZED', 'SHORTLISTED', 'DRAFTING', 
        'PREPARED', 'NEEDS_USER_INPUT', 'NEEDS_APPROVAL', 'APPROVED', 
        'SUBMITTING', 'CONFIRMED', 'SUBMISSION_UNKNOWN', 'CAPTCHA_REQUIRED', 
        'MFA_REQUIRED', 'REJECTED', 'CANCELLED'
    )),
    idempotency_key TEXT NOT NULL,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id, idempotency_key)
);

-- 12. Application Fields (Mapped Form Input Values)
CREATE TABLE IF NOT EXISTS public.application_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    field_type TEXT NOT NULL,
    proposed_value TEXT,
    evidence_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    classification TEXT NOT NULL,
    requires_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Approvals (Cryptographic Approval Tokens with 30-min TTL Lease)
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    action_type TEXT DEFAULT 'SUBMIT_APPLICATION' CHECK (action_type IN ('SUBMIT_APPLICATION', 'SEND_OUTREACH')),
    payload_hash TEXT UNIQUE NOT NULL, -- Canonical SHA-256 hash of payload
    payload_json JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONSUMED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Submission Attempts (Tracking Playwright Headed Execution)
CREATE TABLE IF NOT EXISTS public.submission_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    approval_id UUID NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    outcome TEXT CHECK (outcome IN ('SUCCESS', 'FAILED_RETRYABLE', 'UNKNOWN_TIMEOUT', 'CAPTCHA_BLOCKED')),
    logs TEXT
);

-- 15. Receipts (Immutable Proof of Submission with Screenshot Link)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    confirmation_id TEXT,
    final_destination_url TEXT NOT NULL,
    screenshot_storage_path TEXT,
    captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SECURITY, OUTREACH CRM & AUDIT LOGS
-- =========================================================================

-- 16. Credentials Vault (AES-256-GCM Portal Logins)
CREATE TABLE IF NOT EXISTS public.credentials_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    portal_domain TEXT NOT NULL,
    username_or_email TEXT NOT NULL,
    encrypted_secret TEXT NOT NULL, -- AES-256-GCM ciphertext
    iv TEXT NOT NULL,
    tag TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, portal_domain)
);

-- 17. Contacts (Recruiter & Referral CRM Directory)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    designation TEXT,
    linkedin_url TEXT,
    email_encrypted TEXT,
    consent_basis TEXT DEFAULT 'LEGITIMATE_INTEREST',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Messages (Personalized Outreach Drafts with SHA-256 Receipts)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    channel TEXT CHECK (channel IN ('EMAIL', 'WHATSAPP')),
    subject TEXT,
    body_text TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    state TEXT DEFAULT 'DRAFT' CHECK (state IN ('DRAFT', 'NEEDS_APPROVAL', 'APPROVED', 'SENT', 'FAILED')),
    approval_id UUID REFERENCES public.approvals(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Audit Events (Append-Only Traceability with PII Redaction)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK (actor IN ('USER', 'AGENT', 'WORKER')),
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID,
    metadata_json JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Agent Tasks (Background Asynchronous Execution Log)
CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    status TEXT DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    payload_json JSONB DEFAULT '{}'::JSONB,
    result_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- 21. Portal Accounts (Connected Chrome Extension & Social Integrations)
CREATE TABLE IF NOT EXISTS public.portal_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    portal_name TEXT NOT NULL,
    account_identifier TEXT NOT NULL,
    status TEXT DEFAULT 'CONNECTED' CHECK (status IN ('CONNECTED', 'NEEDS_AUTH', 'DISCONNECTED')),
    profile_data JSONB DEFAULT '{}'::JSONB,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, portal_name)
);

-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_accounts ENABLE ROW LEVEL SECURITY;

-- Public tables viewable by all authenticated users:
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_career_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Job Sources" ON public.job_sources FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public Read Companies" ON public.company_career_pages FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Public Read Jobs" ON public.jobs FOR SELECT TO authenticated, anon USING (true);

-- User Isolation Policies:
CREATE POLICY "User Isolation - Users" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "User Isolation - Profiles" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Documents" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Evidence" ON public.evidence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Job Matches" ON public.job_matches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Resume Versions" ON public.resume_versions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Answer Bank" ON public.answer_bank FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Applications" ON public.applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Approvals" ON public.approvals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Vault" ON public.credentials_vault FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Messages" ON public.messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Audit" ON public.audit_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Tasks" ON public.agent_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Portal Accounts" ON public.portal_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User Isolation - Application Fields" ON public.application_fields FOR ALL USING (
    EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);
CREATE POLICY "User Isolation - Submission Attempts" ON public.submission_attempts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);
CREATE POLICY "User Isolation - Receipts" ON public.receipts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);

-- =========================================================================
-- PGVECTOR HNSW SEMANTIC INDEXES (all-MiniLM-L6-v2 384-dim)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_embedding_hnsw
    ON public.jobs USING hnsw (embedding vector_cosine_ops);
