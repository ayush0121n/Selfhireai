# SelfHire.ai — Memory, State & Knowledge Model

## 1. Memory Tiering Architecture
SelfHire.ai separates verified factual history from ephemeral generated text to guarantee zero hallucination across application runs.

```mermaid
flowchart TD
    subgraph PersistentFacts["1. Verified Factual Memory (Immutable Source of Truth)"]
        F1["Employers, Titles & Dates"]
        F2["Quantified Achievements (XYZ Formula)"]
        F3["Degrees & Educational Transcripts"]
        F4["Technical Skills with Evidence Citations"]
        F5["Contact Details & Portfolio URLs"]
    end

    subgraph WorkingMemory["2. Ephemeral Working Memory (Per-Application Scope)"]
        W1["Active Job Description & Extracted Keywords"]
        W2["Proposed Form Field Mappings"]
        W3["Draft Resume Bullets & Diff State"]
        W4["Pending SHA-256 Approval Lease (30m TTL)"]
    end

    subgraph HistoricalMemory["3. Audit & Learning Memory (Outcome Tracking)"]
        H1["Versioned Tailored Resumes (PDF/DOCX)"]
        H2["Submitted Application Packages & Field Snapshots"]
        H3["Confirmation Receipts & Screenshots"]
        H4["User Edits & Rejections (Reinforcement Loop)"]
    end

    PersistentFacts -->|Retrieval| WorkingMemory
    WorkingMemory -->|Approval & Submit| HistoricalMemory
```

---

## 2. Invalidation & Mutation Rules
1. **Cascade Invalidation**: If the user edits a verified fact in their profile (e.g. changing availability/notice period from "30 days" to "Immediate", or minimum salary), all cached answers and pending application packages depending on that field are **instantly marked invalid**.
2. **Approval Freeze**: Once an application package receives user approval, its payload hash is sealed. Any change to the profile, JD, or attachments breaks the hash and requires re-approval.
3. **Session Expiry**: Working memory leases expire after 30 minutes to ensure stale browser DOM states are re-inspected before submission.

---

## 3. Privacy & Data Isolation
- Candidate evidence is stored under strict Supabase Row-Level Security (`user_id = auth.uid()`).
- Data from one user is never used as contextual memory or training data for another user.
- Credentials in the `credentials_vault` are kept in an isolated AES-256 encrypted table and never retained in agent working memory.
