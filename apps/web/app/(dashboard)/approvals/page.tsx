"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmittedApplicationPreview, type SubmittedSnapshot } from "@/components/applications/SubmittedApplicationPreview";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FSM_STATES = [
  { id: "DISCOVERED", label: "Discovered" },
  { id: "VERIFIED", label: "Verified" },
  { id: "ANALYZED", label: "Analyzed" },
  { id: "SHORTLISTED", label: "Shortlisted" },
  { id: "DRAFTING", label: "Drafting" },
  { id: "PREPARED", label: "Prepared" },
  { id: "NEEDS_APPROVAL", label: "Needs Approval" },
  { id: "APPROVED", label: "Approved" },
  { id: "SUBMITTING", label: "Submitting" },
  { id: "CONFIRMED", label: "Confirmed" },
];

interface FieldMapping {
  field_key: string;
  question_label?: string;
  field_label?: string;
  proposed_value: string;
  classification: string;
}

interface ApprovalItem {
  approval_id: string;
  user_id: string;
  application_id: string;
  destination_url: string;
  payload_hash: string;
  tailored_resume_hash: string;
  expires_at: string;
  is_consumed: boolean;
  field_mappings: FieldMapping[];
}

interface ConfirmedReceipt {
  receipt_id: string;
  application_id?: string;
  confirmation_number: string;
  final_destination_url: string;
  status: string;
  company_name?: string;
  job_title?: string;
  submission_mode?: string;
  snapshot?: SubmittedSnapshot;
}

function getFriendlyClassification(classification: string): { label: string; style: string } {
  switch (classification) {
    case "VERIFIED_FACT":
      return { label: "Verified Profile", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "APPROVED_PREFERENCE":
      return { label: "Saved Preference", style: "bg-sky-50 text-sky-700 border-sky-200" };
    case "EVIDENCE_BASED_PROSE":
      return { label: "Drafted from Evidence", style: "bg-amber-50 text-amber-800 border-amber-200" };
    case "LEGAL_ATTESTATION":
      return { label: "Attestation", style: "bg-stone-100 text-stone-700 border-stone-200" };
    default:
      return { label: "Needs Input", style: "bg-orange-50 text-[#B34A0E] border-[#B34A0E]/30" };
  }
}

function formatPortalTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} (${host})`;
    }
    return host;
  } catch {
    return url;
  }
}

export default function ApprovalsGatePage() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [confirmedReceipts, setConfirmedReceipts] = useState<ConfirmedReceipt[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<SubmittedSnapshot | null>(null);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const [pendingRes, receiptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/approvals/pending`),
        fetch(`${API_BASE}/api/v1/approvals/receipts`),
      ]);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingApprovals(data.approvals || []);
      }
      if (receiptsRes.ok) {
        const rData = await receiptsRes.json();
        setConfirmedReceipts(rData.receipts || []);
      }
    } catch (err) {
      console.error("Could not fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEdit = (approvalId: string, fieldKey: string, val: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [approvalId]: {
        ...(prev[approvalId] || {}),
        [fieldKey]: val,
      },
    }));
  };

  const handleDecision = async (approvalId: string, approved: boolean) => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/approvals/${approvalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          updated_fields: editedValues[approvalId] || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (approved && data.receipt) {
          setConfirmedReceipts((prev) => [data.receipt, ...prev]);
          if (data.snapshot) {
            setLatestSnapshot(data.snapshot);
          }
          setStatusMsg({
            type: "success",
            text: `Application submitted cleanly. Confirmation #${data.receipt.confirmation_number} recorded.`,
          });
        } else {
          setStatusMsg({
            type: "success",
            text: "Application cancelled and removed from queue.",
          });
        }
        await fetchPendingApprovals();
      } else {
        const err = await res.json().catch(() => ({ detail: "Action failed." }));
        setStatusMsg({ type: "error", text: err.detail || "Action failed." });
      }
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: `Connection error: ${err instanceof Error ? err.message : "Backend unreachable"}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrepareActiveJob = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const jobsRes = await fetch(`${API_BASE}/api/v1/jobs/live?limit=1`);
      const jobsData = await jobsRes.json();
      const firstJob = jobsData.jobs?.[0];

      if (!firstJob) {
        setStatusMsg({ type: "error", text: "No active jobs found. Discover jobs first." });
        return;
      }

      const prepRes = await fetch(`${API_BASE}/api/v1/applications/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: firstJob.id,
          destination_url: firstJob.canonical_url || "https://jobs.ashbyhq.com/supabase",
        }),
      });

      if (prepRes.ok) {
        setStatusMsg({
          type: "success",
          text: `Prepared application review package for ${firstJob.title} at ${firstJob.company_name}.`,
        });
        await fetchPendingApprovals();
      } else {
        const err = await prepRes.json().catch(() => ({ detail: "Preparation failed." }));
        setStatusMsg({ type: "error", text: err.detail || "Could not prepare application package." });
      }
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: `Preparation error: ${err instanceof Error ? err.message : "Backend unreachable"}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#2D0E03]">
              Approval Gate
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAD7A0] text-[#2D0E03]">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs text-[#2D0E03]/70 mt-1">
            Nothing is ever submitted without your explicit review and confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPendingApprovals}
            variant="outline"
            size="sm"
            className="text-xs border-[#6E250A]/20 text-[#2D0E03] bg-white hover:bg-[#FEF5E7]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handlePrepareActiveJob}
            disabled={isProcessing}
            variant="primary"
            size="sm"
            className="text-xs bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Prepare Application
          </Button>
        </div>
      </div>

      {/* Clean Application Pipeline Stepper */}
      <Card className="p-4 bg-white border-[0.8px] border-[#6E250A]/20 rounded-xl overflow-x-auto shadow-sm">
        <div className="flex items-center justify-between min-w-[700px] gap-1">
          {FSM_STATES.map((st, idx) => {
            const isApprovalStep = st.id === "NEEDS_APPROVAL";
            const isConfirmedStep = st.id === "CONFIRMED";
            return (
              <div key={st.id} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center w-full transition ${
                    isApprovalStep
                      ? "bg-[#B34A0E] text-white shadow-sm ring-2 ring-[#B34A0E]/30"
                      : isConfirmedStep
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "bg-[#FEF5E7]/50 text-[#2D0E03]/70 border border-[#6E250A]/10"
                  }`}
                >
                  <span className="text-[10px] font-semibold opacity-70">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-semibold tracking-tight">{st.label}</span>
                </div>
                {idx < FSM_STATES.length - 1 && (
                  <span className="text-[#6E250A]/30 text-xs">→</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Status Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
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
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Pending Approvals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#2D0E03] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#B34A0E]" />
            <span>Ready for Your Review ({pendingApprovals.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#2D0E03]/60">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#B34A0E]" />
            <span>Loading pending applications...</span>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-[#6E250A]/15 rounded-xl">
            <ShieldCheck className="w-10 h-10 text-emerald-600/60 mx-auto mb-2" />
            <h3 className="font-display text-base font-bold text-[#2D0E03] mb-1">
              All Caught Up
            </h3>
            <p className="text-xs text-[#2D0E03]/65 max-w-md mx-auto">
              No pending submissions waiting in the queue. Click &quot;Prepare Application&quot; above or start an application from Discover Jobs.
            </p>
          </Card>
        ) : (
          pendingApprovals.map((appr) => {
            const portalName = formatPortalTitle(appr.destination_url);
            const edits = editedValues[appr.approval_id] || {};
            return (
              <Card
                key={appr.approval_id}
                className="p-6 bg-white border-[0.8px] border-[#6E250A]/20 rounded-xl shadow-sm space-y-5"
              >
                {/* Clean Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#6E250A]/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#B34A0E] text-white">
                        Ready for Review
                      </span>
                      <h3 className="text-base font-bold text-[#2D0E03]">
                        {portalName}
                      </h3>
                    </div>
                    <a
                      href={appr.destination_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#6E250A]/70 hover:text-[#B34A0E]"
                    >
                      <span>{appr.destination_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#2D0E03]/70">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF5E7] border border-[#6E250A]/15">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Integrity Locked</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B34A0E]" />
                      <span>Expires {new Date(appr.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  </div>
                </div>

                {/* Form Fields Review */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-[#2D0E03]/80">
                    Review Form Details Before Submitting
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {appr.field_mappings.map((fm, idx) => {
                      const label = fm.question_label || fm.field_label || fm.field_key;
                      const badge = getFriendlyClassification(fm.classification);
                      const currentVal = edits[fm.field_key] !== undefined ? edits[fm.field_key] : String(fm.proposed_value || "");
                      const isEditable = fm.classification === "UNKNOWN" || fm.classification === "EVIDENCE_BASED_PROSE" || !currentVal;

                      return (
                        <div
                          key={`${fm.field_key}_${idx}`}
                          className={`p-3 rounded-lg bg-[#FEF5E7]/45 border border-[#6E250A]/12 space-y-1.5 ${
                            fm.field_key === "motivation_note" ? "md:col-span-2" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-[#2D0E03]/75 truncate">
                              {label}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${badge.style}`}>
                              {badge.label}
                            </span>
                          </div>

                          {isEditable ? (
                            fm.field_key === "motivation_note" ? (
                              <textarea
                                rows={2}
                                value={currentVal}
                                onChange={(e) => handleFieldEdit(appr.approval_id, fm.field_key, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs text-[#2D0E03] bg-white border border-[#6E250A]/25 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                                placeholder="Enter response..."
                              />
                            ) : (
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) => handleFieldEdit(appr.approval_id, fm.field_key, e.target.value)}
                                className="w-full px-2.5 py-1 text-xs text-[#2D0E03] bg-white border border-[#6E250A]/25 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                                placeholder="Enter value..."
                              />
                            )
                          ) : (
                            <div className="text-sm font-semibold text-[#2D0E03] break-words">
                              {currentVal || "—"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#6E250A]/10 flex items-center justify-end gap-3">
                  <Button
                    onClick={() => handleDecision(appr.approval_id, false)}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Reject &amp; Cancel
                  </Button>
                  <Button
                    onClick={() => handleDecision(appr.approval_id, true)}
                    disabled={isProcessing}
                    variant="primary"
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Approve &amp; Submit
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Immediate Post-Submit Preview */}
      {latestSnapshot && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#2D0E03]">
              Submitted Application Preview
            </h2>
            <button
              type="button"
              onClick={() => setLatestSnapshot(null)}
              className="text-xs text-[#6E250A] hover:underline"
            >
              Dismiss Preview
            </button>
          </div>
          <SubmittedApplicationPreview snapshot={latestSnapshot} />
        </div>
      )}

      {/* Confirmed Submissions */}
      {confirmedReceipts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-[#2D0E03] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Submitted Applications ({confirmedReceipts.length})</span>
          </h2>
          <div className="space-y-3">
            {confirmedReceipts.map((rc) => {
              const isExpanded = expandedReceiptId === rc.receipt_id;
              return (
                <Card key={rc.receipt_id} className="p-4 bg-white border border-emerald-200 rounded-xl space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-800">
                          {rc.job_title ? `${rc.job_title} at ${rc.company_name}` : `Confirmation #${rc.confirmation_number}`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
                          {rc.submission_mode === "MANUAL_APPLY" ? "Manual Apply" : "Submitted"}
                        </span>
                      </div>
                      <p className="text-xs text-[#2D0E03]/65 truncate">{rc.final_destination_url}</p>
                    </div>
                    {rc.snapshot && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedReceiptId(isExpanded ? null : rc.receipt_id)}
                        className="text-xs border-[#6E250A]/25 text-[#2D0E03] shrink-0"
                      >
                        {isExpanded ? "Hide Filled Details" : "View Filled Application"}
                      </Button>
                    )}
                  </div>
                  {isExpanded && rc.snapshot && (
                    <SubmittedApplicationPreview snapshot={rc.snapshot} />
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
