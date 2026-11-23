# SelfHire.ai — Integrations & Job Portals Registry Specification

## 1. Integration Strategy

SelfHire.ai maintains a strict, policy-checked **Adapter Registry** that manages job discovery, form autofill, and communication channels. Platforms are divided into three operational tiers based on terms of service compliance, security, and technical interfaces:

```
+-----------------------------------------------------------------------------------------+
| TIER 1: API_FEED               | TIER 2: EXTENSION_ASSIST     | TIER 3: MANUAL_LINK     |
| (Official APIs & Public ATS)   | (User-Attended Form Assist)  | (Zero-Scrape Safety)    |
+-----------------------------------------------------------------------------------------+
| Greenhouse, Lever, Ashby,      | Workday, Naukri, Foundit,    | LinkedIn, Indeed Search,|
| RemoteOK, Jobicy RSS feeds     | Internshala, Wellfound       | Government Exam Portals |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Seeded Portals Registry (106 India & Global Sources)

Seeded from `india_job_portals_directory.csv` into `job_sources`:

| Category | Count | Supported Portals (Examples) | Default Mode | Automation Policy Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tech & Startups** | 12 | Wellfound, Cutshort, Hirist, Instahyre, HackerEarth | `EXTENSION_ASSIST` | Approved for Assisted Autofill |
| **Corporate ATS** | 23 | Amazon, Google, Microsoft, TCS, Infosys, Wipro | `API_FEED` / `EXTENSION_ASSIST` | ATS-specific sandbox verified |
| **Remote & Global** | 20 | We Work Remotely, RemoteOK, Remotive, Turing | `API_FEED` | Public JSON/RSS Feed |
| **General Job Boards** | 23 | Naukri.com, Foundit, Shine, TimesJobs, Glassdoor | `EXTENSION_ASSIST` | Capture & Readback on user visit |
| **Freshers & Interns** | 8 | Internshala, Unstop, Freshersworld, Firstnaukri | `EXTENSION_ASSIST` | Assisted field mapping |
| **Professional Network** | 2 | **LinkedIn**, **Indeed** | **`MANUAL_LINK`** | **Strictly Manual / Zero Bot Automation** |
| **Government & Public** | 18 | UPSC, SSC, IBPS, RRB, SBI, DRDO, ISRO, MPSC | `MANUAL_LINK` | Search links only (User applies manually) |

---

## 3. Supported ATS Form Adapters

### 3.1 Mock Employer Adapter (`adapters/mock_employer`)
- **Role**: 100% deterministic local test harness simulating a live enterprise application form.
- **Fields**: First/Last Name, Email, Phone, Location, University, Graduation Year, Technical Skills, LinkedIn/GitHub URL, Resume File Upload, Cover Letter, Work Authorization Radio, Disability Dropdown, Terms Checkbox.
- **Exit Gate**: The entire profile-to-resume-to-form-to-approval-to-receipt pipeline must pass with 0 errors on this mock form before activating external adapters.

### 3.2 Greenhouse Adapter (`adapters/greenhouse`)
- **Target**: Public Greenhouse job boards (`boards.greenhouse.io/<company>/jobs/<id>`).
- **Autofill Mechanism**: Direct mapping to standard accessible DOM elements (`#first_name`, `#last_name`, `#email`, `#phone`, `#resume_file`).
- **Submission Verification**: Extracts the confirmation header or `application_id` from the post-submit DOM.

### 3.3 Workday Multi-Step Adapter (`adapters/workday`)
- **Target**: Enterprise career sites hosted on `myworkdayjobs.com`.
- **Workflow**:
  1. Headed browser loads the candidate's stored profile credentials from the local encrypted vault.
  2. Candidate completes any 2FA/CAPTCHA if prompted.
  3. Multi-step pagination: Automates Step 1 (My Information) -> Step 2 (My Experience) -> Step 3 (Application Questions) -> Step 4 (Review).
  4. Stops on the final Review step and captures the full payload for user approval.

---

## 4. Cold Outreach & Recruiter Channels

### 4.1 1,800+ Talent Acquisition Database Integration
- **Source**: `1800+ Talent Acquisition Database.xlsx` imported strictly into the candidate's private, encrypted Supabase `contacts` table.
- **Lookup Protocol**: When a job at *Company X* is analyzed, the system queries local contacts for recruiters/TA managers at *Company X* located in the target hub (Bengaluru, Pune, Mumbai, Delhi).
- **Rate-Limiting**: Strict quota of **max 5 outreach drafts per day**. No mass mail merges or automated blasts.

### 4.2 Email Outreach (Gmail OAuth & Local Drafts)
- Generates personalized, de-AI-ified outreach emails using the Google XYZ achievement formula.
- Stores drafts in `messages` table in `DRAFT` state.
- Sent via Gmail API with scoped OAuth permissions **only after** candidate clicks "Approve & Send".

### 4.3 WhatsApp Outreach (WhatsApp Deep-Links)
- Generates clean, polite WhatsApp inquiry drafts.
- Launches official WhatsApp deep link: `https://wa.me/<phone>?text=<encoded_message>`.
- The user reviews the pre-filled text in their WhatsApp client and presses send manually.
