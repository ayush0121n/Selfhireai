"use client";

import React, { useState } from "react";
import { GraduationCap, Sparkles, MessageSquare, CheckCircle2, Play, Mic, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InterviewsPage() {
  const [activeQuestion, setActiveQuestion] = useState(0);

  const mockQuestions = [
    {
      q: "Tell me about a time you had to optimize a high-throughput backend API under strict latency budgets.",
      context: "Acme Corp — Junior Full Stack Developer (FastAPI, Redis, 100k queries)",
      starGuide: "Situation: Microservice latency spike | Task: Reduce latency | Action: Implemented Redis caching | Result: 42% latency reduction (ev_exp_01)",
    },
    {
      q: "How do you ensure data integrity and idempotency when designing webhook receivers?",
      context: "Stripe — Python Backend Engineer",
      starGuide: "Situation: Duplicate webhook deliveries | Task: Prevent duplicate charge processing | Action: Added SHA-256 idempotency keys in PostgreSQL | Result: 0 race conditions",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Interview War-Room & STAR Practice
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Grounded interview preparation. Generates STAR-method responses based on your verified resume evidence.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          STAR Method Evaluator
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <span className="font-display text-lg font-bold text-[#2D0E03]">
              Question {activeQuestion + 1} of {mockQuestions.length}
            </span>
            <span className="text-xs font-mono text-[#B34A0E]">
              {mockQuestions[activeQuestion].context}
            </span>
          </div>

          <div className="p-4 rounded-[12px] bg-[#FEF5E7] border border-[#6E250A]/15">
            <h3 className="font-display text-xl font-bold text-[#2D0E03] leading-snug">
              "{mockQuestions[activeQuestion].q}"
            </h3>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60">
              Verified Evidence STAR Framework:
            </span>
            <div className="p-4 rounded-[10px] bg-white border border-[#6E250A]/15 text-xs text-[#2D0E03] leading-relaxed font-sans">
              {mockQuestions[activeQuestion].starGuide}
            </div>
          </div>

          <div className="pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setActiveQuestion((prev) => (prev + 1) % mockQuestions.length)}
            >
              Next Question
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => alert("Mock audio recording started. Speak your STAR answer...")}
            >
              <Mic className="w-3.5 h-3.5" />
              Practice Voice Answer
            </Button>
          </div>
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
