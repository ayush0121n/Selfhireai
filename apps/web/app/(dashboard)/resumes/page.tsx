"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  Download,
  Copy,
  Hash,
  RefreshCw,
  GitCompare,
  Briefcase
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface LiveJob {
  id: string;
  title: string;
  company_name: string;
  location_raw: string;
  work_mode: string;
}

interface TailoredResumeData {
  id: string;
  target_job_title: string;
  target_company: string;
  sha256_hash: string;
  tailored_skills: string[];
  experience: Array<{
    role: string;
    company: string;
    start_date: string;
    end_date: string;
    bullets: Array<{
      text: string;
      evidence_id: string;
      quantified_metric: boolean;
    }>;
  }>;
}

interface DiffData {
  resume_id: string;
  job_id: string;
  target_title: string;
  sha256_hash: string;
  master_evidence_count: number;
  tailored_bullet_count: number;
  highlighted_skills: string[];
  bullet_diffs: Array<{
    role: string;
    company: string;
    tailored_text: string;
    evidence_id: string;
    quantified_metric: boolean;
    is_truth_certified: boolean;
  }>;
}

export default function ResumesStudioPage() {
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeData | null>(null);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedText, setExportedText] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchLiveJobs();
  }, []);

  const fetchLiveJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/live?limit=25`);
      if (res.ok) {
        const data = await res.json();
        const jList = data.jobs || [];
        setJobs(jList);
        if (jList.length > 0) {
          setSelectedJobId(jList[0].id);
        }
      }
    } catch (err) {
      console.error("Could not fetch live jobs for tailoring:", err);
    }
  };

  const handleTailorResume = async () => {
    if (!selectedJobId) return;
    setIsTailoring(true);
    setStatusMsg(null);
    setExportedText(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/resumes/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: selectedJobId }),
      });

      if (res.ok) {
        const data: TailoredResumeData = await res.json();
        setTailoredResume(data);

        // Fetch structured diff
        const diffRes = await fetch(`${API_BASE}/api/v1/resumes/${data.id}/diff`);
        if (diffRes.ok) {
          const diff: DiffData = await diffRes.json();
          setDiffData(diff);
        }

        setStatusMsg({
          type: "success",
          text: `Tailored resume generated! Hash: ${data.sha256_hash.slice(0, 16)}... strictly cited to evidence.`,
        });
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.detail || "Tailoring failed." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Connection error: ${err.message}` });
    } finally {
      setIsTailoring(false);
    }
  };

  const handleExportATS = async () => {
    if (!tailoredResume) return;
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/resumes/${tailoredResume.id}/export`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setExportedText(data.plain_text);

        // Trigger local file download
        const blob = new Blob([data.plain_text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `SelfHire_ATS_${tailoredResume.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Export failed: ${err.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-[#2D0E03]">
              ATS Resume Customization Studio
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAD7A0] text-[#2D0E03]">
              Truth-Certified
            </span>
          </div>
          <p className="text-xs text-[#2D0E03]/70 font-sans mt-1">
            Tailors single-column ATS variants for target roles. Every statement cites an immutable Evidence ID.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vault">
            <Button variant="outline" size="sm" className="text-xs border-[#6E250A]/20 text-[#2D0E03] bg-white hover:bg-[#FEF5E7]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Evidence Vault</span>
            </Button>
          </Link>
          <Link href="/approvals">
            <Button variant="primary" size="sm" className="text-xs bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90">
              <span>Exact-Action Approval Gate</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Target Job Selection Card */}
      <Card className="p-6 bg-white border-[0.8px] border-[#6E250A]/20 rounded-xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#2D0E03] flex items-center gap-2 font-display">
          <Briefcase className="w-4 h-4 text-[#B34A0E]" />
          <span>Select Target Job Role for Alignment</span>
        </h2>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-[#2D0E03] block mb-1">
              Active Verified Job Opportunities
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#6E250A]/20 bg-[#FEF5E7]/30 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.company_name} ({j.location_raw || j.work_mode})
                </option>
              ))}
              {jobs.length === 0 && (
                <option value="">No live jobs loaded. Discover jobs from the Jobs page.</option>
              )}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleTailorResume}
              disabled={isTailoring || !selectedJobId}
              variant="primary"
              className="w-full text-xs py-2.5 bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTailoring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aligning Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Tailored ATS Variant</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tailored Output & Diff Viewer */}
      {diffData && (
        <div className="space-y-6">
          {/* Integrity Metadata Banner */}
          <div className="p-4 bg-white border border-[#6E250A]/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#2D0E03]">Target: {diffData.target_title}</span>
              <span className="font-mono text-[11px] text-[#2D0E03]/60 bg-[#FEF5E7] px-2 py-0.5 rounded border border-[#6E250A]/10">
                SHA-256: {diffData.sha256_hash.slice(0, 24)}...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportATS}
                disabled={isExporting}
                variant="outline"
                size="sm"
                className="text-xs border-[#6E250A]/20 text-[#2D0E03] bg-white hover:bg-[#FEF5E7]"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-[#B34A0E]" />
                <span>Export ATS Single-Column</span>
              </Button>
              <Link href="/approvals">
                <Button size="sm" className="text-xs bg-[#2D0E03] text-white hover:bg-[#2D0E03]/90">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>Lock in Approval Gate</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Highlighted Skills */}
          <Card className="p-4 bg-white border-[0.8px] border-[#6E250A]/15 rounded-xl">
            <h3 className="text-xs font-bold text-[#2D0E03] mb-2 uppercase tracking-wider font-mono">
              Aligned Technical Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {diffData.highlighted_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF5E7] text-[#B34A0E] border border-[#6E250A]/15"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          {/* Side-by-Side Diff & Evidence Audit */}
          <Card className="p-6 bg-white border-[0.8px] border-[#6E250A]/15 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#6E250A]/10">
              <h3 className="text-sm font-bold text-[#2D0E03] flex items-center gap-2 font-display">
                <GitCompare className="w-4 h-4 text-[#B34A0E]" />
                <span>Evidence-Linked Experience Bullets (0 Hallucinations)</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% Evidence Citation
              </span>
            </div>

            <div className="space-y-4">
              {diffData.bullet_diffs.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-[#6E250A]/15 bg-[#FEF5E7]/20 space-y-2 hover:border-[#B34A0E] transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#2D0E03]">
                      {bullet.role} — {bullet.company}
                    </span>
                    <div className="flex items-center gap-2">
                      {bullet.quantified_metric && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Google XYZ
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-[#B34A0E] bg-white px-2 py-0.5 rounded border border-[#6E250A]/15 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {bullet.evidence_id}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#2D0E03]/80 leading-relaxed font-sans">
                    • {bullet.tailored_text}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Exported Clean Preview */}
          {exportedText && (
            <Card className="p-6 bg-[#2D0E03] text-[#FEF5E7] rounded-xl font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold">ATS Plain Text Single-Column Preview</span>
                <button
                  onClick={() => navigator.clipboard.writeText(exportedText)}
                  className="text-[11px] text-amber-300 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy to Clipboard</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto text-white/90">
                {exportedText}
              </pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
