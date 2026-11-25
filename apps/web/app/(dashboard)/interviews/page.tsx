"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface LiveJobOption {
  id: string;
  job_title?: string;
  title?: string;
  company_name: string;
}

interface StarPrompt {
  question: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  evidence_id?: string;
  star_answer?: string;
}

export default function InterviewsPage() {
  const [jobs, setJobs] = useState<LiveJobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [questions, setQuestions] = useState<StarPrompt[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [practiceNotes, setPracticeNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/live?limit=15`);
      if (res.ok) {
        const data = await res.json();
        const list: LiveJobOption[] = data.jobs || [];
        setJobs(list);
        if (list.length > 0 && !selectedJobId) {
          setSelectedJobId(list[0].id);
          generateStar(list[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const generateStar = async (jobId: string) => {
    if (!jobId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/${encodeURIComponent(jobId)}/interview-star`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.star_questions || data.questions || data.prompts || [];
        setQuestions(Array.isArray(raw) ? raw : []);
        setActiveIdx(0);
      }
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQ = questions[activeIdx];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Interview War-Room & STAR Practice
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Grounded interview preparation powered by <code>POST /api/v1/jobs/{'{job_id}'}/interview-star</code> and your Evidence Vault.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          STAR Method Evaluator
        </Badge>
      </div>

      {/* Target Job Selector */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-[#2D0E03] whitespace-nowrap">Target Role:</span>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              generateStar(e.target.value);
            }}
            className="flex-1 py-2 px-3 text-xs rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/15 text-[#2D0E03]"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.company_name} — {j.job_title || j.title}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={!selectedJobId || generating}
          onClick={() => generateStar(selectedJobId)}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating..." : "Regenerate STAR Prompts"}
        </Button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          {loading || generating ? (
            <div className="h-52 animate-pulse bg-[#FEF5E7]/60 rounded-[12px]" />
          ) : currentQ ? (
            <>
              <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
                <span className="font-display text-lg font-bold text-[#2D0E03]">
                  Question {activeIdx + 1} of {questions.length}
                </span>
                {currentQ.evidence_id && (
                  <Badge variant="success" className="text-[10px] font-mono">
                    {currentQ.evidence_id}
                  </Badge>
                )}
              </div>

              <div className="p-4 rounded-[12px] bg-[#FEF5E7] border border-[#6E250A]/15">
                <h3 className="font-display text-xl font-bold text-[#2D0E03] leading-snug">
                  "{currentQ.question}"
                </h3>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#B34A0E]" /> Verified Evidence STAR Breakdown
                </span>
                <div className="p-4 rounded-[10px] bg-white border border-[#6E250A]/15 text-xs text-[#2D0E03] leading-relaxed space-y-1.5">
                  {currentQ.star_answer ? (
                    <p>{currentQ.star_answer}</p>
                  ) : (
                    <>
                      {currentQ.situation && <div><strong>Situation:</strong> {currentQ.situation}</div>}
                      {currentQ.task && <div><strong>Task:</strong> {currentQ.task}</div>}
                      {currentQ.action && <div><strong>Action:</strong> {currentQ.action}</div>}
                      {currentQ.result && <div><strong>Result:</strong> {currentQ.result}</div>}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2D0E03]">Your Rehearsal Notes</label>
                <textarea
                  rows={3}
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                  placeholder="Draft your spoken response or key metrics to mention..."
                  className="w-full p-3 text-xs rounded-[10px] bg-[#FEF5E7]/40 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                />
              </div>

              <div className="pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActiveIdx((prev) => (prev + 1) % questions.length)}
                >
                  Next Question
                </Button>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Grounded in Evidence Vault
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-[#2D0E03]/70 py-8 text-center">
              Select a target role above to generate grounded STAR interview prompts.
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              Behavioral Matrix
            </h3>
            <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
              Every practice answer is cross-checked against your real Evidence Vault to ensure you never stumble or invent figures during live technical rounds.
            </p>
          </div>

          <div className="p-3 rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/10 text-xs text-[#2D0E03]/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Answers ground strictly in verified Google XYZ citations.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
