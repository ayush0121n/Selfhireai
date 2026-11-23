# SelfHire.ai — Local Setup & Development Guide

## 1. Prerequisites
- **Node.js**: v22 LTS or later (`node -v`)
- **Python**: v3.12 or later (`python --version`)
- **Package Managers**: `pnpm` (for frontend monorepo), `uv` or `pip` (for Python virtualenv)
- **Ollama**: Installed locally on host OS (`ollama --version`)
- **Supabase Account**: Free project URL and Anon / Service-Role API keys

---

## 2. Repository Setup

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/selfhire-ai.git
cd selfhire-ai

# 2. Setup Python Virtual Environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\Activate.ps1
pip install -r services/api/requirements.txt
playwright install chromium

# 3. Setup Frontend & Extension Dependencies
pnpm install

# 4. Configure Environment Variables
cp .env.example .env
```

---

## 3. Environment Variables (`.env`)

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project.supabase.co:5432/postgres

# Local Automation Server
API_HOST=127.0.0.1
API_PORT=8000
SESSION_SECRET=generate-a-secure-random-secret
VAULT_PASSPHRASE_SALT=generate-secure-salt

# Local Ollama AI Engine
OLLAMA_BASE_URL=http://127.0.0.1:11434
LOCAL_MODEL_NAME=qwen3.8:27b

# Feature Flags
MAX_DAILY_PREPARED_APPLICATIONS=10
MAX_DAILY_OUTREACH_DRAFTS=5
ALLOW_CLOUD_MODELS=false
```

---

## 4. Starting the Development Stack

```bash
# Terminal 1: Ollama Model
ollama run qwen3.8:27b

# Terminal 2: FastAPI Backend & Automation Worker
source .venv/bin/activate
uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 3: Next.js 15 Web Application
pnpm --filter web dev
```
