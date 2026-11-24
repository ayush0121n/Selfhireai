"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  KeyRound,
  ExternalLink,
  Lock,
  ArrowRight,
  Hash,
  RefreshCw,
  Send,
  FileCheck2,
  AlertTriangle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface ApprovalItem {
  approval_id: string;
  user_id: string;
  application_id: string;
  destination_url: string;
  payload_hash: string;
  tailored_resume_hash: string;
  expires_at: string;
  is_consumed: boolean;
  field_mappings: Array<{
    field_key: string;
    field_label: string;
    proposed_value: any;
    confidence_score: number;
    classification: string;
  }>;
}

interface ConfirmedReceipt {
  receipt_id: string;
  confirmation_number: string;
  final_destination_url: string;
  screenshot_storage_key: string;
  status: string;
}

export default function ApprovalsGatePage() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [confirmedReceipts, setConfirmedReceipts] = useState<ConfirmedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/approvals/pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data.approvals || []);
      }
    } catch (err) {
      console.error("Could not fetch pending approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId: string, approved: boolean) => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/approvals/${approvalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      if (res.ok) {
        const data = await res.json();
        if (approved && data.receipt) {
          setConfirmedReceipts((prev) => [data.receipt, ...prev]);
          setStatusMsg({
            type: "success",
            text: `Application submitted! Confirmation #${data.receipt.confirmation_number} securely recorded.`,
          });
        } else {
          setStatusMsg({
            type: "success",
            text: "Application submission cancelled by user.",
          });
        }
        fetchPendingApprovals();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.detail || "Action failed." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Connection error: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to trigger a sample prepare for live role if list is empty
  const handlePrepareDemoApplication = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      // Find a live job
      const jobsRes = await fetch(`${API_BASE}/api/v1/jobs/live?limit=1`);
      const jobsData = await jobsRes.json();
      const firstJob = jobsData.jobs?.[0];

      if (!firstJob) {
        setStatusMsg({ type: "error", text: "No live jobs found. Please discover jobs first." });
        return;
      }

      const prepRes = await fetch(`${API_BASE}/api/v1/applications/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: firstJob.id,
          destination_url: firstJob.canonical_url || "https://jobicy.com/apply",
        }),
      });

      if (prepRes.ok) {
        const packageData = await prepRes.json();
        setStatusMsg({
          type: "success",
          text: `Prepared application package for ${firstJob.title}! Hash: ${packageData.payload_hash.slice(0, 16)}...`,
        });
        fetchPendingApprovals();
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Preparation error: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-[#2D0E03]">
              Deterministic Agent & Exact-Action Approval Gate
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAD7A0] text-[#2D0E03]">
              30-Min TTL Lease
            </span>
          </div>
          <p className="text-xs text-[#2D0E03]/70 font-sans mt-1">
            Zero auto-submissions. Every external action requires human confirmation bound to a canonical SHA-256 payload hash.
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
            <span>Refresh</span>
          </Button>
          <Button
            onClick={handlePrepareDemoApplication}
            disabled={isProcessing}
            variant="primary"
            size="sm"
            className="text-xs bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            <span>Prepare Active Job Package</span>
          </Button>
        </div>
      </div>

      {/* 10-State Visual FSM Stepper */}
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
                  <span className="text-[9px] font-mono font-bold opacity-70">0{idx + 1}</span>
                  <span className="text-[11px] font-semibold tracking-tight">{st.label}</span>
                </div>
                {idx < FSM_STATES.length - 1 && (
                  <span className="text-[#6E250A]/30 text-xs font-mono">→</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Status Alerts */}
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

      {/* Pending Approvals List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#2D0E03] uppercase tracking-wider font-mono flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#B34A0E]" />
          <span>Pending Exact-Action Approval Leases ({pendingApprovals.length})</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#2D0E03]/60">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#B34A0E]" />
            <span>Checking approval queue...</span>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-[#6E250A]/15 rounded-xl">
            <ShieldCheck className="w-10 h-10 text-emerald-600/50 mx-auto mb-2" />
            <h4 className="font-display text-sm font-bold text-[#2D0E03] mb-1">
              Zero Unapproved Actions Pending
            </h4>
            <p className="text-xs text-[#2D0E03]/60 max-w-sm mx-auto mb-4">
              The AI agent is locked in waiting mode. Click "Prepare Active Job Package" or prepare an application from the Jobs page to generate a cryptographic approval package.
            </p>
          </Card>
        ) : (
          pendingApprovals.map((appr) => (
            <Card
              key={appr.approval_id}
              className="p-6 bg-white border-[0.8px] border-[#6E250A]/20 rounded-xl shadow-md space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-[#6E250A]/10">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B34A0E] text-white">
                    NEEDS_APPROVAL
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2D0E03]">
                    {appr.approval_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#2D0E03]/70 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#B34A0E]" />
                  <span>Expires: {new Date(appr.expires_at).toLocaleTimeString()} (30-min lease)</span>
                </div>
              </div>

              {/* Cryptographic SHA-256 Card */}
              <div className="p-3 bg-[#2D0E03] rounded-lg font-mono text-[11px] text-[#FEF5E7] space-y-1.5">
                <div className="flex items-center justify-between text-white/60 text-[10px]">
                  <span>CANONICAL PAYLOAD SHA-256 HASH</span>
                  <span>IMMUTABLE GATE LEASE</span>
                </div>
                <div className="text-amber-300 font-bold break-all">
                  {appr.payload_hash}
                </div>
                <div className="text-white/60 text-[10px] flex items-center justify-between pt-1 border-t border-white/10">
                  <span>Destination: {appr.destination_url}</span>
                  <span>Resume Hash: {appr.tailored_resume_hash ? appr.tailored_resume_hash.slice(0, 16) + "..." : "Attached"}</span>
                </div>
              </div>

              {/* Proposed Form Fields */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#2D0E03] uppercase tracking-wider font-mono">
                  Proposed Form Values & Truth Certifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {appr.field_mappings.map((fm, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[#FEF5E7]/40 border border-[#6E250A]/10 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#2D0E03]/60">
                        <span>{fm.field_label}</span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {fm.classification}
                        </span>
                      </div>
                      <div className="font-semibold text-[#2D0E03] truncate">
                        {String(fm.proposed_value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Actions */}
              <div className="pt-3 border-t border-[#6E250A]/10 flex items-center justify-end gap-3">
                <Button
                  onClick={() => handleDecision(appr.approval_id, false)}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                  className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Reject & Abort</span>
                </Button>
                <Button
                  onClick={() => handleDecision(appr.approval_id, true)}
                  disabled={isProcessing}
                  variant="primary"
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Sign & Execute Single-Use Lease</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Confirmed Receipts Archive */}
      {confirmedReceipts.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-[#2D0E03] uppercase tracking-wider font-mono flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographic Receipts ({confirmedReceipts.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {confirmedReceipts.map((rc) => (
              <Card key={rc.receipt_id} className="p-4 bg-white border border-emerald-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800">#{rc.confirmation_number}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                    {rc.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#2D0E03]/60 truncate">Target: {rc.final_destination_url}</p>
                <p className="text-[10px] font-mono text-[#2D0E03]/40">Storage: {rc.screenshot_storage_key}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
