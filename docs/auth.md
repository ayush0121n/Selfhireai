# SelfHire.ai — Authentication, Privacy & Security Specification

## 1. Authentication Architecture

SelfHire.ai implements a **dual-tier security boundary** that separates candidate identity management from sensitive job-portal automation credentials:

```mermaid
flowchart LR
    subgraph Identity["Candidate Identity Tier (Supabase)"]
        CLIENT["Web / Extension / Mobile"] <-->|JWT / OAuth 2.0| AUTH["Supabase Auth"]
        AUTH -->|auth.uid()| RLS["Row-Level Security (Postgres)"]
    end

    subgraph PortalVault["Host Automation Vault (127.0.0.1)"]
        API["FastAPI Local Server"] <-->|AES-256-GCM| VAULT["Local Keystore (credentials_vault)"]
        VAULT -->|In-Memory Ephemeral| RUNNER["Playwright Browser Automation"]
    end
```

---

## 2. Supabase Auth & Multi-Client Sessions
- **User Authentication**: Email/Password with PKCE flow, plus optional Google OAuth for easy sign-in.
- **Client Session Management**:
  - **Web App**: Managed via `@supabase/ssr` with HttpOnly, Secure, SameSite cookies.
  - **Chrome Extension (MV3)**: Token stored in `chrome.storage.session` (in-memory only, cleared when browser closes).
  - **Mobile App**: Stored in platform secure hardware keystore (iOS Keychain / Android Keystore) via `expo-secure-store`.
- **Row-Level Security (RLS)**: Every single table containing candidate data enforces:
  ```sql
  CREATE POLICY "Tenant Isolation" ON public.applications
  FOR ALL USING (auth.uid() = user_id);
  ```

---

## 3. Local Portal Credential Keystore (`credentials_vault`)
To allow the autonomous agent to log into job portals (Workday, Greenhouse, Naukri, Indeed) without jeopardizing candidate security:
1. **Local AES-256-GCM Encryption**: Portal passwords and session cookies are encrypted on the host machine using a derived key (`PBKDF2` with 600,000 iterations from a user master passphrase or OS Keychain).
2. **Zero Credentials in Prompts**: Plaintext passwords and session cookies are **strictly forbidden** from being injected into LLM prompts, tool arguments, or logs.
3. **In-Memory Injection**: Playwright retrieves the decrypted credentials in memory immediately prior to filling the login inputs (`page.fill('input[type="password"]', secret)`), and the memory is zeroed out immediately.

---

## 4. 2FA, OTP & CAPTCHA Protocol (Human-in-the-Loop)
Under no circumstances does SelfHire.ai attempt to crack, spoof, or evade anti-bot systems (Cloudflare Turnstile, reCAPTCHA, hCaptcha, Duo 2FA, SMS OTP).
- When Playwright detects a challenge or 2FA prompt:
  1. The application state transitions immediately to `CAPTCHA_REQUIRED` or `MFA_REQUIRED`.
  2. The worker sends an instant Realtime event to the active client: *"Please complete verification in the visible browser window."*
  3. The automation pauses execution for up to 300 seconds.
  4. Once the user solves the challenge and the browser navigates to the authenticated dashboard, the agent detects the session change and resumes automated processing.

---

## 5. DPDP Act 2023 & GDPR Privacy Compliance
- **Right to Erasure (Hard Delete)**: `DELETE /api/v1/account` performs a cascading hard delete across all Supabase tables and purges all uploaded/tailored resumes from the `resumes/` storage bucket.
- **Data Export**: `POST /api/v1/account/export` bundles the user's evidence vault, applications history, and audit log into an encrypted JSON/ZIP archive.
- **Redacted Audit Trails**: All API actions and agent tool calls are logged to `audit_events` with emails, passwords, and full resume texts redacted.
