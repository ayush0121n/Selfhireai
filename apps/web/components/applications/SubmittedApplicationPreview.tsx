"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  FileText,
  Clock,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface FilledFieldItem {
  field_key?: string;
  label?: string;
  question_label?: string;
  value?: string | number | boolean;
  proposed_value?: string | number | boolean;
  source?: string;
  classification?: string;
  confidence?: number;
}

export interface SubmittedSnapshot {
  application_id: string;
  job_id?: string;
  company_name: string;
  job_title: string;
  destination_url?: string;
  submission_mode: "AUTO_APPLY" | "MANUAL_APPLY" | string;
  confirmation_number?: string;
  filled_fields: FilledFieldItem[];
  resume_summary?: string;
  status: string;
  submitted_at?: string;
  payload_hash?: string;
  ats_detected?: string;
  user_notes?: string;
}

function getFriendlyTag(sourceOrClass?: string): { text: string; cls: string } {
  switch (sourceOrClass) {
    case "VERIFIED_FACT":
    case "PROFILE":
      return { text: "Verified Profile", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "APPROVED_PREFERENCE":
      return { text: "Saved Preference", cls: "bg-sky-50 text-sky-700 border-sky-200" };
    case "EVIDENCE_BASED_PROSE":
      return { text: "Evidence Note", cls: "bg-amber-50 text-amber-800 border-amber-200" };
    case "LEGAL_ATTESTATION":
      return { text: "Attestation", cls: "bg-stone-100 text-stone-700 border-stone-200" };
    default:
      return { text: "Profile Detail", cls: "bg-[#FEF5E7] text-[#6E250A] border-[#6E250A]/20" };
  }
}

export function SubmittedApplicationPreview({
  snapshot,
  onConfirmSubmitted,
  confirming = false,
}: {
  snapshot: SubmittedSnapshot | null;
  onConfirmSubmitted?: () => void;
  confirming?: boolean;
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  if (!snapshot) return null;

  const isAwaitingUser = snapshot.status === "AWAITING_USER_SUBMIT";
  const fields = snapshot.filled_fields || [];

  const handleCopyAll = async () => {
    const lines = [
      `Application: ${snapshot.job_title} at ${snapshot.company_name}`,
      snapshot.destination_url ? `Portal: ${snapshot.destination_url}` : "",
      snapshot.confirmation_number ? `Confirmation: #${snapshot.confirmation_number}` : "",
      "",
      ...fields.map((f) => {
        const lbl = f.label || f.question_label || f.field_key || "Field";
        const val = f.value !== undefined ? f.value : f.proposed_value ?? "";
        return `${lbl}: ${val}`;
      }),
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <Card className="p-6 space-y-5 bg-white border border-[#6E250A]/20 rounded-xl shadow-sm print:shadow-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#6E250A]/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#B34A0E] text-white">
              {snapshot.submission_mode === "AUTO_APPLY" ? "Auto-Apply" : "Manual Apply"}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                isAwaitingUser
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isAwaitingUser ? "Awaiting Your Submit Click" : "Submitted & Confirmed"}
            </span>
            {snapshot.ats_detected && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF5E7] text-[#2D0E03] border border-[#6E250A]/15">
                {snapshot.ats_detected}
              </span>
            )}
          </div>

          <h3 className="font-display text-xl font-bold text-[#2D0E03]">
            {snapshot.job_title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#2D0E03]/70">
            <Building2 className="w-3.5 h-3.5 text-[#B34A0E]" />
            <span className="font-medium">{snapshot.company_name}</span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5">
          {snapshot.confirmation_number && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirmation #{snapshot.confirmation_number}
            </span>
          )}
          {snapshot.submitted_at && (
            <span className="text-[11px] text-[#2D0E03]/60 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(snapshot.submitted_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#FEF5E7]/60 border border-[#6E250A]/10 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>1. Fields Prepared</span>
        </div>
        <span className="text-[#6E250A]/30">→</span>
        <div
          className={`flex items-center gap-1.5 font-medium ${
            isAwaitingUser ? "text-[#B34A0E] font-bold" : "text-emerald-700"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2. Review &amp; Portal Submit</span>
        </div>
        <span className="text-[#6E250A]/30">→</span>
        <div
          className={`flex items-center gap-1.5 font-medium ${
            isAwaitingUser ? "text-[#2D0E03]/45" : "text-emerald-700 font-bold"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>3. Confirmed Receipt</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {snapshot.destination_url && (
            <a
              href={snapshot.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2D0E03] text-[#FEF5E7] hover:bg-[#B34A0E] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Official Portal
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="text-xs border-[#6E250A]/25 text-[#2D0E03]"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copiedAll ? "Copied All Answers" : "Copy All Answers"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs border-[#6E250A]/25 text-[#2D0E03] print:hidden"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Save PDF
          </Button>
        </div>

        {isAwaitingUser && onConfirmSubmitted && (
          <Button
            type="button"
            size="sm"
            disabled={confirming}
            onClick={onConfirmSubmitted}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {confirming ? "Recording..." : "I Clicked Submit — Confirm Receipt"}
          </Button>
        )}
      </div>

      {/* Filled Application Details */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-[#2D0E03]/80">
          Filled Application Details ({fields.length} fields)
        </h4>
        {fields.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#FEF5E7]/40 border border-[#6E250A]/10 text-xs text-[#2D0E03]/65">
            No custom form fields captured for this portal submission.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {fields.map((f, idx) => {
              const label = f.label || f.question_label || f.field_key || `Field ${idx + 1}`;
              const val = f.value !== undefined ? f.value : f.proposed_value ?? "";
              const tag = getFriendlyTag(f.classification || f.source);
              return (
                <div
                  key={`${label}_${idx}`}
                  className={`p-3 rounded-lg bg-[#FEF5E7]/45 border border-[#6E250A]/12 space-y-1 ${
                    String(val).length > 100 ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#2D0E03]/70">{label}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${tag.cls}`}>
                      {tag.text}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#2D0E03] break-words">
                    {String(val) || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resume Summary */}
      {snapshot.resume_summary && (
        <div className="p-3.5 rounded-lg bg-[#FEF5E7]/50 border border-[#6E250A]/12 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D0E03]">
            <FileText className="w-3.5 h-3.5 text-[#B34A0E]" />
            <span>Attached Resume Summary</span>
          </div>
          <p className="text-xs text-[#2D0E03]/80 leading-relaxed">{snapshot.resume_summary}</p>
        </div>
      )}
    </Card>
  );
}
