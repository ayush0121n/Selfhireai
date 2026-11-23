"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Send, FileText, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      title: "Ground in Evidence Vault",
      desc: "Upload your master resume. Our Python RAG parser extracts verified Google XYZ impact bullets and assigns immutable evidence IDs. 0 hallucinated claims.",
      icon: FileText,
    },
    {
      num: "02",
      title: "Discover Verified Opportunities",
      desc: "Monitor 106 official company career boards (Greenhouse, Workday, Lever). Filter by salary floors, work mode, and sponsorship requirements.",
      icon: Search,
    },
    {
      num: "03",
      title: "Tailor ATS Resume & Map Fields",
      desc: "The agent aligns your verified achievements against target JD keywords and maps every application input to a verified fact.",
      icon: Sparkles,
    },
    {
      num: "04",
      title: "Exact-Action Approval & Submission",
      desc: "Before clicking Submit, the agent pauses and presents a canonical SHA-256 payload hash. Once authorized, it submits and records a tamper-proof receipt.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FEF5E7] p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <Link href="/dashboard">
          <Button variant="primary" size="sm" className="text-xs gap-1.5">
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <div className="text-center space-y-2">
        <h1 className="font-display text-5xl font-bold tracking-tight text-[#2D0E03]">
          How SelfHire.ai Works
        </h1>
        <p className="text-sm text-[#2D0E03]/70 max-w-xl mx-auto">
          The four-stage automation lifecycle with strict human-in-the-loop cryptographic safety gates.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="font-brand text-3xl font-bold text-[#B34A0E] flex-shrink-0 w-12 text-center">
                {step.num}
              </div>
              <div className="p-3 rounded-[10px] bg-[#FEF5E7] text-[#B34A0E] flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-display text-2xl font-bold text-[#2D0E03]">
                  {step.title}
                </h3>
                <p className="text-xs text-[#2D0E03]/75 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
