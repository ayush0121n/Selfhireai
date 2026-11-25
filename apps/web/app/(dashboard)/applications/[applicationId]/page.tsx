"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Save,
  Copy,
  Send,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmittedApplicationPreview, type SubmittedSnapshot } from "@/components/applications/SubmittedApplicationPreview";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STAGES = ["PREPARED", "NEEDS_APPROVAL", "CONFIRMED", "INTERVIEW", "OFFER", "ARCHIVED"] as const;

interface ApplicationDetail {
  id: string;
  application_id?: string;
  stage: string;
  company_name?: string;
  job_title?: string;
  destination_url?: string;
  confirmation_number?: string;
  payload_hash?: string;
  submitted_at?: string;
}

interface WorkspaceState {
  notes: string;
  cover_letter: string;
  refinement_history: { timestamp: string; instruction: string }[];
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = decodeURIComponent((params?.applicationId as string) || "");

  const [appData, setAppData] = useState<ApplicationDetail | null>(null);
  const [snapshot, setSnapshot] = useState<SubmittedSnapshot | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    notes: "",
    cover_letter: "",
    refinement_history: [],
  });
  const [tone, setTone] = useState("Direct");
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/applications/${encodeURIComponent(applicationId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAppData(data.application);
      setWorkspace(data.workspace);
      if (data.snapshot) {
        setSnapshot(data.snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleStageChange = async (newStage: string) => {
    setBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/applications/${encodeURIComponent(applicationId)}/stage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage }),
        }
      );
      if (res.ok) {
        setAppData((prev) => (prev ? { ...prev, stage: newStage } : prev));
        setStatusMsg(`Stage updated to ${newStage}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/applications/${encodeURIComponent(applicationId)}/cover-letter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone,
            company_name: appData?.company_name,
            job_title: appData?.job_title,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWorkspace(data.workspace);
      setStatusMsg(`Cover letter generated (${tone} tone) using verified Evidence Vault.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate cover letter");
    } finally {
      setBusy(false);
    }
  };

  const handleRefine = async (undo = false) => {
    if (!undo && !instruction.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/applications/${encodeURIComponent(applicationId)}/refine`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction: instruction.trim() || "undo", undo }),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setWorkspace(data.workspace);
      if (!undo) setInstruction("");
      setStatusMsg(undo ? "Reverted to previous version." : "Refinement applied.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNotes = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/applications/${encodeURIComponent(applicationId)}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: workspace.notes }),
        }
      );
      if (res.ok) {
        setStatusMsg("Private notes saved.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Card className="p-8 h-64 animate-pulse bg-white/70" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/applications" className="text-xs text-[#2D0E03]/60 hover:text-[#B34A0E] flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications Tracker
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#2D0E03]">
              {appData?.job_title || "Application"} @ {appData?.company_name || applicationId}
            </h1>
            <p className="text-xs text-[#2D0E03]/70 font-mono mt-1">
              ID: {applicationId} {appData?.confirmation_number ? `• Receipt: ${appData.confirmation_number}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={appData?.stage || "CONFIRMED"}
              disabled={busy}
              onChange={(e) => handleStageChange(e.target.value)}
              className="py-1.5 px-3 text-xs font-semibold rounded-[10px] bg-white border border-[#6E250A]/20 text-[#2D0E03]"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Badge variant="success" className="px-3 py-1 text-xs">
              {appData?.stage || "CONFIRMED"}
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-3 bg-red-50 border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </Card>
      )}
      {statusMsg && (
        <Card className="p-3 bg-emerald-50 border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </Card>
      )}

      {snapshot && (
        <SubmittedApplicationPreview
          snapshot={snapshot}
          confirming={busy}
          onConfirmSubmitted={async () => {
            setBusy(true);
            try {
              const res = await fetch(
                `${API_BASE}/api/v1/applications/${encodeURIComponent(applicationId)}/confirm-submitted`,
                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
              );
              if (res.ok) {
                const updated = await res.json();
                setSnapshot(updated);
                setAppData((prev) => (prev ? { ...prev, stage: "CONFIRMED" } : prev));
                setStatusMsg("Application confirmed and receipt recorded.");
              }
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dossier Cover Letter + Chat Refinement */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6E250A]/10 pb-3">
            <h3 className="font-display text-xl font-bold text-[#2D0E03] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B34A0E]" />
              Grounded Cover Letter & Refinement
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="py-1 px-2.5 text-xs rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15"
              >
                <option value="Direct">Direct</option>
                <option value="Professional">Professional</option>
                <option value="Startup">Startup</option>
              </select>
              <Button variant="primary" size="sm" disabled={busy} onClick={handleGenerateCoverLetter} className="text-xs">
                Generate Draft
              </Button>
              {workspace.refinement_history.length > 0 && (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => handleRefine(true)} className="text-xs gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Undo
                </Button>
              )}
            </div>
          </div>

          <textarea
            rows={10}
            value={workspace.cover_letter}
            onChange={(e) => setWorkspace((prev) => ({ ...prev, cover_letter: e.target.value }))}
            placeholder="Click 'Generate Draft' to compose a grounded cover letter from your verified Evidence Vault..."
            className="w-full p-4 text-xs rounded-[12px] bg-[#FEF5E7]/40 border border-[#6E250A]/15 text-[#2D0E03] font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Refine in chat (e.g., 'Make it shorter and more concise' or 'Emphasize impact metrics')..."
              className="flex-1 px-3 py-2 text-xs rounded-[10px] bg-white border border-[#6E250A]/15 text-[#2D0E03]"
            />
            <Button variant="secondary" size="sm" disabled={busy || !workspace.cover_letter} onClick={() => handleRefine(false)} className="text-xs gap-1">
              <Send className="w-3.5 h-3.5" /> Refine
            </Button>
            {workspace.cover_letter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(workspace.cover_letter);
                  setStatusMsg("Cover letter copied to clipboard.");
                }}
                className="text-xs gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
            )}
          </div>
        </Card>

        {/* Private Notes & Cryptographic Receipt */}
        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-[#2D0E03]">
              Private Application Notes
            </h3>
            <textarea
              rows={5}
              value={workspace.notes}
              onChange={(e) => setWorkspace((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Recruiter name, interview dates, salary notes..."
              className="w-full p-3 text-xs rounded-[10px] bg-[#FEF5E7]/40 border border-[#6E250A]/15 text-[#2D0E03]"
            />
            <Button variant="outline" size="sm" disabled={busy} onClick={handleSaveNotes} className="w-full text-xs gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Notes
            </Button>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-display text-lg font-bold text-[#2D0E03]">
              Cryptographic Receipt
            </h3>
            <div className="p-3 rounded-[8px] bg-[#FEF5E7] font-mono text-[10px] text-[#2D0E03]/80 break-all border border-[#6E250A]/10">
              SHA-256: {appData?.payload_hash || "pending"}
            </div>
            {appData?.destination_url && (
              <a
                href={appData.destination_url}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-[#B34A0E] hover:underline truncate"
              >
                {appData.destination_url}
              </a>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
