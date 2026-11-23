"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, FileText, ArrowRight, Upload, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function MasterResumePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/profile`);
        if (res.ok) setProfile(await res.json());
      } catch (err) {
        console.error("Could not fetch profile:", err);
      }
    }
    fetchProfile();
  }, []);

  const evidenceItems = profile?.evidence_items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Master Career Profile & Evidence Vault
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            The canonical source of truth for all job tailoring. Contains only verified claims and quantified metrics.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          {evidenceItems.length} Immutable Evidence Items
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-[#2D0E03] border-b border-[#6E250A]/10 pb-3">
            Verified Achievements & Impact Claims
          </h3>

          {evidenceItems.length > 0 ? (
            <div className="space-y-3">
              {evidenceItems.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-[10px] bg-[#FEF5E7]/70 border border-[#6E250A]/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-[#B34A0E]">
                      [{item.id}]
                    </span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Verified Ground Truth
                    </span>
                  </div>
                  <p className="text-xs text-[#2D0E03] leading-relaxed">
                    {item.verified_claim}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FEF5E7]/50 rounded-[12px] border border-dashed border-[#6E250A]/20">
              <FileText className="w-8 h-8 text-[#B34A0E] mx-auto mb-2 opacity-50" />
              <h4 className="font-display text-lg font-bold text-[#2D0E03]">
                Evidence Vault is Empty
              </h4>
              <p className="text-xs text-[#2D0E03]/60 max-w-sm mx-auto mt-1 mb-4">
                Upload your resume in the ATS Resume Studio to extract verified Google XYZ bullet points.
              </p>
              <Link href="/resume">
                <Button variant="primary" size="sm" className="text-xs gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Upload in Resume Studio
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              Truth Policy
            </h3>
            <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
              Every bullet point tailored for a job posting must resolve to an immutable <code>evidence_id</code> in this vault. The AI is strictly barred from hallucinating experience.
            </p>

            <div className="mt-4 p-3 rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> 0 Hallucinations Enforced
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Google XYZ Metrics Checked
              </div>
            </div>
          </div>

          <Link href="/resume" className="block pt-4 border-t border-[#6E250A]/10">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <span>Go to ATS Tailor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
