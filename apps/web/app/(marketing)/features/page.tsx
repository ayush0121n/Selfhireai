"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Bot, FileText, Send, Users, Globe, ShieldCheck, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FeaturesPage() {
  const features = [
    {
      title: "Triple-Mode AI Career Agent",
      desc: "Switch between real-time conversational advice (Chat Mode), on-demand document tailoring (Assistant Mode), and background automation monitoring (Autonomous Mode).",
      icon: Bot,
    },
    {
      title: "Zero-Cost Python RAG Resume Studio",
      desc: "Ingests PDF/DOCX resumes, segments semantic sections, and parses bullets into Google XYZ impact metrics bound to immutable Evidence IDs.",
      icon: FileText,
    },
    {
      title: "Exact-Action Human Approval Gate",
      desc: "Prevents unsolicited form submissions or message spam by generating a canonical SHA-256 payload hash requiring explicit human confirmation.",
      icon: ShieldCheck,
    },
    {
      title: "106 Official Portals Directory",
      desc: "Scrapes and indexes verified direct ATS career boards (Greenhouse, Workday, Lever) and specialized Indian remote tech portals with 0 spam.",
      icon: Globe,
    },
    {
      title: "1,838 Recruiter Outreach Studio",
      desc: "Discover verified decision makers at target companies, draft personalized cold emails grounded in real fit, and track responses via mailto deep-links.",
      icon: Users,
    },
    {
      title: "Smart Form Autofill & Readback",
      desc: "Headed Playwright browser automation navigates complex multi-step ATS application forms and inspects completed DOM fields before submission.",
      icon: Send,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FEF5E7] p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <Link href="/dashboard">
          <Button variant="primary" size="sm" className="text-xs gap-1.5">
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <div className="text-center space-y-2">
        <h1 className="font-display text-5xl font-bold tracking-tight text-[#2D0E03]">
          Platform Capabilities & Architecture
        </h1>
        <p className="text-sm text-[#2D0E03]/70 max-w-xl mx-auto">
          Built with Addy Osmani shipping discipline, Karpathy anti-slop principles, and local-first cryptographic isolation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <Card key={idx} className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center font-bold">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                {feat.title}
              </h3>
              <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
                {feat.desc}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
