"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  ShieldCheck,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Lock,
  Layers,
  Award,
  Briefcase,
  UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AccountExportPage() {
  const [exportData, setExportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [statusType, setStatusType] = useState<"success" | "error">("error");

  useEffect(() => {
    fetchExportData();
  }, []);

  const fetchExportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/account/export`);
      if (res.ok) {
        const data = await res.json();
        setExportData(data);
      }
    } catch (err: any) {
      console.error("Failed to load export data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!exportData) return;
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selfhire_personal_data_archive_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!exportData) return;
    const evidence = exportData.evidence_vault || [];
    const headers = ["Claim ID", "Type", "Title", "Field Path", "Verified", "Created At"];
    const rows = evidence.map((e: any) => [
      e.evidence_id || e.id,
      e.claim_type,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${e.field_path || ""}"`,
      e.is_verified ? "YES" : "NO",
      e.created_at || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `selfhire_evidence_claims_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHardDelete = async () => {
    const confirmation = prompt(
      "CAUTION: This will permanently delete all your candidate evidence, tailored resumes, and local application session memory.\n\nType 'PURGE' to confirm:"
    );
    if (confirmation !== "PURGE") return;

    setIsPurging(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/account`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusType("success");
        setPurgeStatus("All account data and session memory purged successfully.");
        setExportData(null);
        fetchExportData();
      } else {
        setStatusType("error");
        setPurgeStatus("Failed to execute account erasure.");
      }
    } catch (err: any) {
      setStatusType("error");
      setPurgeStatus("Network error during erasure request.");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D0E03]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B34A0E] mb-1">
            <ShieldCheck className="h-4 w-4" />
            Digital Sovereignty & Privacy
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2D0E03]">
            DPDP & GDPR Personal Data Export
          </h1>
          <p className="text-sm text-[#6E5D53] mt-1 max-w-2xl">
            Under India&apos;s <strong>DPDP Act 2023</strong> and the <strong>EU GDPR (Article 20)</strong>, you have an
            absolute right to complete portability and immediate permanent erasure of all your career data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadJSON}
            disabled={!exportData}
            className="bg-[#B34A0E] hover:bg-[#8F3B0B] text-white gap-2"
          >
            <Download className="h-4 w-4" />
            Export Archive (JSON)
          </Button>
          <Button
            onClick={fetchExportData}
            variant="outline"
            className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {purgeStatus && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            statusType === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-500/10 border-red-500/30 text-red-700"
          }`}
        >
          {statusType === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {purgeStatus}
        </div>
      )}

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2D0E03]">
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
            DPDP Act 2023 (Digital Personal Data Protection Act)
          </div>
          <p className="text-xs text-[#6E5D53] leading-relaxed">
            Data Principal rights fully respected. No personal data or credentials are transferred or sold to third-party data brokers.
            All processing is local, deterministic, and under human exact-action approval.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2D0E03]">
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
            GDPR Article 20 (Right to Data Portability)
          </div>
          <p className="text-xs text-[#6E5D53] leading-relaxed">
            Structured, commonly used, and machine-readable data format. You can export your atomic evidence tree,
            tailored resume variants, and job application receipts in raw JSON and CSV anytime.
          </p>
        </Card>
      </div>

      {/* Live Data Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
            Candidate Identity
          </div>
          <div className="text-xl font-bold font-serif text-[#2D0E03] truncate">
            {exportData?.profile?.full_name || "No Active Profile"}
          </div>
          <div className="text-xs text-[#6E5D53] mt-1 truncate">
            {exportData?.profile?.email || "Purged / Uninitialized"}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
            Atomic Evidence Claims
          </div>
          <div className="text-3xl font-bold font-serif text-[#2D0E03]">
            {exportData?.evidence_vault?.length || 0}
          </div>
          <div className="text-xs text-[#10B981] mt-1 flex items-center gap-1">
            <Award className="h-3.5 w-3.5" /> Immutable Verification
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
            Logged Applications
          </div>
          <div className="text-3xl font-bold font-serif text-[#2D0E03]">
            {exportData?.applications?.length || 0}
          </div>
          <div className="text-xs text-[#6E5D53] mt-1">Confirmed with receipt hash</div>
        </Card>

        <Card className="p-5 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6E5D53] mb-1">
            AES Vault Credentials
          </div>
          <div className="text-3xl font-bold font-serif text-[#2D0E03]">
            {exportData?.credentials_portals_count ?? 0}
          </div>
          <div className="text-xs text-[#6E5D53] mt-1">Zero-leak keystore</div>
        </Card>
      </div>

      {/* Export Actions Box */}
      <Card className="p-6 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#2D0E03] flex items-center gap-2">
            <Download className="h-5 w-5 text-[#B34A0E]" />
            Download Personal Data Archives
          </h2>
          <p className="text-xs text-[#6E5D53] mt-1">
            Generate and save machine-readable archives of your complete SelfHire.ai profile.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleDownloadJSON}
            disabled={!exportData}
            className="bg-[#2D0E03] hover:bg-[#1A0802] text-white gap-2"
          >
            <Download className="h-4 w-4" />
            Download Complete Archive (.JSON)
          </Button>

          <Button
            onClick={handleDownloadCSV}
            disabled={!exportData}
            variant="outline"
            className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5 gap-2"
          >
            <FileText className="h-4 w-4 text-[#B34A0E]" />
            Download Evidence Claims (.CSV)
          </Button>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#6E250A]/25 bg-[#FEF5E7] text-xs font-semibold text-[#2D0E03] cursor-pointer hover:bg-[#FAD7A0]/40 transition-colors">
            <Database className="h-4 w-4 text-[#B34A0E]" />
            Import / Restore Bundle (.JSON)
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const raw = JSON.parse(await file.text());
                  const res = await fetch(`${API_BASE}/api/v1/account/import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      profile: raw.profile,
                      saved_jobs: raw.saved_jobs,
                      follow_ups: raw.follow_ups,
                      preferences: raw.preferences,
                      custom_themes: raw.custom_themes,
                    }),
                  });
                  if (res.ok) {
                    const out = await res.json();
                    setStatusType("success");
                    setPurgeStatus(
                      `Restored bundle: profile=${out.restored.profile}, saved_jobs=${out.restored.saved_jobs}, follow_ups=${out.restored.follow_ups}`
                    );
                    fetchExportData();
                  } else {
                    setStatusType("error");
                    setPurgeStatus("Failed to import JSON bundle.");
                  }
                } catch {
                  setStatusType("error");
                  setPurgeStatus("Invalid JSON archive file.");
                }
              }}
            />
          </label>
        </div>
      </Card>

      {/* Right to Erasure / Danger Zone */}
      <Card className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            GDPR & DPDP Right to Erasure (Data Purge)
          </h2>
          <p className="text-xs text-red-700/80 mt-1">
            Permanently purges your candidate profile, atomic evidence records, tailored resume drafts, and application receipts.
            This action is irreversible and immediate.
          </p>
        </div>

        <Button
          onClick={handleHardDelete}
          disabled={isPurging}
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isPurging ? "Purging Records..." : "Permanently Purge My Account Data"}
        </Button>
      </Card>
    </div>
  );
}
