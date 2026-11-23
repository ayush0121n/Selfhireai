"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck, FileText, Send, Building2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = (params?.applicationId as string) || "app-101";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/applications" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications Tracker
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
              Application #{applicationId}
            </h1>
            <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
              Junior Full Stack Developer at Acme Corp • Submitted via Greenhouse Adapter
            </p>
          </div>
          <Badge variant="success" className="px-3 py-1 text-xs">
            SUBMITTED & CONFIRMED
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-3">
              Application Milestones
            </h3>
            <div className="space-y-3">
              {[
                { time: "Today, 10:14 AM", title: "Job Discovered & Ingested", desc: "Matched from official Greenhouse feed with 94% fit score." },
                { time: "Today, 10:15 AM", title: "Tailored Resume Generated", desc: "Mapped 4 verified bullet points with Google XYZ citations (0 hallucinations)." },
                { time: "Today, 10:44 AM", title: "Exact-Action Approval Authorized", desc: "Candidate Ayush approved SHA-256 payload hash: e7b92f44...8a1b." },
                { time: "Today, 10:45 AM", title: "Submission Confirmed", desc: "Received confirmation receipt from employer ATS. Confirmation ID: APP-98421." },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/10 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-[#2D0E03]">{step.title}</div>
                    <div className="text-[#2D0E03]/70 mt-0.5">{step.desc}</div>
                    <div className="text-[10px] text-[#2D0E03]/50 font-mono mt-1">{step.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#2D0E03] mb-2">
              Cryptographic Receipt
            </h3>
            <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
              Every submitted application carries an immutable SHA-256 hash guaranteeing the payload was approved by the candidate.
            </p>

            <div className="mt-3 p-3 rounded-[8px] bg-[#FEF5E7] font-mono text-[10px] text-[#2D0E03]/70 break-all border border-[#6E250A]/10">
              SHA-256: e7b92f448c901a88b1f5d6e2417a8c3d902e5b4a7c1d3e8f6a9b0c2d4e6f8a1b
            </div>
          </div>

          <div className="pt-4 border-t border-[#6E250A]/10">
            <Link href="/auto-apply" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View Submission Logs
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
