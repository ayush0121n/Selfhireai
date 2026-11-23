"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Layers,
  ArrowRight,
  Eye,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AutoApplyPage() {
  const [selectedATS, setSelectedATS] = useState("Greenhouse");
  const [isSimulating, setIsSimulating] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [receiptHash, setReceiptHash] = useState("");

  const sampleFields = [
    { field: "Full Name", value: "Ayush Sharma", classification: "VERIFIED_FACT", evidence: "ev_id_01" },
    { field: "Email Address", value: "ayush@example.com", classification: "VERIFIED_FACT", evidence: "ev_id_02" },
    { field: "Phone Number", value: "+91 98765 43210", classification: "VERIFIED_FACT", evidence: "ev_id_03" },
    { field: "Target Role", value: "Junior Full Stack Developer", classification: "APPROVED_PREFERENCE", evidence: "pref_role" },
    { field: "Work Authorization", value: "Citizen (No Sponsorship Required)", classification: "LEGAL_ATTESTATION", evidence: "ev_legal" },
    { field: "Years of Python Experience", value: "3 Years", classification: "VERIFIED_FACT", evidence: "ev_exp_01" },
  ];

  const handlePrepare = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setApprovalRequested(true);
    }, 700);
  };

  const handleApprove = () => {
    setIsApproved(true);
    setReceiptHash("sha256:d8c91a4f02e6b7c5a8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Auto-Apply Mission Control
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Human-in-the-Loop Application Assistant. Form field mapping with canonical SHA-256 cryptographic approval gates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 text-xs">
            Approval Gate Active (30m TTL)
          </Badge>
        </div>
      </div>

      {/* Supported Platforms & Session Status */}
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
            Supported ATS Platforms
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            {["Greenhouse", "Workday", "Lever"].map((ats) => (
              <button
                key={ats}
                onClick={() => setSelectedATS(ats)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  selectedATS === ats
                    ? "bg-[#B34A0E] text-white border-transparent"
                    : "bg-[#FEF5E7] text-[#2D0E03]/70 border-[#6E250A]/10 hover:bg-[#FEF5E7]/80"
                }`}
              >
                {ats}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Flow: Form Field Mapper & Approval Gate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Field Mapping */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <div>
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                Form Field Mapping Contract ({selectedATS})
              </h3>
              <p className="text-xs text-[#2D0E03]/60">
                Each field links to an immutable Evidence ID. Unknown answers require your explicit prompt.
              </p>
            </div>
            <Badge variant="peach">{sampleFields.length} Mapped Fields</Badge>
          </div>

          <div className="space-y-2.5">
            {sampleFields.map((field, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-semibold text-[#2D0E03]">{field.field}</div>
                  <div className="text-[11px] font-mono text-[#2D0E03]/80 mt-0.5">
                    {field.value}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#6E250A]/10 text-[#2D0E03]/70">
                    {field.evidence}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {field.classification}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
            <span className="text-xs text-[#2D0E03]/70 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Zero Hallucination: 100% verified against Evidence Vault
            </span>

            <Button
              variant="primary"
              size="sm"
              disabled={isSimulating || approvalRequested}
              onClick={handlePrepare}
              className="text-xs gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSimulating ? "Validating Fields..." : "Prepare Submission Package"}
            </Button>
          </div>
        </Card>

        {/* Right Col: Exact Action Approval Gate */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#B34A0E] mb-2 font-display text-xl font-bold">
              <Lock className="w-5 h-5" />
              Approval Gate
            </div>
            <p className="text-xs text-[#2D0E03]/70 mb-4 leading-relaxed">
              The agent is cryptographically restricted from submitting applications without your final one-time approval.
            </p>

            {approvalRequested ? (
              <div className="space-y-3 p-4 rounded-[12px] bg-[#FEF5E7] border border-[#B34A0E]/30">
                <div className="flex items-center justify-between text-xs font-bold text-[#2D0E03]">
                  <span>Package Status</span>
                  <span className="text-amber-700">Awaiting Approval (29m TTL)</span>
                </div>

                <div className="text-[10px] font-mono bg-white p-2 rounded border border-[#6E250A]/15 break-all text-[#2D0E03]/70">
                  SHA-256: 4f8a92b0c1e3d5a7f6e8b9a0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0
                </div>

                {isApproved ? (
                  <div className="p-3 rounded-[8px] bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Application Submitted & Confirmed
                    </div>
                    <div className="text-[10px] font-mono break-all">{receiptHash}</div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs py-3 gap-1.5 mt-2"
                    onClick={handleApprove}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Authorize Submit
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-[#FEF5E7]/50 rounded-[10px] border border-dashed border-[#6E250A]/20">
                <Clock className="w-6 h-6 text-[#B34A0E] mx-auto mb-2 opacity-50" />
                <div className="text-xs font-semibold text-[#2D0E03]">
                  No Active Review Package
                </div>
                <div className="text-[11px] text-[#2D0E03]/60 mt-1">
                  Click "Prepare Submission Package" to freeze payload and generate SHA-256 hash.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#6E250A]/10 text-[11px] text-[#2D0E03]/60">
            Receipts are committed to the tamper-proof ledger with cryptographic nonces.
          </div>
        </Card>
      </div>
    </div>
  );
}
