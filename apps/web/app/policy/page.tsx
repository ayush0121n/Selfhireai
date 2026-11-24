"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  KeyRound,
  ArrowRight,
  Database,
  Eye,
  Server,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function PolicyPage() {
  const principles = [
    {
      icon: ShieldCheck,
      title: "1. Zero-Scrape Architecture",
      subtitle: "Official APIs & Public Feeds Only",
      description:
        "SelfHire.ai strictly rejects aggressive bot web-scraping, headless proxy evasion, and CAPTCHA bypassing. All 1,379+ indexed job sources and 675 employer portals use official public ATS syndication endpoints (Greenhouse, Ashby, Lever, Workday) and user-authenticated direct submission windows. We respect platform robots.txt rules and Cloudflare Turnstile bot challenges.",
      highlights: [
        "No headless evasion or CAPTCHA solving",
        "Public JSON feeds and official ATS APIs",
        "Zero strain on employer servers",
      ],
    },
    {
      icon: Database,
      title: "2. Truthfulness & Grounded Evidence Guarantee",
      subtitle: "Anti-Hallucination Prime Directive",
      description:
        "The AI is forbidden from inventing experience, certifications, or metrics. Every bullet point synthesized in a tailored resume must link directly to an immutable evidence_id in the candidate's verified Evidence Vault. If a job requires a skill not present in your vault, SelfHire flags the gap honestly instead of fabricating claims.",
      highlights: [
        "100% of claims bound to verifiable evidence IDs",
        "Google XYZ quantifiable metrics verified against source docs",
        "Transparent skill gap flagging instead of exaggeration",
      ],
    },
    {
      icon: Lock,
      title: "3. Exact-Action Human Approval Gate",
      subtitle: "No Blind Autonomous Submissions",
      description:
        "The agent is strictly prohibited from auto-submitting job applications or firing cold outreach messages on its own. Every outbound action compiles an immutable Approval Package bound to a canonical SHA-256 payload hash with a 30-minute expiration window. You see the exact payload before dispatching.",
      highlights: [
        "Canonical SHA-256 payload verification",
        "30-minute approval TTL prevents stale submissions",
        "Full review of every answered form field",
      ],
    },
    {
      icon: KeyRound,
      title: "4. Local Keystore & Credential Isolation",
      subtitle: "AES-256-GCM Zero-Leak Storage",
      description:
        "Portal passwords, session tokens, and personal credentials reside locally on your machine encrypted with AES-256-GCM using PBKDF2 (100,000 iterations). Credentials are never sent to external LLMs, never saved in telemetry logs, and never uploaded to our servers.",
      highlights: [
        "PBKDF2 HMAC-SHA256 100,000-iteration key derivation",
        "Random 96-bit initialization vectors per write",
        "Zero password leakage into prompt context",
      ],
    },
    {
      icon: FileText,
      title: "5. DPDP Act 2023 & GDPR Compliance",
      subtitle: "Complete Portability & Instant Erasure",
      description:
        "We comply strictly with India's Digital Personal Data Protection Act 2023 and the EU General Data Protection Regulation (GDPR Article 20). You retain 100% ownership of your career data. Export your entire personal archive anytime in structured JSON or CSV, or trigger immediate permanent erasure.",
      highlights: [
        "1-click raw JSON & CSV data archive export",
        "Right to Erasure hard purge with zero retention",
        "Zero sale of candidate resumes to data brokers",
      ],
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FEF5E7] text-[#2D0E03] flex flex-col selection:bg-[#FAD7A0] selection:text-[#2D0E03]">
      {/* Top Navigation */}
      <header className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between border-b border-[#2D0E03]/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-[#B34A0E]">
            SelfHire<span className="text-[#2D0E03]">.ai</span>
          </span>
          <Badge variant="outline" className="text-[10px] bg-[#FAD7A0] text-[#2D0E03] border-[#2D0E03]/10 font-mono">
            POLICY
          </Badge>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="outline" className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5 text-xs">
              Job Intelligence
            </Button>
          </Link>
          <Link href="/vault">
            <Button className="bg-[#B34A0E] hover:bg-[#8F3B0B] text-white text-xs">
              Go to App
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B34A0E]/10 text-[#B34A0E] text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Ethical AI Charter & Security Directives
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#2D0E03] tracking-tight">
            Zero-Scrape Policy & Candidate Trust Charter
          </h1>
          <p className="text-[#6E5D53] text-base leading-relaxed">
            SelfHire.ai is built on a single uncompromising thesis: <strong>candidate career sovereignty</strong>.
            We eliminate deceptive automation, ban hallucinated credentials, and guarantee strict cryptographic control over every action.
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/vault" className="p-3 bg-white/80 rounded-xl border border-[#2D0E03]/10 hover:border-[#B34A0E] transition-colors block text-center">
            <span className="text-xs font-bold text-[#2D0E03] block">Evidence Vault</span>
            <span className="text-[10px] text-[#6E5D53]">Atomic Proofs</span>
          </Link>
          <Link href="/audit" className="p-3 bg-white/80 rounded-xl border border-[#2D0E03]/10 hover:border-[#B34A0E] transition-colors block text-center">
            <span className="text-xs font-bold text-[#2D0E03] block">Audit Log</span>
            <span className="text-[10px] text-[#6E5D53]">SHA-256 Receipts</span>
          </Link>
          <Link href="/vault/credentials" className="p-3 bg-white/80 rounded-xl border border-[#2D0E03]/10 hover:border-[#B34A0E] transition-colors block text-center">
            <span className="text-xs font-bold text-[#2D0E03] block">Credential Vault</span>
            <span className="text-[10px] text-[#6E5D53]">AES-256-GCM</span>
          </Link>
          <Link href="/account/export" className="p-3 bg-white/80 rounded-xl border border-[#2D0E03]/10 hover:border-[#B34A0E] transition-colors block text-center">
            <span className="text-xs font-bold text-[#2D0E03] block">Data Portability</span>
            <span className="text-[10px] text-[#6E5D53]">DPDP & GDPR</span>
          </Link>
        </div>

        {/* Principles */}
        <div className="space-y-6">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Card
                key={idx}
                className="p-6 md:p-8 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#FEF5E7] text-[#B34A0E] border border-[#2D0E03]/10 shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#B34A0E] uppercase tracking-wider">
                      {p.subtitle}
                    </div>
                    <h2 className="text-xl font-bold font-serif text-[#2D0E03] mt-0.5">
                      {p.title}
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-[#6E5D53] leading-relaxed pl-0 md:pl-16">
                  {p.description}
                </p>

                <div className="pl-0 md:pl-16 flex flex-wrap gap-2 pt-2">
                  {p.highlights.map((h, hIdx) => (
                    <span
                      key={hIdx}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#FAF6F2] border border-[#2D0E03]/10 text-[#2D0E03]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                      {h}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Contact & Governance */}
        <Card className="p-8 bg-[#2D0E03] text-white rounded-2xl space-y-4 text-center">
          <h3 className="text-2xl font-serif font-bold text-[#FEF5E7]">
            Questions on Security & Data Protection?
          </h3>
          <p className="text-sm text-[#FEF5E7]/80 max-w-xl mx-auto leading-relaxed">
            Our Data Protection Officer and security team review all protocol extensions and ATS integration models to guarantee absolute adherence to DPDP 2023 and GDPR guidelines.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/account/export">
              <Button className="bg-[#B34A0E] hover:bg-[#8F3B0B] text-white font-medium text-xs">
                Export Your Data Archive
              </Button>
            </Link>
            <Link href="/vault">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs">
                Access Evidence Vault
              </Button>
            </Link>
          </div>
        </Card>
      </main>
      </div>
    </AuthGuard>
  );
}
