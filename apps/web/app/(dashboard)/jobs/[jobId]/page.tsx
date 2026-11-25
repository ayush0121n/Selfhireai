"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Send,
  FileText,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface JobDetail {
  id: string;
  job_title?: string;
  title?: string;
  company_name?: string;
  location_raw?: string;
  work_mode?: string;
  source_name?: string;
  canonical_url?: string;
  jd_raw_text?: string;
  required_skills?: string[];
  compensation?: string;
  fit_score?: number;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = decodeURIComponent((params?.jobId as string) || "");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [sourceType, setSourceType] = useState<string>("live_store");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/detail/${encodeURIComponent(jobId)}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? `Job "${jobId}" not found in workspace.` : `HTTP ${res.status}`);
        }
        const data = await res.json();
        setJob(data.job);
        setSourceType(data.source_type || "live_store");
        if (data.source_type === "saved_job") setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job detail");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const handleSave = async () => {
    if (!job) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/saved-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id || jobId,
          title: job.job_title || job.title || "Untitled Role",
          company: job.company_name || "Unknown Company",
          location: job.location_raw || "Remote",
          work_mode: job.work_mode || "Remote",
          score: job.fit_score || 85,
          source: job.source_name || "ATS",
          canonical_url: job.canonical_url || "",
          jd_raw_text: job.jd_raw_text || "",
        }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job");
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-[#2D0E03]/60">Loading job details from workspace...</div>;
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Link href="/jobs" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs Directory
        </Link>
        <Card className="p-6 border-red-200 bg-red-50/50 flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || "Job not found."}</span>
        </Card>
      </div>
    );
  }

  const title = job.job_title || job.title || "Software Engineer";
  const skills = job.required_skills && job.required_skills.length > 0 ? job.required_skills : ["Python", "TypeScript", "SQL"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jobs" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs & Startups Directory
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#2D0E03]/80 mt-1">
              <span className="flex items-center gap-1 font-semibold text-[#2D0E03]">
                <Building2 className="w-3.5 h-3.5 text-[#B34A0E]" /> {job.company_name || "Target Company"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2D0E03]/50" /> {job.location_raw || "Remote"} ({job.work_mode || "Remote"})
              </span>
              {job.compensation && (
                <span className="flex items-center gap-1 font-mono text-[#B34A0E] font-medium">
                  <DollarSign className="w-3.5 h-3.5" /> {job.compensation}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {typeof job.fit_score === "number" && (
              <Badge variant="peach" className="text-xs font-mono font-bold">
                {job.fit_score}% Match
              </Badge>
            )}
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={saved}>
              <Bookmark className="w-3.5 h-3.5 text-[#B34A0E]" />
              {saved ? "Saved" : "Save Job"}
            </Button>
            <Link href={`/auto-apply?jobId=${encodeURIComponent(jobId)}`}>
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
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">Role Overview</h3>
            <p className="text-xs text-[#2D0E03]/80 leading-relaxed whitespace-pre-wrap">
              {job.jd_raw_text || "Full job description text was not provided by the source feed. Open the canonical portal URL to inspect full requirements."}
            </p>
          </div>

          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-3">Technical Stack</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
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
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">Source Details</h3>
            <div className="p-3.5 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2D0E03]">Source:</span>
                <span className="font-mono text-[#B34A0E] font-bold">{job.source_name || sourceType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#2D0E03]">Job ID:</span>
                <span className="font-mono text-[#2D0E03]/60 truncate max-w-[160px]">{job.id || jobId}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#6E250A]/10">
            {job.canonical_url && (
              <a href={job.canonical_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#B34A0E]" />
                  Open Original Posting
                </Button>
              </a>
            )}
            <Link href={`/resume/compare?jobId=${encodeURIComponent(jobId)}`} className="block">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#B34A0E]" />
                Tailor Resume for Role
              </Button>
            </Link>
            <Link href={`/auto-apply?jobId=${encodeURIComponent(jobId)}`} className="block">
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
