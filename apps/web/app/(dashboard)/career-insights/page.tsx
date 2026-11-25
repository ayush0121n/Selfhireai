"use client";

import React, { useEffect, useState } from "react";
import CareerIntelligenceCore from "@/components/CareerIntelligenceCore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface DemandSkill {
  name: string;
  count: number;
  demand: string;
}

export default function CareerInsightsPage() {
  const [totalPortals, setTotalPortals] = useState(106);
  const [liveJobsCount, setLiveJobsCount] = useState(0);
  const [demandIndex, setDemandIndex] = useState<DemandSkill[]>([]);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const [metricsRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/admin/metrics`),
          fetch(`${API_BASE}/api/v1/jobs/live?limit=30`),
        ]);
        if (metricsRes.ok) {
          const m = await metricsRes.json();
          if (m.total_portals) setTotalPortals(m.total_portals);
        }
        if (jobsRes.ok) {
          const j = await jobsRes.json();
          const jobs = j.jobs || [];
          setLiveJobsCount(jobs.length);

          const freq: Record<string, number> = {};
          for (const job of jobs) {
            for (const sk of job.must_have_skills || []) {
              freq[sk] = (freq[sk] || 0) + 1;
            }
          }
          const sorted = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
              name,
              count,
              demand: count >= 4 ? "High Conviction" : "Active Requirement",
            }));
          setDemandIndex(sorted);
        }
      } catch {
        // non-blocking
      }
    };
    loadInsights();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Career Intelligence & Market Node Map
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Dynamic 3D Career Node Topology visualising live ATS integrations, skill clusters, and real-time JD demand.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          Interactive 3D Engine • {liveJobsCount} Live JDs
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-white min-h-[420px]">
          <div className="w-full flex items-center justify-between border-b border-[#6E250A]/10 pb-3 mb-4">
            <span className="font-display text-lg font-bold text-[#2D0E03]">
              Live ATS Cluster Graph
            </span>
            <span className="text-[11px] font-mono text-[#2D0E03]/60">
              {totalPortals} Connected Portals
            </span>
          </div>

          <CareerIntelligenceCore />

          <p className="text-[11px] text-[#2D0E03]/60 mt-4 text-center">
            Nodes represent verified ATS boards (Greenhouse, Workday, Lever, Ashby) and engineering hiring hubs.
          </p>
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-3">
              Live Skill Demand Index
            </h3>
            <div className="space-y-3">
              {demandIndex.length > 0 ? (
                demandIndex.map((skill) => (
                  <div
                    key={skill.name}
                    className="p-3 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#2D0E03]">{skill.name}</div>
                      <div className="text-[10px] text-[#2D0E03]/60">{skill.demand}</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">
                      {skill.count} JDs
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#2D0E03]/60">
                  Discover live jobs in /jobs to populate real-time JD skill frequency telemetry.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[#FAD7A0]/30 border border-[#B34A0E]/20 text-[11px] text-[#2D0E03]/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Telemetry computed directly from live ingested JD requirements.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
