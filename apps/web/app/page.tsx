"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  FileText,
  Send,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  Zap,
  Globe,
  Bot,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DirectOutreachStudio from "@/components/DirectOutreachStudio";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FEF5E7] flex flex-col selection:bg-[#FAD7A0] selection:text-[#2D0E03]">
      {/* 1. Navbar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-[24px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-brand text-[32px] tracking-tight text-[#B34A0E]">
            SelfHire<span className="text-[#2D0E03]">.ai</span>
          </span>
          <span className="text-[10px] tracking-wider uppercase px-[8px] py-[2px] rounded-full bg-[#FAD7A0] text-[#2D0E03] font-bold font-sans">
            OS
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-[32px] text-[14px] font-semibold text-[#2D0E03]/80 font-sans">
          <Link href="#features" className="hover:text-[#B34A0E] transition-colors">
            Features
          </Link>
          <Link href="#outreach-studio" className="hover:text-[#B34A0E] transition-colors">
            Direct Outreach Studio
          </Link>
          <Link href="/jobs" className="hover:text-[#B34A0E] transition-colors">
            106 Portals
          </Link>
          <Link href="/admin" className="hover:text-[#B34A0E] transition-colors">
            Admin CRM
          </Link>
        </nav>

        <div className="flex items-center gap-[12px]">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[12px]">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" className="text-[12px] gap-[8px] shadow-sm">
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-5xl mx-auto px-[24px] pt-[48px] pb-[40px] text-center space-y-[24px]">
        <div className="inline-flex items-center gap-[8px] px-[16px] py-[6px] rounded-full bg-white border-[0.8px] border-[#6E250A]/15 text-[12px] text-[#2D0E03] shadow-[0px_4px_6px_rgba(0,0,0,0.02)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold font-sans">Privacy-First AI Career OS</span>
          <span className="text-[#6E250A]/40">•</span>
          <span className="text-[#2D0E03]/70 font-sans">Zero-Mock Real Data Guarantee</span>
        </div>

        <h1 className="font-display text-[52px] md:text-[78px] font-[700] tracking-[-1.5px] text-[#2D0E03] leading-[1.05]">
          Your AI Career Agent. <br />
          <span className="italic font-[500] text-[#B34A0E]">From Discovery to Application.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-[15px] text-[#2D0E03]/75 font-sans leading-[1.63] font-normal">
          Find genuine opportunities across 106 official company ATS boards. Analyse job descriptions. Generate verified ATS resumes with quantified Google XYZ metrics. Autofill applications with cryptographic human approvals.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-[16px] pt-[16px]">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="gap-[8px] text-[15px] px-[24px] py-[16px] shadow-md">
              <Sparkles className="w-4 h-4 text-[#FAD7A0]" />
              Start Free with AI Agent
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" size="lg" className="text-[15px] px-[24px] py-[16px]">
              Explore 106 Portals Directory
            </Button>
          </Link>
        </div>

        {/* Security attestation */}
        <div className="pt-[24px] flex flex-wrap items-center justify-center gap-[24px] text-[14px] text-[#2D0E03]/70 font-sans">
          <span className="flex items-center gap-[8px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Canonical SHA-256 Approval Gate
          </span>
          <span className="flex items-center gap-[8px]">
            <Lock className="w-4 h-4 text-emerald-600" />
            Local AES-256 Credentials Vault
          </span>
          <span className="flex items-center gap-[8px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Zero Fake or Mock Data
          </span>
        </div>
      </section>

      {/* 3. Interactive Direct Target Outreach Studio */}
      <section id="outreach-studio" className="max-w-6xl mx-auto px-[24px] pb-[32px] w-full">
        <DirectOutreachStudio />
      </section>

      {/* 4. Feature Grid */}
      <section id="features" className="max-w-6xl mx-auto px-[24px] py-[40px] space-y-[32px]">
        <div className="text-center space-y-[8px]">
          <h2 className="font-display text-[32px] md:text-[36px] font-[700] text-[#2D0E03] leading-[1.2]">
            Six Pillars of AI Career Automation
          </h2>
          <p className="text-[14px] text-[#2D0E03]/70 max-w-xl mx-auto font-sans leading-[1.63]">
            Engineered with strict Addy Osmani shipping discipline, Karpathy anti-slop rules, and Matt Pocock type safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          <Card className="p-[20px] space-y-[12px]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-display text-[18px] font-[700] text-[#2D0E03] leading-[1.3]">
              Triple-Mode AI Agent
            </h3>
            <p className="text-[14px] text-[#2D0E03]/70 font-sans leading-[1.63]">
              Switch effortlessly between conversational Chat Mode, on-demand Assistant Mode, and guarded Autonomous Workflow Mode.
            </p>
          </Card>

          <Card className="p-[20px] space-y-[12px]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-display text-[18px] font-[700] text-[#2D0E03] leading-[1.3]">
              Python RAG Resume Studio
            </h3>
            <p className="text-[14px] text-[#2D0E03]/70 font-sans leading-[1.63]">
              Ingests raw PDF/DOCX resumes, segments semantic sections, and parses bullets into Google XYZ impact metrics bound to evidence IDs.
            </p>
          </Card>

          <Card className="p-[20px] space-y-[12px]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-display text-[18px] font-[700] text-[#2D0E03] leading-[1.3]">
              Auto-Apply Assistant
            </h3>
            <p className="text-[14px] text-[#2D0E03]/70 font-sans leading-[1.63]">
              Automates form field reading and profile mapping across Greenhouse, Workday, and Lever with cryptographic approval gating.
            </p>
          </Card>

          <Card className="p-[20px] space-y-[12px]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display text-[18px] font-[700] text-[#2D0E03] leading-[1.3]">
              1,838 Recruiter Outreach
            </h3>
            <p className="text-[14px] text-[#2D0E03]/70 font-sans leading-[1.63]">
              Find decision-makers at target companies, draft personalized cold emails grounded in genuine fit, and track responses.
            </p>
          </Card>

          <Card className="p-[20px] space-y-[12px]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-display text-[18px] font-[700] text-[#2D0E03] leading-[1.3]">
              106 Portals Seed Registry
            </h3>
            <p className="text-[14px] text-[#2D0E03]/70 font-sans leading-[1.63]">
              Direct ingestion from official career boards, engineering directories, and specialized Indian remote tech portals.
            </p>
          </Card>

          <Card className="p-[20px] space-y-[12px]">
            <div className="w-10 h-10 rounded-[12px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-display text-[18px] font-[700] text-[#2D0E03] leading-[1.3]">
              Admin CRM & Health
            </h3>
            <p className="text-[14px] text-[#2D0E03]/70 font-sans leading-[1.63]">
              Enterprise management portal for reviewing platform health, managing source allowlists, and auditing tamper-proof action logs.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-[#6E250A]/10 bg-white py-[40px] px-[24px] text-center text-[14px] text-[#2D0E03]/60 space-y-[8px] font-sans">
        <div className="flex items-center justify-center gap-[8px]">
          <span className="font-brand text-[24px] text-[#B34A0E]">SelfHire<span className="text-[#2D0E03]">.ai</span></span>
          <span>•</span>
          <span className="font-sans">Autonomous Career OS</span>
        </div>
        <p className="text-[12px] text-[#2D0E03]/50">© 2026 SelfHire.ai. All rights reserved. Zero-Mock, Zero-Hallucination Engineering.</p>
      </footer>
    </div>
  );
}
