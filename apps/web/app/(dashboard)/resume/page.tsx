"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MultiSourceResumeUpload from "@/components/MultiSourceResumeUpload";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ResumeStudioPage() {
  const [resumeText, setResumeText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleParseResume = async () => {
    if (!resumeText.trim()) return;
    setIsParsing(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/resumes/upload-rag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: resumeText }),
      });

      if (res.ok) {
        const data = await res.json();
        setParsedData(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to extract RAG evidence.");
      }
    } catch (err: any) {
      setErrorMsg(`API connection error: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Source Resume Importer */}
      <MultiSourceResumeUpload />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            ATS Resume Studio & Python RAG Extractor
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Zero-Hallucination Pipeline. Extracts Google XYZ quantified metrics and maps claims to immutable Evidence IDs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="peach" className="px-3 py-1 text-xs">
            XYZ Metric Validator Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & Raw Input */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              Ingest Master Resume
            </h3>
            <p className="text-xs text-[#2D0E03]/70 mb-4 leading-relaxed">
              Paste your raw resume text below. Our zero-cost Python RAG engine will segment sections, extract technical skills, and link every bullet point to an immutable evidence coordinate.
            </p>

            <textarea
              rows={14}
              placeholder="Paste plain resume text here (Work experience, metrics, skills)..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full p-3.5 text-xs font-mono rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
            />

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  setResumeText(`Ayush Sharma\nayush@example.com | +91 98765 43210\n\nEXPERIENCE\nSoftware Engineer | Acme Corp (2023 - Present)\n- Architected high-throughput microservice in FastAPI reducing response latency by 42% across 100k daily queries.\n- Built automated job ingestion pipeline utilizing Docker and PostgreSQL, scaling crawler throughput by 3x.\n- Maintained 99.9% uptime across production Kubernetes clusters with zero security incidents.\n\nTECHNICAL SKILLS\nPython, FastAPI, Docker, Kubernetes, React, TypeScript, PostgreSQL, AWS`)
                }
              >
                Load Real Template
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={isParsing || !resumeText.trim()}
                onClick={handleParseResume}
                className="text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isParsing ? "Extracting Evidence..." : "Run Python RAG Parser"}
              </Button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-[8px] bg-red-50 text-red-800 text-xs border border-red-200">
                {errorMsg}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Parsed Evidence & XYZ Compliance */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                Extracted Evidence Vault
              </h3>
              {parsedData && (
                <Badge variant="success" className="text-xs">
                  {parsedData.evidence_items?.length || 0} Verified Claims
                </Badge>
              )}
            </div>

            {parsedData ? (
              <div className="space-y-4">
                {/* Identity & Extracted Skills */}
                <div className="p-3.5 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold text-[#2D0E03]">
                      {parsedData.candidate_name}
                    </span>
                    <span className="text-xs text-[#2D0E03]/70 font-mono">
                      {parsedData.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#2D0E03]/50 block mb-1">
                      Extracted Verified Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {parsedData.skills?.map((skill: string) => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-0.5 rounded bg-white font-mono text-[#2D0E03] border border-[#6E250A]/10 font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bullets with Google XYZ Format Check */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60">
                    Parsed Google XYZ Bullets & Evidence IDs
                  </span>

                  {parsedData.bullets?.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[10px] bg-white border border-[#6E250A]/15 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#B34A0E]">
                          [{b.evidence_id}]
                        </span>
                        {b.is_xyz_compliant ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> XYZ Compliant ({b.metric_y})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Qualitative Claim
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#2D0E03] leading-relaxed">
                        {b.raw_text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
                  <span className="text-xs text-[#2D0E03]/60 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Bound to candidate profile evidence graph
                  </span>
                  <Link href="/matches">
                    <Button variant="primary" size="sm" className="text-xs gap-1.5">
                      Proceed to Job Matching
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FEF5E7]/50 rounded-[12px] border border-dashed border-[#6E250A]/20">
                <FileText className="w-8 h-8 text-[#B34A0E] mx-auto mb-2 opacity-50" />
                <h4 className="font-display text-lg font-bold text-[#2D0E03]">
                  No Extracted Evidence Yet
                </h4>
                <p className="text-xs text-[#2D0E03]/60 max-w-sm mx-auto mt-1">
                  Paste your resume and click "Run Python RAG Parser" to populate your verified Evidence Vault.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
