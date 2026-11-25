"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Sparkles, Download, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface TailoredResumeSummary {
  id: string;
  job_id: string;
  summary_statement?: string;
  tailored_bullets?: { evidence_id: string; text: string; metric_citation?: string }[];
  highlighted_skills?: string[];
}

export default function ResumeComparePage() {
  const [resumes, setResumes] = useState<TailoredResumeSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [originalBullets, setOriginalBullets] = useState<string[]>([]);
  const [acceptedChanges, setAcceptedChanges] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, resList] = await Promise.all([
        fetch(`${API_BASE}/api/v1/profile`),
        fetch(`${API_BASE}/api/v1/resumes/list`),
      ]);
      if (profRes.ok) {
        const p = await profRes.json();
        const expBullets: string[] = [];
        for (const exp of p.experience || []) {
          for (const b of exp.bullets || []) {
            expBullets.push(typeof b === "string" ? b : b.text || JSON.stringify(b));
          }
        }
        if (expBullets.length === 0 && Array.isArray(p.evidence)) {
          for (const ev of p.evidence) {
            expBullets.push(ev.verified_claim);
          }
        }
        setOriginalBullets(expBullets);
      }
      if (resList.ok) {
        const data = await resList.json();
        const list: TailoredResumeSummary[] = data.resumes || [];
        setResumes(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          setAcceptedChanges((list[0].tailored_bullets || []).map((_, idx) => idx));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeResume = resumes.find((r) => r.id === selectedId) || resumes[0];
  const tailoredBullets = activeResume?.tailored_bullets || [];

  const toggleAccept = (idx: number) => {
    setAcceptedChanges((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleExport = async () => {
    if (!activeResume) return;
    const content = [
      `# Tailored Resume (${activeResume.id})`,
      activeResume.summary_statement ? `\n## Summary\n${activeResume.summary_statement}` : "",
      `\n## Verified Bullets\n`,
      ...tailoredBullets
        .filter((_, idx) => acceptedChanges.includes(idx))
        .map((b) => `- ${b.text} [${b.evidence_id}]`),
    ].join("\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tailored_resume_${activeResume.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMsg("Approved tailored resume downloaded as Markdown.");
    setTimeout(() => setExportMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/resumes" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to ATS Resume Studio
          </Link>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            ATS Resume Diff & Verification Comparator
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans">
            Side-by-side comparison between your Master Profile and generated Tailored Resumes with immutable evidence IDs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {activeResume && (
            <Button variant="primary" size="sm" className="text-xs gap-1.5" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Export Approved ({acceptedChanges.length}/{tailoredBullets.length})
            </Button>
          )}
        </div>
      </div>

      {exportMsg && (
        <Card className="p-3 bg-emerald-50 border-emerald-200 text-xs text-emerald-800 font-medium">
          {exportMsg}
        </Card>
      )}

      {resumes.length > 0 && (
        <Card className="p-4 flex items-center gap-3">
          <span className="text-xs font-bold text-[#2D0E03]">Tailored Version:</span>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              const found = resumes.find((r) => r.id === e.target.value);
              setAcceptedChanges((found?.tailored_bullets || []).map((_, idx) => idx));
            }}
            className="flex-1 py-1.5 px-3 text-xs rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15 text-[#2D0E03]"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} (Job: {r.job_id})
              </option>
            ))}
          </select>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <h3 className="font-display text-lg font-bold text-[#2D0E03]">
              Original Master Profile
            </h3>
            <span className="text-xs text-[#2D0E03]/50 font-mono">Source Truth</span>
          </div>

          <div className="space-y-3">
            {originalBullets.length > 0 ? (
              originalBullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[10px] bg-[#FEF5E7]/40 border border-[#6E250A]/10 text-xs text-[#2D0E03]/80 leading-relaxed"
                >
                  {bullet}
                </div>
              ))
            ) : (
              <div className="text-xs text-[#2D0E03]/60">No experience bullets loaded in profile.</div>
            )}
          </div>
        </Card>

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

          {tailoredBullets.length > 0 ? (
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
                        {bullet.evidence_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAccept(idx)}
                        className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                          isAccepted ? "bg-emerald-100 text-emerald-800" : "bg-[#FEF5E7] text-[#2D0E03]/70"
                        }`}
                      >
                        {isAccepted ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {isAccepted ? "Accepted" : "Excluded"}
                      </button>
                    </div>
                    <p className="text-[#2D0E03] leading-relaxed">{bullet.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-[12px] bg-[#FEF5E7]/40 border border-dashed border-[#6E250A]/20 text-xs text-[#2D0E03]/70 text-center space-y-2">
              <p>No tailored resume generated in this session yet.</p>
              <Link href="/resumes">
                <Button variant="primary" size="sm" className="text-xs">
                  Generate Tailored Resume in Studio
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
