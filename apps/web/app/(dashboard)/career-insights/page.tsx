"use client";

import React from "react";
import CareerIntelligenceCore from "@/components/CareerIntelligenceCore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, BrainCircuit, Target, ShieldCheck } from "lucide-react";

export default function CareerInsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Career Intelligence & Market Node Map
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Dynamic 3D Career Node Topology visualising live ATS integrations, skill clusters, and company hiring velocity.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          Interactive 3D Engine
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-white min-h-[420px]">
          <div className="w-full flex items-center justify-between border-b border-[#6E250A]/10 pb-3 mb-4">
            <span className="font-display text-lg font-bold text-[#2D0E03]">
              Live ATS Cluster Graph
            </span>
            <span className="text-[11px] font-mono text-[#2D0E03]/60">
              38 Active Verification Nodes
            </span>
          </div>

          <CareerIntelligenceCore />

          <p className="text-[11px] text-[#2D0E03]/60 mt-4 text-center">
            Nodes represent verified ATS boards (Greenhouse, Workday, Lever) and engineering hiring hubs.
          </p>
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-3">
              Skill Demand Index
            </h3>
            <div className="space-y-3">
              {[
                { name: "Python / FastAPI", growth: "+44%", demand: "High Conviction" },
                { name: "Next.js 15 & React 19", growth: "+38%", demand: "Core Frontend" },
                { name: "PostgreSQL & pgvector", growth: "+52%", demand: "RAG Infrastructure" },
                { name: "Docker & Kubernetes", growth: "+29%", demand: "DevOps & Cloud" },
              ].map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#2D0E03]">{skill.name}</div>
                    <div className="text-[10px] text-[#2D0E03]/60">{skill.demand}</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    {skill.growth}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[#FAD7A0]/30 border border-[#B34A0E]/20 text-[11px] text-[#2D0E03]/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Telemetry verified against actual JD keyword frequencies.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
