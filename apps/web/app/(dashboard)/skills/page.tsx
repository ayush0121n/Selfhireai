"use client";

import React from "react";
import { BrainCircuit, CheckCircle2, TrendingUp, Sparkles, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SkillsPage() {
  const verifiedSkills = ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "Git"];
  const inDemandGaps = [
    { skill: "PyTorch & Vector Embeddings", urgency: "High Conviction", matchesGained: "+8 roles" },
    { skill: "Kubernetes Cluster Orchestration", urgency: "Medium", matchesGained: "+5 roles" },
    { skill: "GraphQL & Event Queues (Kafka)", urgency: "Medium", matchesGained: "+4 roles" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Skills Assessment & 30-Day Roadmap
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Grounded skill gap analysis. Compares your verified Evidence Vault with real ATS keyword requirements.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          {verifiedSkills.length} Verified Skills
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-[#2D0E03] border-b border-[#6E250A]/10 pb-3">
            Active Verified Skills (Vault Ground Truth)
          </h3>

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
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-[#2D0E03] border-b border-[#6E250A]/10 pb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#B34A0E]" />
            High-Impact Skill Gaps (106 Portals Analysis)
          </h3>

          <div className="space-y-3">
            {inDemandGaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/10 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#2D0E03]">{gap.skill}</div>
                  <div className="text-[10px] text-[#B34A0E] font-medium">{gap.urgency}</div>
                </div>
                <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                  {gap.matchesGained}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
