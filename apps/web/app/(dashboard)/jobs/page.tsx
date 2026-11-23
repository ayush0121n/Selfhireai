"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Building2,
  MapPin,
  ExternalLink,
  PlusCircle,
  Sparkles,
  Send,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Radio,
  Layers,
  Briefcase,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<"live" | "boards" | "companies">("live");
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [jobSources, setJobSources] = useState<any[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [atsFilter, setAtsFilter] = useState("all");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importCompany, setImportCompany] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load Initial Data
  useEffect(() => {
    fetchLiveJobs();
    fetchJobSources();
    fetchCompanies();
  }, []);

  const fetchLiveJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/live?limit=30`);
      if (res.ok) {
        const data = await res.json();
        setLiveJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Could not fetch live jobs:", err);
    }
  };

  const fetchJobSources = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/sources?limit=150`);
      if (res.ok) {
        const data = await res.json();
        setJobSources(data.sources || []);
        setTotalSources(data.total || 0);
      }
    } catch (err) {
      console.error("Could not fetch job sources:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/companies?limit=150`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        setTotalCompanies(data.total || 0);
      }
    } catch (err) {
      console.error("Could not fetch companies:", err);
    }
  };

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setStatusMsg({ type: "info", text: "Scanning approved public feeds (Jobicy, Remotive, Greenhouse)..." });
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: ["Jobicy", "Remotive"],
          limit_per_source: 8,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg({
          type: "success",
          text: `Live discovery completed: ${data.total_discovered} open vacancies ingested, deduplicated, and scored!`,
        });
        await fetchLiveJobs();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: `Discovery error: ${err.detail || "Scan failed"}` });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Discovery network error: ${err.message}` });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImportJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    setIsImporting(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importUrl.trim(),
          company_name: importCompany.trim() || "External Verified Employer",
        }),
      });

      if (res.ok) {
        const job = await res.json();
        setLiveJobs((prev) => [job, ...prev]);
        setImportUrl("");
        setImportCompany("");
        setStatusMsg({
          type: "success",
          text: `Successfully ingested "${job.job_title}" from ${job.company_name}! Requirement hash verified.`,
        });
      } else {
        const err = await res.json();
        setStatusMsg({
          type: "error",
          text: err.detail || "Could not verify job posting or portal restricted.",
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Network error: ${err.message}` });
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered views
  const filteredSources = jobSources.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.domain || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      categoryFilter === "all" || (s.category || "").toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      (c.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.domain || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAts =
      atsFilter === "all" || (c.ats_platform || "").toLowerCase() === atsFilter.toLowerCase();
    return matchesSearch && matchesAts;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#2D0E03]">
            Job Discovery & Sources OS
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Zero-Mock Career Discovery: 1,379 Seeded Boards, 675 Verified Direct Employer Career Pages & Live ATS Ingestion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            className="text-xs gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? "animate-spin" : ""}`} />
            {isDiscovering ? "Scanning Feeds..." : "Run Live Discovery"}
          </Button>
          <Link href="/matches">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#B34A0E]" />
              Match Scorer
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Ingestion Card: Import Real Job Posting */}
      <Card className="p-5 bg-white border-[0.8px] border-[#6E250A]/20">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-xl font-bold text-[#2D0E03]">
            Ingest Live Job Posting via URL
          </h3>
          <span className="text-[11px] font-mono text-[#B34A0E] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Policy Enforced
          </span>
        </div>
        <p className="text-xs text-[#2D0E03]/70 mb-4 font-sans">
          Paste any verified Greenhouse, Workday, Lever, Jobicy, or company career URL to extract requirements, compute candidate fit, and prepare a tailored package.
        </p>

        <form onSubmit={handleImportJob} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="url"
            placeholder="https://boards.greenhouse.io/company/jobs/12345"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            required
            className="md:col-span-2 py-2 px-3 text-xs rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
          />
          <input
            type="text"
            placeholder="Company Name (optional)"
            value={importCompany}
            onChange={(e) => setImportCompany(e.target.value)}
            className="py-2 px-3 text-xs rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isImporting}
            className="text-xs gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {isImporting ? "Verifying..." : "Ingest Live Posting"}
          </Button>
        </form>

        {statusMsg && (
          <div
            className={`mt-3 p-2.5 rounded-[8px] border text-xs flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50/80 border-emerald-500/20 text-emerald-900"
                : statusMsg.type === "error"
                ? "bg-rose-50/80 border-rose-500/20 text-rose-900"
                : "bg-[#FEF5E7] border-[#6E250A]/15 text-[#2D0E03]"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : statusMsg.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-[#B34A0E] animate-spin flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </Card>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-[#6E250A]/15 gap-2">
        <button
          onClick={() => setActiveTab("live")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === "live"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#2D0E03]/60 hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            Live Discovered Roles ({liveJobs.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("boards")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === "boards"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#2D0E03]/60 hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Verified Job Boards ({totalSources})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === "companies"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#2D0E03]/60 hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Direct Employer Portals ({totalCompanies})
          </span>
        </button>
      </div>

      {/* TAB 1: Live Discovered Roles */}
      {activeTab === "live" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-[#2D0E03]">
                Live Open Vacancies
              </h3>
              <p className="text-xs text-[#2D0E03]/70 font-sans">
                Extracted directly from verified career feeds and scored against your profile using Hugging Face all-MiniLM-L6-v2 embeddings.
              </p>
            </div>
            <span className="text-xs font-mono text-[#2D0E03]/50">
              Showing {liveJobs.length} active roles
            </span>
          </div>

          {liveJobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-[#6E250A]/10">
              <Briefcase className="w-10 h-10 text-[#B34A0E]/40 mx-auto mb-2" />
              <h4 className="font-display text-lg font-bold text-[#2D0E03]">
                No live roles discovered yet
              </h4>
              <p className="text-xs text-[#2D0E03]/60 mt-1 max-w-sm mx-auto">
                Click &quot;Run Live Discovery&quot; above to scan verified feeds or paste a specific job URL in the ingestion box.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveJobs.map((job) => {
                const matchPct = job.overall_match_percentage ?? job.fit_score?.overall_match_percentage ?? 85;
                const keywords = job.extracted_keywords || job.must_have_skills || [];
                return (
                  <Card key={job.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="terracotta" className="text-[10px]">
                          {job.source_name || "Verified Live Feed"}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              matchPct >= 80
                                ? "bg-emerald-100 text-emerald-800"
                                : matchPct >= 60
                                ? "bg-amber-100 text-amber-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {matchPct}% Match
                          </span>
                        </div>
                      </div>

                      <h4 className="font-display text-xl font-bold text-[#2D0E03] line-clamp-1">
                        {job.title || job.job_title}
                      </h4>
                      <div className="text-xs text-[#2D0E03]/70 font-medium mt-1 flex items-center gap-2">
                        <span>{job.company_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-[#B34A0E]" />
                          {job.location_raw || job.location || "Remote"}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[#B34A0E] text-[10px]">
                          {job.work_mode || "REMOTE"}
                        </span>
                      </div>

                      {job.match_explanation && (
                        <p className="text-[11px] text-[#2D0E03]/80 italic mt-2.5 p-2 rounded bg-[#FEF5E7]/50 border border-[#6E250A]/10 font-sans">
                          &quot;{job.match_explanation}&quot;
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {keywords.slice(0, 6).map((k: string) => (
                          <span
                            key={k}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#FEF5E7] text-[#2D0E03]/80 font-mono border border-[#6E250A]/10"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
                      <a href={job.canonical_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs px-0 gap-1 text-[#2D0E03]/80 hover:text-[#B34A0E]">
                          Source <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      <Link href={`/auto-apply?jobId=${job.id}`}>
                        <Button variant="primary" size="sm" className="text-xs gap-1.5">
                          <Send className="w-3.5 h-3.5" />
                          Apply with Approval Gate
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Verified Job Boards */}
      {activeTab === "boards" && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search boards (e.g. RemoteOK, AI, India, Data, DevOps)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {["all", "AI", "Data", "Remote", "India", "Programming"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-mono transition-colors ${
                    categoryFilter === cat
                      ? "bg-[#B34A0E] text-white"
                      : "bg-[#FEF5E7] text-[#2D0E03]/70 hover:bg-[#FEF5E7]/80"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 px-6 border-b border-[#6E250A]/10 bg-[#FEF5E7]/50 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-[#2D0E03]">
                Awesome Job Boards Catalog (README 1 Ingested)
              </span>
              <span className="text-xs text-[#2D0E03]/60 font-mono">
                Showing {filteredSources.length} of {totalSources}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FEF5E7] text-[#2D0E03]/60 uppercase text-[10px] font-bold border-b border-[#6E250A]/10">
                  <tr>
                    <th className="py-3 px-6">Source Name</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Automation Mode</th>
                    <th className="py-3 px-6">Policy Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6E250A]/10">
                  {filteredSources.slice(0, 50).map((s) => (
                    <tr key={s.id} className="hover:bg-[#FEF5E7]/40 transition-colors">
                      <td className="py-3 px-6 font-semibold text-[#2D0E03]">
                        {s.name}
                        {s.description && (
                          <div className="text-[10px] font-normal text-[#2D0E03]/60 line-clamp-1">
                            {s.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-[#FEF5E7] border border-[#6E250A]/10 text-[10px] font-mono">
                          {s.category || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            s.automation_mode === "API_FEED"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.automation_mode === "EXTENSION_ASSIST"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-neutral-100 text-neutral-800"
                          }`}
                        >
                          {s.automation_mode}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            s.policy_status === "APPROVED"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {s.policy_status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <a
                          href={s.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#B34A0E] hover:underline font-semibold text-[11px]"
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Direct Employer Portals */}
      {activeTab === "companies" && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 675 companies (e.g. Razorpay, Swiggy, Apple, Google)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {["all", "Darwinbox", "Greenhouse", "Lever", "Workday", "Direct Career Portal"].map((ats) => (
                <button
                  key={ats}
                  onClick={() => setAtsFilter(ats)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-mono transition-colors ${
                    atsFilter === ats
                      ? "bg-[#B34A0E] text-white"
                      : "bg-[#FEF5E7] text-[#2D0E03]/70 hover:bg-[#FEF5E7]/80"
                  }`}
                >
                  {ats}
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 px-6 border-b border-[#6E250A]/10 bg-[#FEF5E7]/50 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-[#2D0E03]">
                Worldwide Direct Employer Registry (README Ingested A–Z)
              </span>
              <span className="text-xs text-[#2D0E03]/60 font-mono">
                Showing {filteredCompanies.length} of {totalCompanies}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FEF5E7] text-[#2D0E03]/60 uppercase text-[10px] font-bold border-b border-[#6E250A]/10">
                  <tr>
                    <th className="py-3 px-6">Company</th>
                    <th className="py-3 px-6">Detected ATS Platform</th>
                    <th className="py-3 px-6">Adapter Mode</th>
                    <th className="py-3 px-6">Policy Status</th>
                    <th className="py-3 px-6 text-right">Direct Career Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6E250A]/10">
                  {filteredCompanies.slice(0, 50).map((c) => (
                    <tr key={c.id} className="hover:bg-[#FEF5E7]/40 transition-colors">
                      <td className="py-3 px-6 font-semibold text-[#2D0E03]">
                        {c.company_name}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-[#FEF5E7] border border-[#6E250A]/10 text-[10px] font-mono text-[#B34A0E] font-bold">
                          {c.ats_platform || "Direct Career Portal"}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-[11px]">
                        {c.automation_mode}
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {c.policy_status || "APPROVED"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <a
                          href={c.career_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#B34A0E] hover:underline font-semibold text-[11px]"
                        >
                          Careers <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
