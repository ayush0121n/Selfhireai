"use client";

import React, { useState } from "react";
import {
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Palette,
  Layout,
  FileCode,
  ShieldCheck,
  Check,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResumeSheetProps {
  candidateName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
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
  sha256Hash: string;
  onDownloadJSONResume?: () => void;
}

export type ResumeLayoutTemplate = "single_column" | "two_column" | "modern_accent";

export function ReactiveResumeSheet({
  candidateName,
  email,
  phone = "+91 98765 43210",
  location = "Pune, India",
  headline = "Distributed Systems Engineer",
  summary = "Software Engineer with deep expertise in scalable backend architectures and low-latency APIs.",
  skills,
  experience,
  sha256Hash,
  onDownloadJSONResume
}: ResumeSheetProps) {
  const [layout, setLayout] = useState<ResumeLayoutTemplate>("single_column");
  const [zoom, setZoom] = useState<number>(100);
  const [accentColor, setAccentColor] = useState<string>("#B34A0E");

  const palettes = [
    { label: "Terracotta", color: "#B34A0E" },
    { label: "Espresso", color: "#2D0E03" },
    { label: "Slate Navy", color: "#1E293B" },
    { label: "Emerald", color: "#059669" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Interactive Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#2D0E03]/10 shadow-xs print:hidden">
        {/* Layout Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#6E5D53] mr-1 hidden sm:inline">Layout:</span>
          <button
            onClick={() => setLayout("single_column")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              layout === "single_column"
                ? "bg-[#2D0E03] text-white"
                : "text-[#6E5D53] hover:text-[#2D0E03] bg-[#FAF6F2]"
            }`}
          >
            Single-Column ATS
          </button>
          <button
            onClick={() => setLayout("two_column")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              layout === "two_column"
                ? "bg-[#2D0E03] text-white"
                : "text-[#6E5D53] hover:text-[#2D0E03] bg-[#FAF6F2]"
            }`}
          >
            Two-Column (Reactive)
          </button>
          <button
            onClick={() => setLayout("modern_accent")}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
              layout === "modern_accent"
                ? "bg-[#2D0E03] text-white"
                : "text-[#6E5D53] hover:text-[#2D0E03] bg-[#FAF6F2]"
            }`}
          >
            Modern Accent
          </button>
        </div>

        {/* Color Palette Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#6E5D53] mr-1 hidden md:inline">Accent:</span>
          {palettes.map((p) => (
            <button
              key={p.color}
              onClick={() => setAccentColor(p.color)}
              title={p.label}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                accentColor === p.color ? "scale-110 border-[#2D0E03]" : "border-transparent opacity-80"
              }`}
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-[#FAF6F2] rounded-lg px-2 py-1 text-xs text-[#6E5D53]">
            <button onClick={() => setZoom(Math.max(75, zoom - 10))} title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[10px] w-8 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(130, zoom + 10))} title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {onDownloadJSONResume && (
            <Button
              onClick={onDownloadJSONResume}
              variant="outline"
              size="sm"
              className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5 text-xs h-8 gap-1.5"
            >
              <FileCode className="h-3.5 w-3.5 text-[#B34A0E]" />
              JSON Resume
            </Button>
          )}

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-[#2D0E03] hover:bg-[#1A0802] text-white text-xs h-8 gap-1.5 shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Sheet Container */}
      <div className="flex justify-center p-4 sm:p-8 bg-[#FAF6F2]/80 border border-[#2D0E03]/10 rounded-2xl overflow-x-auto print:bg-white print:border-none print:p-0">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          className="transition-transform duration-200"
        >
          {/* A4/Letter Paper Container */}
          <div
            id="reactive-resume-paper"
            className="w-[210mm] min-h-[297mm] bg-white text-[#2D0E03] p-[20mm] shadow-md border border-[#2D0E03]/15 font-sans leading-relaxed print:shadow-none print:border-none print:m-0 print:p-0 print:w-full"
          >
            {/* 1. SINGLE COLUMN ATS LAYOUT */}
            {layout === "single_column" && (
              <div className="space-y-5 text-[10pt]">
                {/* Header */}
                <div className="border-b pb-3 text-center" style={{ borderColor: accentColor }}>
                  <h1 className="text-2xl font-bold font-serif tracking-tight" style={{ color: accentColor }}>
                    {candidateName}
                  </h1>
                  <p className="text-xs font-semibold text-[#2D0E03]/80 mt-0.5">{headline}</p>
                  <p className="text-[9pt] text-[#6E5D53] mt-1 font-mono">
                    {email} • {phone} • {location}
                  </p>
                </div>

                {/* Summary */}
                {summary && (
                  <div>
                    <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                      Professional Summary
                    </h2>
                    <p className="text-[9.5pt] text-[#2D0E03]/90 leading-normal">{summary}</p>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                    Core Technical Competencies
                  </h2>
                  <p className="text-[9.5pt] text-[#2D0E03]/90">
                    <strong>Primary Stack:</strong> {skills.join(", ")}
                  </p>
                  <p className="text-[9.5pt] text-[#2D0E03]/90 mt-0.5">
                    <strong>Cloud & Systems:</strong> PostgreSQL, Redis, FastAPI, Docker, Cloudflare R2, Kubernetes
                  </p>
                </div>

                {/* Experience */}
                <div>
                  <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                    Professional Experience
                  </h2>
                  <div className="space-y-4">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-[10pt]">
                          <span className="font-bold text-[#2D0E03]">
                            {exp.title} <span className="font-normal text-[#6E5D53]">| {exp.company}</span>
                          </span>
                          <span className="font-mono text-[9pt] text-[#6E5D53]">{exp.dates}</span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-[9pt] text-[#2D0E03]/90">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">
                              {b.text}{" "}
                              <span className="text-[7.5pt] font-mono text-[#6E5D53] print:hidden">
                                [Claim: {b.evidence_id}]
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h2 className="text-[11pt] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                    Education
                  </h2>
                  <div className="flex justify-between items-baseline text-[9.5pt]">
                    <div>
                      <strong>Bachelor of Engineering in Computer Science</strong> — Savitribai Phule Pune University
                    </div>
                    <span className="font-mono text-[9pt] text-[#6E5D53]">2019 — 2023</span>
                  </div>
                </div>

                {/* Verification Strip */}
                <div className="pt-4 border-t border-[#2D0E03]/10 flex justify-between items-center text-[7.5pt] text-[#6E5D53] font-mono">
                  <span>SelfHire.ai Deterministic Verification Lock</span>
                  <span>SHA-256: {sha256Hash}</span>
                </div>
              </div>
            )}

            {/* 2. TWO-COLUMN EXECUTIVE LAYOUT */}
            {layout === "two_column" && (
              <div className="grid grid-cols-12 gap-6 text-[9.5pt]">
                {/* Left Column (35%) */}
                <div className="col-span-4 border-r pr-5 space-y-5" style={{ borderColor: `${accentColor}30` }}>
                  <div>
                    <h1 className="text-xl font-bold font-serif leading-tight" style={{ color: accentColor }}>
                      {candidateName}
                    </h1>
                    <p className="text-[9pt] font-medium text-[#2D0E03]/70 mt-1">{headline}</p>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1 text-[8.5pt] text-[#6E5D53]">
                    <div className="font-bold text-[9pt] text-[#2D0E03] uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                      Contact
                    </div>
                    <div className="break-all">{email}</div>
                    <div>{phone}</div>
                    <div>{location}</div>
                  </div>

                  {/* Skills Badges */}
                  <div>
                    <div className="font-bold text-[9pt] uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                      Skills
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded text-[8pt] font-medium border"
                          style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10`, color: accentColor }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <div className="font-bold text-[9pt] uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                      Education
                    </div>
                    <div className="text-[8.5pt]">
                      <div className="font-semibold text-[#2D0E03]">B.E. Computer Science</div>
                      <div className="text-[#6E5D53]">Savitribai Phule Pune Univ.</div>
                      <div className="font-mono text-[8pt] text-[#6E5D53]">2019 — 2023</div>
                    </div>
                  </div>

                  {/* Verification */}
                  <div className="pt-3 border-t text-[7pt] text-[#6E5D53] font-mono break-all">
                    <ShieldCheck className="h-3 w-3 inline mr-1 text-[#10B981]" />
                    Verified: {sha256Hash.slice(0, 20)}...
                  </div>
                </div>

                {/* Right Column (65%) */}
                <div className="col-span-8 space-y-5">
                  {summary && (
                    <div>
                      <h2 className="text-[10pt] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                        Executive Summary
                      </h2>
                      <p className="text-[9pt] text-[#2D0E03]/90 leading-relaxed">{summary}</p>
                    </div>
                  )}

                  <div>
                    <h2 className="text-[10pt] font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                      Experience
                    </h2>
                    <div className="space-y-4">
                      {experience.map((exp, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-baseline text-[9.5pt]">
                            <span className="font-bold text-[#2D0E03]">{exp.title}</span>
                            <span className="font-mono text-[8.5pt] text-[#6E5D53]">{exp.dates}</span>
                          </div>
                          <div className="text-[9pt] font-medium" style={{ color: accentColor }}>
                            {exp.company}
                          </div>
                          <ul className="list-disc list-outside pl-4 space-y-1 text-[8.5pt] text-[#2D0E03]/90">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx} className="leading-snug">
                                {b.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MODERN ACCENT LAYOUT */}
            {layout === "modern_accent" && (
              <div className="space-y-5 text-[9.5pt]">
                {/* Header Card */}
                <div className="p-4 rounded-xl border flex justify-between items-center" style={{ backgroundColor: `${accentColor}08`, borderColor: `${accentColor}30` }}>
                  <div>
                    <h1 className="text-2xl font-bold font-serif" style={{ color: accentColor }}>
                      {candidateName}
                    </h1>
                    <p className="text-xs font-semibold text-[#2D0E03] mt-0.5">{headline}</p>
                  </div>
                  <div className="text-right text-[8.5pt] text-[#6E5D53] font-mono">
                    <div>{email}</div>
                    <div>{phone} • {location}</div>
                  </div>
                </div>

                {/* Summary */}
                {summary && (
                  <div>
                    <h2 className="text-[10pt] font-bold uppercase tracking-wider mb-1 pb-0.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                      Profile
                    </h2>
                    <p className="text-[9pt] text-[#2D0E03]/90 leading-relaxed mt-1.5">{summary}</p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h2 className="text-[10pt] font-bold uppercase tracking-wider mb-2 pb-0.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                    Experience
                  </h2>
                  <div className="space-y-4 mt-2">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[10pt] text-[#2D0E03]">
                            {exp.title} <span style={{ color: accentColor }}>@ {exp.company}</span>
                          </span>
                          <span className="font-mono text-[8.5pt] px-2 py-0.5 rounded bg-[#FAF6F2] text-[#6E5D53]">
                            {exp.dates}
                          </span>
                        </div>
                        <ul className="list-disc list-outside pl-4 space-y-1 text-[9pt] text-[#2D0E03]/90">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-snug">
                              {b.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h2 className="text-[10pt] font-bold uppercase tracking-wider mb-1 pb-0.5 border-b-2" style={{ color: accentColor, borderColor: accentColor }}>
                    Technical Skills
                  </h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md text-[8.5pt] bg-[#FAF6F2] border border-[#2D0E03]/10 text-[#2D0E03]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verification */}
                <div className="pt-3 border-t flex justify-between items-center text-[7.5pt] text-[#6E5D53] font-mono">
                  <span>Cryptographic Attestation</span>
                  <span>SHA-256: {sha256Hash}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
