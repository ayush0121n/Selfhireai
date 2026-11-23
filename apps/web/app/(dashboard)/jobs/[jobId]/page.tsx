"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Send,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = (params?.jobId as string) || "job-01";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jobs" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to 106 Portals Directory
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
              Junior Full Stack Developer
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#2D0E03]/80 mt-1">
              <span className="flex items-center gap-1 font-semibold text-[#2D0E03]">
                <Building2 className="w-3.5 h-3.5 text-[#B34A0E]" /> Acme Corp
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2D0E03]/50" /> Pune, India (Hybrid)
              </span>
              <span className="flex items-center gap-1 font-mono text-[#B34A0E] font-medium">
                <DollarSign className="w-3.5 h-3.5" /> ₹8L - ₹14L / yr
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="peach" className="text-xs font-mono font-bold">
              94% Semantic Match
            </Badge>
            <Link href={`/auto-apply?jobId=${jobId}`}>
              <Button variant="primary" size="sm" className="text-xs gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Prepare Auto-Apply
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              Role Overview
            </h3>
            <p className="text-xs text-[#2D0E03]/80 leading-relaxed">
              We are looking for a Junior Full Stack Developer to build and scale high-throughput internal microservices and high-craft web consoles. You will work directly with our engineering team architecting clean FastAPI backends and responsive Next.js applications.
            </p>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-3">
              Required Technical Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "Git"].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-[8px] bg-[#FEF5E7] text-[#2D0E03] font-mono text-xs font-semibold border border-[#6E250A]/15 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              Key Responsibilities
            </h3>
            <ul className="text-xs text-[#2D0E03]/80 space-y-2 list-disc list-inside leading-relaxed">
              <li>Design, build, and deploy low-latency REST and WebSocket endpoints.</li>
              <li>Collaborate with product designers using Tailwind CSS and Radix UI design systems.</li>
              <li>Enforce strict automated test suites (`pytest`, `npm test`) with zero console errors.</li>
              <li>Participate in peer code reviews maintaining Addy Osmani shipping discipline.</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              ATS Source Details
            </h3>
            <div className="p-3.5 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2D0E03]">ATS Platform:</span>
                <span className="font-mono text-[#B34A0E] font-bold">Greenhouse</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2D0E03]">Policy Status:</span>
                <span className="font-bold text-emerald-700">APPROVED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2D0E03]">Job ID:</span>
                <span className="font-mono text-[#2D0E03]/60">{jobId}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#6E250A]/10">
            <Link href={`/resume/compare?jobId=${jobId}`} className="block">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#B34A0E]" />
                Tailor Resume for Role
              </Button>
            </Link>
            <Link href={`/auto-apply?jobId=${jobId}`} className="block">
              <Button variant="primary" size="sm" className="w-full text-xs gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Prepare Auto-Apply
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
