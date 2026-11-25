"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmittedApplicationPreview, type SubmittedSnapshot } from "@/components/applications/SubmittedApplicationPreview";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface LiveJob {
  id: string;
  company_name: string;
  job_title?: string;
  title?: string;
  canonical_url: string;
  source_name?: string;
}

interface MappedField {
  field_key?: string;
  field_name?: string;
  question_label?: string;
  value?: string;
  proposed_value?: string;
  classification: string;
  evidence_id?: string;
}

interface ApprovalPackage {
  approval_id: string;
  application_id: string;
  destination_url: string;
  payload_hash: string;
  expires_at: string;
  field_mappings?: MappedField[];
}

export default function AutoApplyPage() {
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedATS, setSelectedATS] = useState("Greenhouse");
  const [isPreparing, setIsPreparing] = useState(false);
  const [approvalPkg, setApprovalPkg] = useState<ApprovalPackage | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [receipt, setReceipt] = useState<{ confirmation_number?: string; status?: string } | null>(null);
  const [submittedSnapshot, setSubmittedSnapshot] = useState<SubmittedSnapshot | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [confirmingPortal, setConfirmingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/live?limit=20`);
        if (res.ok) {
          const data = await res.json();
          const list: LiveJob[] = data.jobs || [];
          setJobs(list);
          if (list.length > 0) {
            setSelectedJobId(list[0].id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load live jobs");
      }
    };
    loadJobs();
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const handlePrepare = async () => {
    if (!selectedJob) return;
    setIsPreparing(true);
    setError(null);
    setReceipt(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/applications/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: selectedJob.id,
          destination_url: selectedJob.canonical_url || `https://boards.greenhouse.io/${selectedATS.toLowerCase()}`,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const pkg: ApprovalPackage = await res.json();
      setApprovalPkg(pkg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare approval package");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!approvalPkg) return;
    setIsApproving(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/approvals/${encodeURIComponent(approvalPkg.approval_id)}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReceipt(data.receipt || { status: data.status || "CONFIRMED", confirmation_number: data.confirmation_number });
      if (data.snapshot) {
        setSubmittedSnapshot(data.snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval decision failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenAndFillPortal = async () => {
    if (!selectedJob) return;
    setOpeningPortal(true);
    setError(null);
    const targetUrl = selectedJob.canonical_url || `https://boards.greenhouse.io/${selectedATS.toLowerCase()}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    try {
      const res = await fetch(`${API_BASE}/api/v1/applications/open-and-fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: selectedJob.id,
          destination_url: targetUrl,
          company_name: selectedJob.company_name,
          job_title: selectedJob.job_title || selectedJob.title,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.snapshot) {
        setSubmittedSnapshot(data.snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open & fill official portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleConfirmPortalSubmitted = async () => {
    if (!submittedSnapshot) return;
    setConfirmingPortal(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/applications/${encodeURIComponent(submittedSnapshot.application_id)}/confirm-submitted`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setSubmittedSnapshot(updated);
      }
    } finally {
      setConfirmingPortal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Auto-Apply Mission Control
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Human-in-the-Loop Application Assistant. Real form field mapping with canonical SHA-256 cryptographic approval gates.
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-xs">
          Approval Gate Active (30m TTL)
        </Badge>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-[10px] uppercase font-bold text-[#2D0E03]/50 block mb-1">
            Automation Runtime
          </span>
          <div className="font-display text-xl font-bold text-[#2D0E03] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Headed Playwright
          </div>
          <p className="text-[11px] text-[#2D0E03]/70 mt-1">
            Visible browser mode. CAPTCHA/MFA prompts handed directly to human user.
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] uppercase font-bold text-[#2D0E03]/50 block mb-1">
            Credential Vault
          </span>
          <div className="font-display text-xl font-bold text-[#2D0E03] flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            AES-256 Encrypted
          </div>
          <p className="text-[11px] text-[#2D0E03]/70 mt-1">
            Local keystore. Zero passwords exposed to LLM prompts or network logs.
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-[10px] uppercase font-bold text-[#2D0E03]/50 block mb-1">
            Target ATS & Posting
          </span>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setApprovalPkg(null);
              setReceipt(null);
            }}
            className="w-full mt-1 py-1.5 px-2.5 text-xs rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15 text-[#2D0E03]"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.company_name} — {j.job_title || j.title}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 mt-2">
            {["Greenhouse", "Workday", "Lever"].map((ats) => (
              <button
                key={ats}
                type="button"
                onClick={() => setSelectedATS(ats)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                  selectedATS === ats
                    ? "bg-[#B34A0E] text-white border-transparent"
                    : "bg-[#FEF5E7] text-[#2D0E03]/70 border-[#6E250A]/10"
                }`}
              >
                {ats}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <h3 className="font-display text-xl font-bold text-[#2D0E03]">
              Mapped Form Fields & Evidence Citations
            </h3>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedJob || isPreparing}
              onClick={handlePrepare}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPreparing ? "animate-spin" : ""}`} />
              {isPreparing ? "Preparing Package..." : "Prepare SHA-256 Package"}
            </Button>
          </div>

          {approvalPkg?.field_mappings && approvalPkg.field_mappings.length > 0 ? (
            <div className="space-y-2">
              {approvalPkg.field_mappings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/10 flex items-center justify-between text-xs gap-3"
                >
                  <div>
                    <div className="font-bold text-[#2D0E03]">
                      {f.question_label || f.field_name || f.field_key}
                    </div>
                    <div className="text-[#2D0E03]/80">
                      {f.proposed_value !== undefined ? f.proposed_value : f.value || "—"}
                    </div>
                  </div>
                  <Badge variant="peach" className="text-[10px]">
                    {f.classification === "VERIFIED_FACT" ? "Verified Profile" : f.classification === "EVIDENCE_BASED_PROSE" ? "Evidence Note" : "Ready"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[12px] bg-[#FEF5E7]/40 border border-dashed border-[#6E250A]/20 text-xs text-[#2D0E03]/70 text-center">
              Click <strong>Prepare SHA-256 Package</strong> to map verified profile fields for{" "}
              <strong>{selectedJob?.company_name || "the selected job"}</strong> and generate a canonical approval hash.
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-display text-xl font-bold text-[#2D0E03] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#B34A0E]" />
              Exact-Action Gate
            </h3>

            {approvalPkg ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15 font-mono text-[10px] break-all">
                  <div className="font-bold text-[#2D0E03] mb-1">Payload SHA-256:</div>
                  {approvalPkg.payload_hash}
                </div>
                <div className="text-[11px] text-[#2D0E03]/70">
                  Expires: {new Date(approvalPkg.expires_at).toLocaleTimeString()}
                </div>

                {!receipt ? (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isApproving}
                      onClick={() => handleApprove(true)}
                      className="flex-1 text-xs gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isApproving ? "Signing..." : "Approve & Dispatch"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isApproving}
                      onClick={() => handleApprove(false)}
                      className="text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {receipt.status || "CONFIRMED"}
                    </div>
                    {receipt.confirmation_number && (
                      <div className="font-mono text-[11px]">
                        Receipt: {receipt.confirmation_number}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
                No unconsumed approval package staged. Prepare a package on the left to inspect its SHA-256 hash before authorizing submission.
              </p>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-[#6E250A]/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!selectedJob || openingPortal}
              onClick={handleOpenAndFillPortal}
              className="w-full text-xs"
            >
              {openingPortal ? "Opening Official Portal..." : "Open Official Portal & Auto-Fill"}
            </Button>
            <Link href="/applications" className="block">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                View Application Tracker <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {submittedSnapshot && (
        <SubmittedApplicationPreview
          snapshot={submittedSnapshot}
          onConfirmSubmitted={handleConfirmPortalSubmitted}
          confirming={confirmingPortal}
        />
      )}
    </div>
  );
}
