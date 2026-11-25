"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SkillGap {
  skill: string;
  count: number;
  urgency: string;
}

export default function SkillsPage() {
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);
  const [inDemandGaps, setInDemandGaps] = useState<SkillGap[]>([]);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const analyzeSkills = async () => {
    setLoading(true);
    try {
      const [profRes, evRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/profile`),
        fetch(`${API_BASE}/api/v1/evidence`),
        fetch(`${API_BASE}/api/v1/jobs/live?limit=25`),
      ]);

      let skills: string[] = [];
      if (profRes.ok) {
        const p = await profRes.json();
        skills = p.skills || [];
      }
      setVerifiedSkills(skills);

      if (evRes.ok) {
        const ev = await evRes.json();
        setEvidenceCount(Array.isArray(ev.claims) ? ev.claims.length : (ev.total || 0));
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobs = jobsData.jobs || [];
        const skillSet = new Set(skills.map((s) => s.toLowerCase()));
        const freq: Record<string, number> = {};

        for (const job of jobs) {
          const reqs: string[] = job.must_have_skills || [];
          for (const req of reqs) {
            if (!skillSet.has(req.toLowerCase())) {
              freq[req] = (freq[req] || 0) + 1;
            }
          }
        }

        const gaps = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([skill, count]) => ({
            skill,
            count,
            urgency: count >= 3 ? "High Conviction" : "Emerging",
          }));
        setInDemandGaps(gaps);
      }
    } catch {
      // keep empty state cleanly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeSkills();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Skills Assessment & Gap Matrix
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Grounded skill gap analysis comparing your verified Profile & Evidence Vault against live ATS job requirements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={analyzeSkills} className="text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Analysis
          </Button>
          <Badge variant="peach" className="px-3 py-1 text-xs">
            {verifiedSkills.length} Verified Skills • {evidenceCount} Evidence Claims
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-[#2D0E03] border-b border-[#6E250A]/10 pb-3">
            Active Verified Skills (Profile Ground Truth)
          </h3>

          {loading ? (
            <div className="h-32 animate-pulse bg-[#FEF5E7]/60 rounded-[10px]" />
          ) : verifiedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-[8px] bg-[#FEF5E7] text-[#2D0E03] font-mono text-xs font-semibold border border-[#6E250A]/15 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#2D0E03]/60">
              No skills found yet.{" "}
              <Link href="/vault" className="text-[#B34A0E] underline">
                Upload a resume to Evidence Vault
              </Link>
              .
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-[#2D0E03] border-b border-[#6E250A]/10 pb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#B34A0E]" />
            High-Impact Skill Gaps (Live ATS Scan)
          </h3>

          {loading ? (
            <div className="h-32 animate-pulse bg-[#FEF5E7]/60 rounded-[10px]" />
          ) : inDemandGaps.length > 0 ? (
            <div className="space-y-3">
              {inDemandGaps.map((gap) => (
                <div
                  key={gap.skill}
                  className="p-3.5 rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#2D0E03]">{gap.skill}</div>
                    <div className="text-[10px] text-[#B34A0E] font-medium">{gap.urgency}</div>
                  </div>
                  <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    +{gap.count} live roles
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-[10px] bg-[#FEF5E7]/50 text-xs text-[#2D0E03]/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Your verified profile already covers all top skills in the current live job batch.</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
