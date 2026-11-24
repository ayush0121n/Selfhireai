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
  Briefcase,
  Code2,
  Cpu,
  BarChart3,
  MessageSquare,
  Check,
  ExternalLink,
  ChevronRight,
  Layout,
  Eye,
  Printer,
  FileCode
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReactiveResumeSheet } from "@/components/resume/ReactiveResumeSheet";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
  tailored_summary?: string;
  tailored_headline?: string;
  tailored_experience_bullets?: Array<{
    company: string;
    title: string;
    dates: string;
    bullets: Array<{
      text: string;
      evidence_id: string;
      relevance_score?: number;
      metric_citation?: string;
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

interface RenderCVData {
  status: string;
  resume_id: string;
  theme: string;
  sha256_hash: string;
  rendercv_yaml: string;
  latex_source: string;
  typst_source: string;
  supported_themes: string[];
}

interface CareerOpsData {
  status: string;
  resume_id: string;
  sha256_hash: string;
  analysis: {
    total_bullets_analyzed: number;
    xyz_compliant_bullets: number;
    xyz_compliance_rate_pct: number;
    total_hard_metrics_found: number;
    overall_career_ops_score: number;
    quality_tier: string;
    bullet_breakdowns: Array<{
      original_text: string;
      is_xyz_compliant: boolean;
      has_hard_metrics: boolean;
      metrics_detected: string[];
      action_verb_strength: string;
      first_word: string;
      suggestion: string | null;
    }>;
  };
}

interface STARStory {
  id: string;
  category: string;
  question: string;
  competency: string;
  star_framework: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  evidence_citation: string;
  verified_metric: string;
  talking_points: string[];
}

export default function ResumesStudioPage() {
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeData | null>(null);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [rendercvData, setRendercvData] = useState<RenderCVData | null>(null);
  const [careerOpsData, setCareerOpsData] = useState<CareerOpsData | null>(null);
  const [starStories, setStarStories] = useState<STARStory[]>([]);
  
  const [activeTab, setActiveTab] = useState<"preview" | "rendercv" | "careerops" | "diff" | "star">("preview");
  const [selectedTheme, setSelectedTheme] = useState<string>("engineeringresumes");
  const [codeViewFormat, setCodeViewFormat] = useState<"yaml" | "latex" | "typst">("yaml");
  
  const [isTailoring, setIsTailoring] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchLiveJobs();
  }, []);

  const fetchLiveJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/live?limit=30`);
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

    try {
      // 1. Tailor Resume
      const res = await fetch(`${API_BASE}/api/v1/resumes/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: selectedJobId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.detail || "Tailoring failed." });
        setIsTailoring(false);
        return;
      }

      const data: TailoredResumeData = await res.json();
      setTailoredResume(data);

      // 2. Parallel fetch RenderCV, CareerOps, Diff, and STAR stories
      const [diffRes, rcvRes, copsRes, starRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/resumes/${data.id}/diff`),
        fetch(`${API_BASE}/api/v1/resumes/${data.id}/rendercv?theme=${selectedTheme}`),
        fetch(`${API_BASE}/api/v1/resumes/${data.id}/career-ops`),
        fetch(`${API_BASE}/api/v1/jobs/${selectedJobId}/interview-star`, { method: "POST" }),
      ]);

      if (diffRes.ok) {
        const diff: DiffData = await diffRes.json();
        setDiffData(diff);
      }
      if (rcvRes.ok) {
        const rcv: RenderCVData = await rcvRes.json();
        setRendercvData(rcv);
      }
      if (copsRes.ok) {
        const cops: CareerOpsData = await copsRes.json();
        setCareerOpsData(cops);
      }
      if (starRes.ok) {
        const star = await starRes.json();
        setStarStories(star.stories || []);
      }

      setStatusMsg({
        type: "success",
        text: `Tailored CV compiled! SHA-256 Digest: ${data.sha256_hash.slice(0, 16)}...`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Connection error: ${err.message}` });
    } finally {
      setIsTailoring(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setSelectedTheme(newTheme);
    if (!tailoredResume) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/resumes/${tailoredResume.id}/rendercv?theme=${newTheme}`);
      if (res.ok) {
        const data = await res.json();
        setRendercvData(data);
      }
    } catch (err) {
      console.error("Theme switch error:", err);
    }
  };

  const handleCopyCode = () => {
    if (!rendercvData) return;
    const textToCopy =
      codeViewFormat === "yaml"
        ? rendercvData.rendercv_yaml
        : codeViewFormat === "latex"
        ? rendercvData.latex_source
        : rendercvData.typst_source;

    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!rendercvData || !tailoredResume) return;
    let content = rendercvData.rendercv_yaml;
    let ext = "yaml";
    let mime = "text/yaml";

    if (codeViewFormat === "latex") {
      content = rendercvData.latex_source;
      ext = "tex";
      mime = "application/x-tex";
    } else if (codeViewFormat === "typst") {
      content = rendercvData.typst_source;
      ext = "typ";
      mime = "text/plain";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SelfHire_Resume_${tailoredResume.id.slice(0, 12)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSONResume = async () => {
    if (!tailoredResume) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/resumes/${tailoredResume.id}/json-resume`);
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data.json_resume, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SelfHire_ReactiveResume_${tailoredResume.id.slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("JSON Resume download error:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D0E03]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B34A0E] mb-1">
            <Sparkles className="h-4 w-4" />
            RenderCV & Career-Ops Synthesis Engine
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2D0E03]">
            Resume Studio
          </h1>
          <p className="text-sm text-[#6E5D53] mt-1 max-w-2xl">
            Compile atomic evidence into <strong>RenderCV YAML</strong>, <strong>LaTeX (moderncv/sb2nov)</strong>, and <strong>Typst</strong>.
            Enforces the Google XYZ impact formula with 100% cryptographic truthfulness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vault">
            <Button variant="outline" className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5">
              Evidence Vault
            </Button>
          </Link>
          <Link href="/approvals">
            <Button variant="outline" className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5">
              Approval Gate
            </Button>
          </Link>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusMsg.type === "success"
              ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
              : "bg-red-500/10 border-red-500/30 text-red-700"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Target Job Selector Card */}
      <Card className="p-6 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#2D0E03] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#B34A0E]" />
              Select Target Opening for Deterministic Tailoring
            </h2>
            <p className="text-xs text-[#6E5D53] mt-0.5">
              SelfHire scans the JD requirements, reorders evidence bullets by keyword relevance, and calculates XYZ metric scores.
            </p>
          </div>

          <Button
            onClick={handleTailorResume}
            disabled={isTailoring || !selectedJobId}
            className="bg-[#B34A0E] hover:bg-[#8F3B0B] text-white text-xs font-semibold px-5 py-2.5 rounded-xl gap-2 shrink-0 shadow-sm"
          >
            {isTailoring ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Compiling RenderCV & Career-Ops...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Tailor Resume (RenderCV)
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#6E5D53] uppercase tracking-wider mb-1">
              Live Verified Vacancy
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#2D0E03]/20 bg-[#FAF6F2] text-[#2D0E03] focus:outline-none focus:border-[#B34A0E]"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company_name} — {job.title} ({job.location_raw} • {job.work_mode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5D53] uppercase tracking-wider mb-1">
              RenderCV Typography Theme
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#2D0E03]/20 bg-[#FAF6F2] text-[#2D0E03] focus:outline-none focus:border-[#B34A0E]"
            >
              <option value="engineeringresumes">engineeringresumes (Software Engineering Standard)</option>
              <option value="classic">classic (RenderCV Default Typography)</option>
              <option value="sb2nov">sb2nov (Jake&apos;s Resume LaTeX Style)</option>
              <option value="moderncv">moderncv (European Academic / Banking)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Studio Tabs */}
      {tailoredResume && (
        <div className="space-y-6">
          {/* Navigation Pill Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2D0E03]/10 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#2D0E03]/10">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "preview"
                    ? "bg-[#2D0E03] text-white shadow-xs"
                    : "text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                <Layout className="h-3.5 w-3.5 text-[#B34A0E]" />
                Visual Sheet (Reactive)
              </button>

              <button
                onClick={() => setActiveTab("rendercv")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "rendercv"
                    ? "bg-[#2D0E03] text-white shadow-xs"
                    : "text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                RenderCV & LaTeX Source
              </button>

              <button
                onClick={() => setActiveTab("careerops")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "careerops"
                    ? "bg-[#2D0E03] text-white shadow-xs"
                    : "text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#B34A0E]" />
                Career-Ops XYZ Analyzer
                {careerOpsData && (
                  <Badge variant="outline" className="text-[10px] ml-1 bg-[#FEF5E7] text-[#2D0E03] border-none py-0">
                    {careerOpsData.analysis.overall_career_ops_score}%
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab("diff")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "diff"
                    ? "bg-[#2D0E03] text-white shadow-xs"
                    : "text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" />
                Evidence Grounding Diff
              </button>

              <button
                onClick={() => setActiveTab("star")}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === "star"
                    ? "bg-[#2D0E03] text-white shadow-xs"
                    : "text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#10B981]" />
                STAR Interview Prep
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6E5D53] font-mono">
              <Hash className="h-3.5 w-3.5 text-[#B34A0E]" />
              <span>{tailoredResume.sha256_hash.slice(0, 16)}...</span>
            </div>
          </div>

          {/* TAB 0: REACTIVE RESUME INTERACTIVE SHEET PREVIEW */}
          {activeTab === "preview" && (
            <ReactiveResumeSheet
              candidateName="Ayush Narkhede"
              email="ayush.narkhede@example.com"
              phone="+91 98765 43210"
              location="Pune, India"
              headline={tailoredResume.tailored_headline || "Distributed Systems Engineer"}
              summary={tailoredResume.tailored_summary}
              skills={tailoredResume.tailored_skills || ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Redis"]}
              experience={tailoredResume.tailored_experience_bullets || []}
              sha256Hash={tailoredResume.sha256_hash}
              onDownloadJSONResume={handleDownloadJSONResume}
            />
          )}

          {/* TAB 1: RENDERCV & LATEX COMPILER */}
          {activeTab === "rendercv" && (
            <div className="space-y-4">
              <Card className="p-6 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCodeViewFormat("yaml")}
                      className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg border ${
                        codeViewFormat === "yaml"
                          ? "bg-[#FEF5E7] border-[#B34A0E] text-[#B34A0E]"
                          : "border-transparent text-[#6E5D53] hover:text-[#2D0E03]"
                      }`}
                    >
                      RenderCV YAML
                    </button>
                    <button
                      onClick={() => setCodeViewFormat("latex")}
                      className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg border ${
                        codeViewFormat === "latex"
                          ? "bg-[#FEF5E7] border-[#B34A0E] text-[#B34A0E]"
                          : "border-transparent text-[#6E5D53] hover:text-[#2D0E03]"
                      }`}
                    >
                      LaTeX (.tex)
                    </button>
                    <button
                      onClick={() => setCodeViewFormat("typst")}
                      className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg border ${
                        codeViewFormat === "typst"
                          ? "bg-[#FEF5E7] border-[#B34A0E] text-[#B34A0E]"
                          : "border-transparent text-[#6E5D53] hover:text-[#2D0E03]"
                      }`}
                    >
                      Typst (.typ)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      size="sm"
                      className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5 text-xs gap-1.5 h-8"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCode ? "Copied" : "Copy Source"}
                    </Button>

                    <Button
                      onClick={handleDownloadFile}
                      size="sm"
                      className="bg-[#2D0E03] hover:bg-[#1A0802] text-white text-xs gap-1.5 h-8"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download .{codeViewFormat}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl bg-[#2D0E03] text-[#FEF5E7] p-4 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed shadow-inner">
                  <pre>
                    {codeViewFormat === "yaml"
                      ? rendercvData?.rendercv_yaml
                      : codeViewFormat === "latex"
                      ? rendercvData?.latex_source
                      : rendercvData?.typst_source}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-[#FEF5E7] border border-[#2D0E03]/10 text-xs text-[#6E5D53] flex items-center justify-between">
                  <span>
                    Directly executable with CLI: <code className="font-mono text-[#2D0E03] font-semibold">rendercv render SelfHire_Resume.yaml</code>
                  </span>
                  <a
                    href="https://github.com/rendercv/rendercv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B34A0E] hover:underline flex items-center gap-1 font-medium"
                  >
                    RenderCV Spec Docs <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: CAREER-OPS GOOGLE XYZ ANALYZER */}
          {activeTab === "careerops" && careerOpsData && (
            <div className="space-y-6">
              {/* Score Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
                    Career-Ops Score
                  </div>
                  <div className="text-3xl font-bold font-serif text-[#B34A0E]">
                    {careerOpsData.analysis.overall_career_ops_score}
                    <span className="text-base font-normal text-[#6E5D53]">/100</span>
                  </div>
                  <div className="text-xs text-[#10B981] mt-1 font-semibold">
                    {careerOpsData.analysis.quality_tier} Tier
                  </div>
                </Card>

                <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
                    Google XYZ Compliance
                  </div>
                  <div className="text-3xl font-bold font-serif text-[#2D0E03]">
                    {careerOpsData.analysis.xyz_compliance_rate_pct}%
                  </div>
                  <div className="text-xs text-[#6E5D53] mt-1">
                    {careerOpsData.analysis.xyz_compliant_bullets} of {careerOpsData.analysis.total_bullets_analyzed} bullets
                  </div>
                </Card>

                <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
                    Hard Metrics Verified
                  </div>
                  <div className="text-3xl font-bold font-serif text-[#10B981]">
                    {careerOpsData.analysis.total_hard_metrics_found}
                  </div>
                  <div className="text-xs text-[#6E5D53] mt-1">
                    Latency, scale, throughput & %
                  </div>
                </Card>

                <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
                    Formula Directive
                  </div>
                  <div className="text-xs text-[#2D0E03] font-medium mt-1 leading-snug">
                    Accomplished <span className="text-[#B34A0E] font-bold">[X]</span>, measured by <span className="text-[#10B981] font-bold">[Y]</span>, by doing <span className="text-[#2D0E03] font-bold">[Z]</span>.
                  </div>
                </Card>
              </div>

              {/* Bullet Breakdowns */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#2D0E03]">
                  Quantifiable Achievement Bullet Audit ({careerOpsData.analysis.bullet_breakdowns.length})
                </h3>

                {careerOpsData.analysis.bullet_breakdowns.map((b, i) => (
                  <Card key={i} className="p-4 bg-white border border-[#2D0E03]/10 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            b.is_xyz_compliant
                              ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                              : "bg-amber-500/10 text-amber-800 border-amber-500/30"
                          }`}
                        >
                          {b.is_xyz_compliant ? "XYZ COMPLIANT" : "NEEDS QUANTIFICATION"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono bg-[#FAF6F2] text-[#2D0E03] border-[#2D0E03]/15">
                          VERB: {b.action_verb_strength} ({b.first_word})
                        </Badge>
                      </div>

                      {b.metrics_detected.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {b.metrics_detected.map((m, mIdx) => (
                            <span key={mIdx} className="text-[10px] px-2 py-0.5 rounded bg-[#FEF5E7] text-[#B34A0E] font-mono border border-[#B34A0E]/20">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#2D0E03] font-medium leading-relaxed">
                      {b.original_text}
                    </p>

                    {b.suggestion && (
                      <div className="text-[11px] text-[#6E5D53] bg-[#FEF5E7] p-2 rounded-lg border border-[#2D0E03]/10 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-[#B34A0E] shrink-0" />
                        <span><strong>Career-Ops Tip:</strong> {b.suggestion}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE GROUNDING DIFF */}
          {activeTab === "diff" && diffData && (
            <Card className="p-6 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#2D0E03]/10 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#2D0E03]">Master Evidence vs Tailored Resume Diff</h3>
                  <p className="text-xs text-[#6E5D53] mt-0.5">
                    Zero unverified claims. Every synthesized line cites an immutable cryptographic evidence ID.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  0 Hallucinations
                </Badge>
              </div>

              <div className="space-y-3">
                {diffData.bullet_diffs.map((diff, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAF6F2] border border-[#2D0E03]/10 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#2D0E03]">{diff.company} — {diff.role}</span>
                      <span className="font-mono text-[#B34A0E]">[Citation: {diff.evidence_id}]</span>
                    </div>
                    <p className="text-xs text-[#6E5D53]">{diff.tailored_text}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 4: STAR INTERVIEW PREP */}
          {activeTab === "star" && (
            <div className="space-y-4">
              <Card className="p-6 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-4">
                <div className="border-b border-[#2D0E03]/10 pb-3">
                  <h3 className="font-bold text-sm text-[#2D0E03]">
                    STAR Framework Behavioral Interview Answers
                  </h3>
                  <p className="text-xs text-[#6E5D53] mt-0.5">
                    Derived from <code>07-interview-prep.md</code> and verified evidence claims. Keeps answers structured and evidence-grounded.
                  </p>
                </div>

                <div className="space-y-4">
                  {starStories.map((story) => (
                    <Card key={story.id} className="p-5 bg-[#FAF6F2] border border-[#2D0E03]/10 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D0E03]/10 pb-2">
                        <div>
                          <Badge variant="outline" className="text-[10px] bg-[#FEF5E7] text-[#B34A0E] border-[#B34A0E]/30 mb-1">
                            {story.category}
                          </Badge>
                          <h4 className="font-bold text-xs text-[#2D0E03]">{story.question}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#6E5D53] shrink-0">
                          Evidence: {story.evidence_citation}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-[#2D0E03]/10">
                          <span className="font-bold text-[#2D0E03] block mb-1">Situation & Task</span>
                          <p className="text-[#6E5D53] leading-relaxed mb-2">{story.star_framework.situation}</p>
                          <p className="text-[#6E5D53] leading-relaxed">{story.star_framework.task}</p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-[#2D0E03]/10">
                          <span className="font-bold text-[#2D0E03] block mb-1">Action & Result</span>
                          <p className="text-[#6E5D53] leading-relaxed mb-2">{story.star_framework.action}</p>
                          <p className="text-[#10B981] font-medium leading-relaxed">{story.star_framework.result}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#2D0E03]/10 flex flex-wrap gap-2 items-center text-[11px]">
                        <span className="font-semibold text-[#2D0E03]">Talking Points:</span>
                        {story.talking_points.map((pt, pIdx) => (
                          <span key={pIdx} className="px-2 py-0.5 rounded bg-white border border-[#2D0E03]/10 text-[#6E5D53]">
                            {pt}
                          </span>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
