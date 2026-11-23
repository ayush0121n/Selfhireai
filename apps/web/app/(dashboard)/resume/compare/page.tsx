"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, ShieldCheck, Sparkles, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ResumeComparePage() {
  const [acceptedChanges, setAcceptedChanges] = useState<number[]>([0, 1, 2]);

  const originalBullets = [
    "Built backend APIs for internal applications using Python and PostgreSQL.",
    "Worked with team on continuous deployment and cloud servers.",
    "Helped improve application load speeds across the user dashboard.",
  ];

  const tailoredBullets = [
    {
      id: "ev_exp_01",
      text: "Architected high-throughput microservice in FastAPI reducing response latency by 42% across 100k daily queries.",
      metric: "42% latency reduction",
      status: "Verified in Vault",
    },
    {
      id: "ev_exp_02",
      text: "Built automated job ingestion pipeline utilizing Docker and PostgreSQL, scaling crawler throughput by 3x.",
      metric: "3x throughput scale",
      status: "Verified in Vault",
    },
    {
      id: "ev_exp_03",
      text: "Maintained 99.9% uptime across production Kubernetes clusters with zero security incidents.",
      metric: "99.9% uptime",
      status: "Verified in Vault",
    },
  ];

  const toggleAccept = (idx: number) => {
    setAcceptedChanges((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/resume" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Resume Studio
            </Link>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            ATS Resume Diff & Verification Comparator
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans">
            Side-by-side comparison. Review how verified Google XYZ metrics align with target JD requirements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="peach" className="px-3 py-1 text-xs">
            {acceptedChanges.length} of {tailoredBullets.length} Accepted
          </Badge>
          <Button variant="primary" size="sm" className="text-xs gap-1.5" onClick={() => alert("Approved resume exported to PDF.")}>
            <Download className="w-3.5 h-3.5" />
            Export Approved PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Original Master */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <h3 className="font-display text-lg font-bold text-[#2D0E03]">
              Original Master Profile
            </h3>
            <span className="text-xs text-[#2D0E03]/50 font-mono">Unoptimized</span>
          </div>

          <div className="space-y-3">
            {originalBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[10px] bg-[#FEF5E7]/40 border border-[#6E250A]/10 text-xs text-[#2D0E03]/70 leading-relaxed"
              >
                {bullet}
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Tailored & Verified */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <h3 className="font-display text-lg font-bold text-[#2D0E03] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B34A0E]" />
              Tailored ATS Version
            </h3>
            <Badge variant="success" className="text-[10px]">
              0 Hallucinations
            </Badge>
          </div>

          <div className="space-y-3">
            {tailoredBullets.map((bullet, idx) => {
              const isAccepted = acceptedChanges.includes(idx);
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-[10px] border transition-all text-xs space-y-2 ${
                    isAccepted
                      ? "bg-white border-emerald-300 shadow-2xs"
                      : "bg-[#FEF5E7]/30 border-[#6E250A]/10 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#B34A0E]">
                      [{bullet.id}]
                    </span>
                    <button
                      onClick={() => toggleAccept(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        isAccepted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isAccepted ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {isAccepted ? "Accepted" : "Rejected"}
                    </button>
                  </div>

                  <p className="text-[#2D0E03] leading-relaxed">
                    {bullet.text}
                  </p>

                  <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                    ✓ Metric: {bullet.metric}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
