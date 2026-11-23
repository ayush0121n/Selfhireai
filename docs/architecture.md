# SelfHire.ai — System Architecture Specification

## 1. Architectural Principles
SelfHire.ai is architected as a **hybrid cloud-relational and host-automation platform**. Data persistence, authentication, storage, and real-time state synchronization run on **Supabase**, while browser automation (Playwright) and local model inference (Ollama) execute safely on the user's host machine.

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Tier"]
        WEB["Next.js 15 Web App\n(React 19, Tailwind, Motion, Three.js)"]
        EXT["Chrome Extension MV3\n(Shadow DOM, Content Script, Side Panel)"]
        MOB["Expo Mobile Companion\n(Signed Device Auth, Push Review)"]
    end

    subgraph BackendGateway["FastAPI Application & Automation Core (127.0.0.1:8000)"]
        API["FastAPI REST & WebSocket Gateway"]
        VAULT["AES-256-GCM Credential Vault"]
        GATE["Approval Hash Service (SHA-256 Hasher)"]
        WORKER["Automation Worker & Lease Manager"]
    end

    subgraph HostExecutors["Host Automation & Inference (Host OS)"]
        PLAYWRIGHT["Playwright Headed Browser\n(Visible Window, User-attended MFA/CAPTCHA)"]
        OLLAMA["Local Ollama Runtime\n(Qwen3.8-27B / Qwen3-Coder / Gemma 4)"]
        EMBED["Python Pre-Trained Models\n(Sentence-Transformers & spaCy NER)"]
        DETERM["Deterministic Fallback Engine"]
    end

    subgraph CloudLayer["Supabase Managed Cloud Infrastructure"]
        DB[(PostgreSQL 16 + pgvector)]
        AUTH["Supabase Auth (JWT & Scoped OAuth)"]
        STORAGE["Supabase Storage (resumes/ bucket)"]
        REALTIME["Supabase Realtime (CDC WebSockets)"]
    end

    WEB <-->|HTTPS / Supabase Client| CloudLayer
    EXT <-->|REST / Supabase Client| CloudLayer
    MOB <-->|Signed HTTPS| API

    WEB <-->|REST / WebSocket| API
    EXT <-->|Native Messaging / REST| API

    API --> AUTH
    API --> DB
    API --> STORAGE
    API --> REALTIME

    API --> VAULT
    API --> GATE
    API --> WORKER

    WORKER --> PLAYWRIGHT
    WORKER --> EMBED
    WORKER --> OLLAMA
    OLLAMA -.-> DETERM
```

---

## 3. Component Breakdown

### 3.1 Client Layer
- **Desktop Web (Next.js 15)**: App Router with Server Components and Client Island architecture. Uses Motion (`motion`) for spring transitions, Radix UI for accessibility, and Three.js (`@react-three/fiber`) for the 3D Career Intelligence Core.
- **Chrome Extension (Manifest V3)**: Uses a background Service Worker, offscreen canvas if needed, content scripts isolated via Shadow DOM to prevent CSS leaks into host pages, and the Chrome Side Panel API.
- **Mobile Companion (Expo SDK 52)**: Lightweight review inbox for remote approvals and emergency kill switch.

### 3.2 Automation & API Layer (Python 3.12 / FastAPI)
- **FastAPI Core**: Async REST endpoints with strict Pydantic v2 schemas and OpenAPI documentation at `/api/v1`.
- **Playwright Automation Engine**: Headed browser runner configured with persistent user browser contexts. Runs directly on the host to enable direct user interaction during CAPTCHA or 2FA.
- **Local Pre-Trained NLP Models**: Hugging Face `sentence-transformers/all-MiniLM-L6-v2` for ultra-fast local keyword similarity embeddings; `spaCy` for named entity recognition of technical skills and certifications.

### 3.3 Persistence & Infrastructure Layer (Supabase)
- **Database**: PostgreSQL 16 with `pgvector` enabled for semantic matching between resumes and job postings.
- **Row-Level Security (RLS)**: Enforces `auth.uid() = user_id` across all private candidate tables.
- **Supabase Storage**: S3-compatible object storage storing original master resumes and tailored versioned PDFs/DOCX with immutable SHA-256 checksums.
- **Supabase Realtime**: WebSocket event streaming broadcasting task progress and approval prompts directly to active clients.
