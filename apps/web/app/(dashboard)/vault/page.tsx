"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Award,
  Hash,
  ExternalLink,
  RefreshCw,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface EvidenceItem {
  id: string;
  evidence_id: string;
  user_id: string;
  document_id: string;
  claim_type: "EXPERIENCE" | "SKILL" | "EDUCATION" | "PROJECT" | "METRIC";
  title: string;
  field_path: string;
  raw_source_text: string;
  is_verified: number;
  verified_at?: string;
  created_at: string;
}

export default function EvidenceVaultPage() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/evidence`);
      if (res.ok) {
        const data = await res.json();
        setEvidenceList(data.evidence || []);
      }
    } catch (err: any) {
      console.error("Could not fetch evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !uploadText.trim()) return;

    setIsUploading(true);
    setStatusMsg(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("raw_text", uploadText.trim());
        formData.append("filename", "master_resume.txt");
      }

      const res = await fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg({
          type: "success",
          text: `Extracted ${data.claims_extracted} atomic verified claims! SHA-256: ${data.sha256_hash.slice(0, 16)}...`,
        });
        setSelectedFile(null);
        setUploadText("");
        fetchEvidence();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.detail || "Failed to parse document" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Connection error: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleVerify = async (claimId: string, currentStatus: number) => {
    try {
      const nextStatus = currentStatus === 1 ? false : true;
      const res = await fetch(`${API_BASE}/api/v1/evidence/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence_id: claimId,
          is_verified: nextStatus,
        }),
      });

      if (res.ok) {
        setEvidenceList((prev) =>
          prev.map((item) =>
            item.evidence_id === claimId || item.id === claimId
              ? { ...item, is_verified: nextStatus ? 1 : 0 }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error updating claim verification:", err);
    }
  };

  const categories = [
    { id: "ALL", label: "All Claims", count: evidenceList.length },
    { id: "SKILL", label: "Skills", count: evidenceList.filter((e) => e.claim_type === "SKILL").length },
    { id: "METRIC", label: "Google XYZ Metrics", count: evidenceList.filter((e) => e.claim_type === "METRIC").length },
    { id: "EXPERIENCE", label: "Experience", count: evidenceList.filter((e) => e.claim_type === "EXPERIENCE").length },
    { id: "EDUCATION", label: "Education", count: evidenceList.filter((e) => e.claim_type === "EDUCATION").length },
    { id: "PROJECT", label: "Projects", count: evidenceList.filter((e) => e.claim_type === "PROJECT").length },
  ];

  const filteredEvidence =
    activeCategory === "ALL"
      ? evidenceList
      : evidenceList.filter((item) => item.claim_type === activeCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-[#2D0E03]">
              Profile & Evidence Vault
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAD7A0] text-[#2D0E03]">
              Zero-Hallucination
            </span>
          </div>
          <p className="text-xs text-[#2D0E03]/70 font-sans mt-1">
            Every bullet point, achievement, and technical skill is linked to an immutable cryptographic Evidence ID.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvidence}
            className="text-xs border-[#6E250A]/20 text-[#2D0E03] bg-white hover:bg-[#FEF5E7]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Vault</span>
          </Button>
          <Link href="/resumes">
            <Button variant="primary" size="sm" className="text-xs bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90">
              <span>Open Resume Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Upload Master Resume Card */}
      <Card className="p-6 bg-white border-[0.8px] border-[#6E250A]/20 shadow-sm rounded-xl">
        <h2 className="text-sm font-bold text-[#2D0E03] mb-2 flex items-center gap-2 font-display">
          <Upload className="w-4 h-4 text-[#B34A0E]" />
          <span>Upload Master Resume (PDF, DOCX, or Plain Text)</span>
        </h2>
        <p className="text-xs text-[#2D0E03]/60 mb-4">
          Upload your authentic master resume. The parser will decompose achievements into atomic claims and verify metrics.
        </p>

        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
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

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Dropzone */}
            <div className="border-2 border-dashed border-[#6E250A]/20 rounded-xl p-6 text-center hover:border-[#B34A0E] transition bg-[#FEF5E7]/30 flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 text-[#B34A0E]/70 mb-2" />
              <input
                type="file"
                id="resume-file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="resume-file"
                className="cursor-pointer text-xs font-semibold text-[#B34A0E] hover:underline"
              >
                {selectedFile ? selectedFile.name : "Choose PDF or DOCX file"}
              </label>
              <span className="text-[10px] text-[#2D0E03]/40 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                  : "Drag & drop or browse from local storage"}
              </span>
            </div>

            {/* Paste Plain Text Area */}
            <div>
              <textarea
                placeholder="Or paste resume plain text here..."
                rows={4}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#6E250A]/20 bg-[#FEF5E7]/20 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isUploading || (!selectedFile && !uploadText.trim())}
              className="text-xs py-2 px-5 bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Extracting Atomic Claims...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  <span>Parse & Ingest into Vault</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#6E250A]/10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? "bg-[#2D0E03] text-[#FEF5E7]"
                : "bg-white text-[#2D0E03]/70 hover:bg-[#FEF5E7] border border-[#6E250A]/10"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === cat.id ? "bg-[#B34A0E] text-white" : "bg-[#FEF5E7] text-[#2D0E03]"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Claims Grid / Zero Mock Empty State */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#2D0E03]/60">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B34A0E]" />
          <span>Querying verified evidence records...</span>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-[#6E250A]/15 rounded-xl">
          <ShieldCheck className="w-12 h-12 text-[#B34A0E]/40 mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-[#2D0E03] mb-1">
            Evidence Vault Ready (0 Fake Records)
          </h3>
          <p className="text-xs text-[#2D0E03]/60 max-w-md mx-auto mb-4">
            No claims exist yet. Upload your master resume above to extract atomic claims and Google XYZ metrics with immutable evidence IDs.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvidence.map((item) => (
            <Card
              key={item.id}
              className="p-4 bg-white border-[0.8px] border-[#6E250A]/15 rounded-xl hover:shadow-sm transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.claim_type === "METRIC"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : item.claim_type === "SKILL"
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : item.claim_type === "EXPERIENCE"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-purple-100 text-purple-900 border border-purple-300"
                    }`}
                  >
                    {item.claim_type}
                  </span>
                  <span className="text-[11px] font-mono text-[#2D0E03]/50 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {item.evidence_id || item.id}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleVerify(item.evidence_id || item.id, item.is_verified)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    item.is_verified === 1
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "bg-gray-100 text-gray-600 hover:bg-emerald-50"
                  }`}
                  title="Click to toggle human verification"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item.is_verified === 1 ? "Verified" : "Unverified"}</span>
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#2D0E03]">{item.title}</h4>
                <p className="text-[11px] text-[#2D0E03]/70 font-sans mt-1 leading-relaxed">
                  {item.raw_source_text}
                </p>
              </div>

              <div className="pt-2 border-t border-[#6E250A]/10 flex items-center justify-between text-[10px] text-[#2D0E03]/50 font-mono">
                <span>Path: {item.field_path}</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "Live"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
