"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
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
  Briefcase,
  Copy,
  Check,
  X,
  ClipboardList,
  Filter,
  CheckSquare,
  Square,
  Ban,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmittedApplicationPreview, type SubmittedSnapshot } from "@/components/applications/SubmittedApplicationPreview";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface AvailablePortal {
  name: string;
  count: number;
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<"live" | "startups" | "boards" | "companies">("live");
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [startups, setStartups] = useState<any[]>([]);
  const [remoteStartupsOnly, setRemoteStartupsOnly] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Record<string, boolean>>({});
  const [totalLiveJobs, setTotalLiveJobs] = useState(0);
  const [availablePortals, setAvailablePortals] = useState<AvailablePortal[]>([]);
  const [jobSources, setJobSources] = useState<any[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  // Manual Application State
  const [manualModalJob, setManualModalJob] = useState<any | null>(null);
  const [manualSnapshot, setManualSnapshot] = useState<SubmittedSnapshot | null>(null);
  const [portalFillLoading, setPortalFillLoading] = useState(false);
  const [confirmingManual, setConfirmingManual] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Portal Filtering Controls
  // filterMode: 'all' = no portal restriction, 'include' = only selected, 'exclude' = omit selected
  const [portalFilterMode, setPortalFilterMode] = useState<"all" | "include" | "exclude">("all");
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Other Tabs State
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [atsFilter, setAtsFilter] = useState("all");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importCompany, setImportCompany] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load Initial Data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "startups" || tab === "boards" || tab === "companies" || tab === "live") {
        setActiveTab(tab);
      }
    }
    fetchLiveJobs();
    fetchJobSources();
    fetchCompanies();
    fetchProfile();
    fetchStartups();
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/saved-jobs`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, boolean> = {};
        for (const item of data.saved_jobs || []) {
          if (item.job_id) map[item.job_id] = true;
        }
        setSavedJobIds(map);
      }
    } catch (err) {
      console.error("Could not fetch saved jobs:", err);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [remoteStartupsOnly]);

  const fetchStartups = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/startups?remote_only=${remoteStartupsOnly}`);
      if (res.ok) {
        const data = await res.json();
        setStartups(data.startups || []);
      }
    } catch (err) {
      console.error("Could not fetch startups:", err);
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/saved-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          title: job.title || job.job_title,
          company: job.company_name,
          location: job.location_raw || job.location || "Remote",
          work_mode: job.work_mode || "Remote",
          score: job.fit_score || 85,
          source: job.source_name || "ATS",
          canonical_url: job.canonical_url || "",
        }),
      });
      if (res.ok) {
        setSavedJobIds((prev) => ({ ...prev, [job.id]: true }));
        setStatusMsg({ type: "success", text: `Saved "${job.title || job.job_title}" to Saved Jobs.` });
      }
    } catch (err) {
      console.error("Save job failed:", err);
    }
  };

  const handleStartupApply = async (startupId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/startups/${encodeURIComponent(startupId)}/apply`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMsg({
          type: "success",
          text: `Prepared startup application (${data.application_id}). Open Application Tracker to refine cover letter.`,
        });
      }
    } catch (err) {
      console.error("Startup apply failed:", err);
    }
  };

  // Re-fetch when live filter state changes
  useEffect(() => {
    fetchLiveJobs();
  }, [portalFilterMode, selectedPortals, workModeFilter, searchTerm]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Could not fetch profile:", err);
    }
  };

  const fetchLiveJobs = async () => {
    try {
      const params = new URLSearchParams();
      params.append("limit", "100");

      if (workModeFilter && workModeFilter !== "all") {
        params.append("work_mode", workModeFilter);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (portalFilterMode === "include" && selectedPortals.length > 0) {
        params.append("include_portals", selectedPortals.join(","));
      }
      if (portalFilterMode === "exclude" && selectedPortals.length > 0) {
        params.append("exclude_portals", selectedPortals.join(","));
      }

      const res = await fetch(`${API_BASE}/api/v1/jobs/live?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLiveJobs(data.jobs || []);
        setTotalLiveJobs(data.total || 0);
        if (data.available_portals) {
          setAvailablePortals(data.available_portals);
        }
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

  // Portal Toggle Handlers
  const togglePortal = (portalName: string) => {
    if (portalFilterMode === "all") {
      setPortalFilterMode("include");
      setSelectedPortals([portalName]);
      return;
    }

    if (selectedPortals.includes(portalName)) {
      const next = selectedPortals.filter((p) => p !== portalName);
      if (next.length === 0) {
        setPortalFilterMode("all");
      }
      setSelectedPortals(next);
    } else {
      setSelectedPortals([...selectedPortals, portalName]);
    }
  };

  const handleSelectAllPortals = () => {
    setPortalFilterMode("all");
    setSelectedPortals([]);
  };

  const handleSelectStartupAIOnly = () => {
    setPortalFilterMode("include");
    const target = ["Ashby", "YCombinator", "Wellfound", "RemoteOK"].filter((name) =>
      availablePortals.some((p) => p.name === name)
    );
    setSelectedPortals(target);
  };

  const handleSelectEnterpriseATSOnly = () => {
    setPortalFilterMode("include");
    const target = ["Greenhouse", "Lever", "Workday", "Darwinbox", "Direct Career Page"].filter((name) =>
      availablePortals.some((p) => p.name === name)
    );
    setSelectedPortals(target);
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

  // Direct Manual Apply Handler
  const handleDirectManualApply = async (job: any) => {
    const targetUrl = job.canonical_url || "#";
    const pitch = `Hello ${job.company_name} Hiring Team,\n\nI am applying for the ${job.title || job.job_title} role. With hands-on experience in ${(job.extracted_keywords || ["high-scale engineering"]).slice(0, 3).join(", ")}, I have built reliable distributed systems and delivered measurable performance improvements verified in my work history.\n\nThank you for your consideration.\n${profile?.full_name || "Candidate"}`;
    const filledFields = [
      { field_key: "full_name", label: "Full Name", value: profile?.full_name || "Alex Rivera", classification: "VERIFIED_FACT" },
      { field_key: "email", label: "Email Address", value: profile?.email || "alex.rivera@selfhire.ai", classification: "VERIFIED_FACT" },
      { field_key: "phone", label: "Phone Number", value: profile?.phone || "+91 98765 43210", classification: "VERIFIED_FACT" },
      { field_key: "linkedin", label: "LinkedIn Profile", value: profile?.linkedin_url || "", classification: "VERIFIED_FACT" },
      { field_key: "motivation_note", label: "Tailored Cover Note", value: pitch, classification: "EVIDENCE_BASED_PROSE" },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/v1/applications/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          company_name: job.company_name,
          job_title: job.title || job.job_title,
          canonical_url: targetUrl,
          filled_fields: filledFields,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          setManualSnapshot(data.snapshot);
        }
      }

      setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
      setStatusMsg({
        type: "success",
        text: `Manual application for "${job.title || job.job_title}" saved with full filled details!`,
      });
    } catch (err) {
      console.error("Could not log manual application:", err);
    }
  };

  // Open Official Portal & Auto-Fill (Human-in-the-Loop Submit)
  const handleOpenOfficialAndFill = async (job: any) => {
    const targetUrl = job.canonical_url || "#";
    if (targetUrl && targetUrl !== "#") {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    setPortalFillLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/applications/open-and-fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          destination_url: targetUrl,
          company_name: job.company_name,
          job_title: job.title || job.job_title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          setManualSnapshot(data.snapshot);
        }
        setStatusMsg({
          type: "success",
          text: data.message || "Official portal opened & form fields prepared. Please click Submit on the official page.",
        });
      }
    } catch (err) {
      console.error("Open & fill failed:", err);
    } finally {
      setPortalFillLoading(false);
    }
  };

  const handleConfirmManualPortalSubmitted = async () => {
    if (!manualSnapshot) return;
    setConfirmingManual(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/applications/${encodeURIComponent(manualSnapshot.application_id)}/confirm-submitted`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setManualSnapshot(updated);
        if (manualModalJob?.id) {
          setAppliedJobs((prev) => ({ ...prev, [manualModalJob.id]: true }));
        }
      }
    } finally {
      setConfirmingManual(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered views for Other Tabs
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
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#2D0E03]">
            Job Discovery Across All Portals
          </h1>
          <p className="text-sm text-[#6E5D53] mt-1">
            Browse live vacancies from Greenhouse, Ashby, Lever, Workday, Darwinbox, YCombinator, Wellfound, and direct career pages.
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

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-[#E8DFD8] gap-2">
        <button
          onClick={() => setActiveTab("live")}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative ${
            activeTab === "live"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#6E5D53] hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            Live Discovered Roles ({totalLiveJobs})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("startups")}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative ${
            activeTab === "startups"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#6E5D53] hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Startups Hiring ({startups.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("boards")}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative ${
            activeTab === "boards"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#6E5D53] hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Verified Job Boards ({totalSources})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`pb-3 px-4 text-xs font-semibold transition-all relative ${
            activeTab === "companies"
              ? "text-[#B34A0E] border-b-2 border-[#B34A0E]"
              : "text-[#6E5D53] hover:text-[#2D0E03]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Direct Employer Portals ({totalCompanies})
          </span>
        </button>
      </div>

      {/* TAB 1: Live Discovered Roles Across All Portals */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {/* COMPREHENSIVE PORTAL FILTER PANEL */}
          <Card className="p-5 bg-white border border-[#E8DFD8] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD8]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#B34A0E]" />
                <h3 className="text-sm font-bold text-[#2D0E03]">
                  Source Portal Filters & Toggles
                </h3>
                <span className="text-xs text-[#6E5D53]">
                  ({availablePortals.length} portal networks indexed)
                </span>
              </div>

              {/* Mode Selector: Include vs Exclude */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6E5D53]">Filter Mode:</span>
                <button
                  onClick={() => setPortalFilterMode("all")}
                  className={`px-2.5 py-1 rounded-[8px] transition-colors ${
                    portalFilterMode === "all"
                      ? "bg-[#2D0E03] text-white font-medium"
                      : "bg-[#FAF6F2] text-[#6E5D53] hover:text-[#2D0E03]"
                  }`}
                >
                  All Portals
                </button>
                <button
                  onClick={() => {
                    setPortalFilterMode("include");
                    if (selectedPortals.length === 0 && availablePortals.length > 0) {
                      setSelectedPortals([availablePortals[0].name]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-[8px] transition-colors ${
                    portalFilterMode === "include"
                      ? "bg-[#B34A0E] text-white font-medium"
                      : "bg-[#FAF6F2] text-[#6E5D53] hover:text-[#2D0E03]"
                  }`}
                >
                  Include Only
                </button>
                <button
                  onClick={() => {
                    setPortalFilterMode("exclude");
                    if (selectedPortals.length === 0 && availablePortals.length > 0) {
                      setSelectedPortals(["Workday"]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-[8px] transition-colors ${
                    portalFilterMode === "exclude"
                      ? "bg-rose-700 text-white font-medium"
                      : "bg-[#FAF6F2] text-[#6E5D53] hover:text-[#2D0E03]"
                  }`}
                >
                  Exclude Selected
                </button>
              </div>
            </div>

            {/* Portal Selection Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6E5D53]">
                  {portalFilterMode === "all"
                    ? "Showing roles from all portal networks. Click any portal to filter:"
                    : portalFilterMode === "include"
                    ? "Showing roles ONLY from checked portals:"
                    : "Showing all roles EXCEPT checked portals (Excluded):"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllPortals}
                    className="text-[11px] text-[#B34A0E] hover:underline"
                  >
                    Reset (All)
                  </button>
                  <span className="text-[#E8DFD8]">|</span>
                  <button
                    onClick={handleSelectStartupAIOnly}
                    className="text-[11px] text-[#6E5D53] hover:text-[#2D0E03]"
                  >
                    Startups & AI
                  </button>
                  <span className="text-[#E8DFD8]">|</span>
                  <button
                    onClick={handleSelectEnterpriseATSOnly}
                    className="text-[11px] text-[#6E5D53] hover:text-[#2D0E03]"
                  >
                    Enterprise ATS
                  </button>
                </div>
              </div>

              {/* Portal Chips Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {availablePortals.map((p) => {
                  const isSelected = selectedPortals.includes(p.name);
                  const isEffectiveIncluded =
                    portalFilterMode === "all" ||
                    (portalFilterMode === "include" && isSelected) ||
                    (portalFilterMode === "exclude" && !isSelected);

                  return (
                    <button
                      key={p.name}
                      onClick={() => togglePortal(p.name)}
                      className={`text-xs px-3 py-1.5 rounded-[10px] border transition-all flex items-center gap-1.5 ${
                        portalFilterMode === "all"
                          ? "bg-[#FAF6F2] border-[#E8DFD8] text-[#2D0E03] hover:border-[#B34A0E]"
                          : portalFilterMode === "include"
                          ? isSelected
                            ? "bg-[#B34A0E] border-[#B34A0E] text-white font-medium shadow-sm"
                            : "bg-white border-[#E8DFD8] text-[#6E5D53] opacity-60 hover:opacity-100"
                          : isSelected
                          ? "bg-rose-50 border-rose-300 text-rose-800 line-through font-medium"
                          : "bg-[#FAF6F2] border-[#E8DFD8] text-[#2D0E03] hover:border-[#B34A0E]"
                      }`}
                    >
                      {portalFilterMode === "include" && isSelected && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {portalFilterMode === "exclude" && isSelected && (
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>{p.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          portalFilterMode === "include" && isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#E8DFD8]/60 text-[#2D0E03]"
                        }`}
                      >
                        {p.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Work Mode Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-[#6E5D53] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search across all roles by title, company, or tech keyword (e.g. Stripe, Next.js, Go)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-[#FAF6F2] border border-[#E8DFD8] text-[#2D0E03] placeholder-[#6E5D53]/60 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                />
              </div>

              {/* Work Mode Filter */}
              <div className="flex items-center gap-1">
                {["all", "remote", "hybrid", "onsite"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setWorkModeFilter(mode)}
                    className={`flex-1 text-[11px] py-2 rounded-[10px] border capitalize transition-colors ${
                      workModeFilter === mode
                        ? "bg-[#2D0E03] border-[#2D0E03] text-white font-medium"
                        : "bg-[#FAF6F2] border-[#E8DFD8] text-[#6E5D53] hover:text-[#2D0E03]"
                    }`}
                  >
                    {mode === "all" ? "All Modes" : mode}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Ingest URL Card */}
          <Card className="p-4 bg-white border border-[#E8DFD8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#2D0E03]">
                Ingest any custom job URL from any company portal:
              </span>
              <span className="text-[11px] text-[#B34A0E] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Instant ATS extractor
              </span>
            </div>
            <form onSubmit={handleImportJob} className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="url"
                placeholder="https://boards.greenhouse.io/company/jobs/12345"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                required
                className="md:col-span-2 py-2 px-3 text-xs rounded-[10px] bg-[#FAF6F2] border border-[#E8DFD8] text-[#2D0E03] placeholder-[#6E5D53]/60 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
              <input
                type="text"
                placeholder="Company Name (optional)"
                value={importCompany}
                onChange={(e) => setImportCompany(e.target.value)}
                className="py-2 px-3 text-xs rounded-[10px] bg-[#FAF6F2] border border-[#E8DFD8] text-[#2D0E03] placeholder-[#6E5D53]/60 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isImporting}
                className="text-xs gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isImporting ? "Verifying..." : "Ingest & Extract"}
              </Button>
            </form>
          </Card>

          {statusMsg && (
            <div
              className={`p-3 rounded-[10px] border text-xs flex items-center justify-between gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : statusMsg.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-[#FEF5E7] border-[#E8DFD8] text-[#2D0E03]"
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : statusMsg.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-[#B34A0E] animate-spin flex-shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                onClick={() => setStatusMsg(null)}
                className="text-xs text-[#6E5D53] hover:text-[#2D0E03]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active Results Summary */}
          <div className="flex items-center justify-between text-xs text-[#6E5D53] pt-1">
            <span>
              Showing <strong>{liveJobs.length}</strong> open vacancies across{" "}
              {portalFilterMode === "all"
                ? "all portals"
                : portalFilterMode === "include"
                ? `${selectedPortals.join(", ")}`
                : `all portals excluding ${selectedPortals.join(", ")}`}
            </span>
            {(portalFilterMode !== "all" || workModeFilter !== "all" || searchTerm) && (
              <button
                onClick={() => {
                  setPortalFilterMode("all");
                  setSelectedPortals([]);
                  setWorkModeFilter("all");
                  setSearchTerm("");
                }}
                className="text-[#B34A0E] hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Jobs Grid */}
          {liveJobs.length === 0 ? (
            <Card className="p-8 text-center bg-white border border-[#E8DFD8]">
              <Briefcase className="w-10 h-10 text-[#B34A0E] mx-auto mb-2 opacity-60" />
              <h4 className="text-lg font-bold text-[#2D0E03]">
                No roles match your current portal or filter criteria
              </h4>
              <p className="text-xs text-[#6E5D53] mt-1 max-w-sm mx-auto">
                Try selecting different portals, resetting your search keyword, or running live discovery.
              </p>
              <button
                onClick={handleSelectAllPortals}
                className="mt-3 px-4 py-2 bg-[#B34A0E] text-white text-xs font-medium rounded-[10px]"
              >
                Reset Portal Filters
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveJobs.map((job) => {
                const matchPct = job.overall_match_percentage ?? job.fit_score?.overall_match_percentage ?? 85;
                const keywords = job.extracted_keywords || job.must_have_skills || [];
                const isApplied = !!appliedJobs[job.id];
                const portalName = job.source_name || "Official Portal";

                return (
                  <Card
                    key={job.id}
                    className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-white border border-[#E8DFD8]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {/* Portal Badge with Distinct Color Code */}
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-[8px] border ${
                            portalName === "Greenhouse"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : portalName === "Ashby"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : portalName === "Lever"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : portalName === "Workday"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : portalName === "Darwinbox"
                              ? "bg-orange-50 text-orange-800 border-orange-200"
                              : portalName === "YCombinator"
                              ? "bg-orange-100 text-orange-900 border-orange-300 font-bold"
                              : portalName === "Wellfound"
                              ? "bg-red-50 text-red-800 border-red-200"
                              : portalName === "RemoteOK"
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : "bg-[#FAF6F2] text-[#2D0E03] border-[#E8DFD8]"
                          }`}
                        >
                          {portalName}
                        </span>

                        <div className="flex items-center gap-2">
                          {isApplied && (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Applied (Tracked)
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
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

                      <div>
                        <h4 className="text-lg font-bold text-[#2D0E03] line-clamp-1">
                          {job.title || job.job_title}
                        </h4>
                        <div className="text-xs text-[#6E5D53] font-medium mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#2D0E03]">{job.company_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-[#B34A0E]" />
                            {job.location_raw || job.location || "Remote"}
                          </span>
                          <span>•</span>
                          <span className="text-[#B34A0E]">
                            {job.work_mode || "REMOTE"}
                          </span>
                          {job.salary_raw && (
                            <>
                              <span>•</span>
                              <span className="text-xs font-semibold text-[#2D0E03]">
                                {job.salary_raw}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {job.match_explanation && (
                        <p className="text-xs text-[#2D0E03] p-2.5 rounded-[8px] bg-[#FAF6F2] border border-[#E8DFD8]/60 leading-relaxed">
                          &quot;{job.match_explanation}&quot;
                        </p>
                      )}

                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {keywords.slice(0, 6).map((k: string) => (
                            <span
                              key={k}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#FAF6F2] text-[#2D0E03] border border-[#E8DFD8]"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Area: Dedicated Manual Portal Apply + Auto-Apply */}
                    <div className="mt-5 pt-3 border-t border-[#E8DFD8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Direct Manual Apply on Source Portal */}
                        <button
                          onClick={() => handleDirectManualApply(job)}
                          className="px-3.5 py-2 rounded-[10px] bg-[#B34A0E] text-white text-xs font-medium hover:bg-[#8F3B0B] transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          title="Open official company job portal in new tab and mark application"
                        >
                          <span>Apply on {portalName} (Manual)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {/* Open Manual Copy Kit Modal */}
                        <button
                          onClick={() => setManualModalJob(job)}
                          className="p-2 rounded-[10px] bg-[#FAF6F2] border border-[#E8DFD8] text-[#2D0E03] hover:bg-[#F5ECE0] transition-colors text-xs font-medium inline-flex items-center gap-1"
                          title="View copy-paste answers kit for this job"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-[#B34A0E]" />
                          <span>Prep Kit</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveJob(job)}
                          className={`px-2.5 py-2 rounded-[10px] border text-xs font-medium transition-colors ${
                            savedJobIds[job.id]
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-white border-[#E8DFD8] text-[#2D0E03] hover:bg-[#FAF6F2]"
                          }`}
                        >
                          {savedJobIds[job.id] ? "Saved" : "Save"}
                        </button>
                        <Link href={`/auto-apply?jobId=${job.id}`}>
                          <Button variant="outline" size="sm" className="text-xs gap-1.5 py-2">
                            <Send className="w-3 h-3 text-[#B34A0E]" />
                            Auto-Fill with Gate
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1B: Startups Hiring (YC Startups & HN Who is Hiring) */}
      {activeTab === "startups" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#6E5D53]">
              Ranked against your verified profile skills from YC Startups &amp; Hacker News Who is Hiring.
            </p>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#2D0E03] cursor-pointer">
              <input
                type="checkbox"
                checked={remoteStartupsOnly}
                onChange={(e) => setRemoteStartupsOnly(e.target.checked)}
                className="rounded text-[#B34A0E]"
              />
              Remote-friendly only
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startups.map((st) => (
              <Card key={st.id} className="p-5 bg-white border border-[#E8DFD8] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#FAD7A0] text-[#2D0E03] text-[10px] font-bold">
                      {st.source} • {st.batch}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      {st.fit_score}% Stack Match
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-[#2D0E03]">
                    {st.role_title}
                  </h4>
                  <div className="text-xs text-[#6E5D53] font-medium">
                    {st.company_name} • {st.location} {st.compensation ? `• ${st.compensation}` : ""}
                  </div>
                  <p className="text-xs text-[#2D0E03]/80 leading-relaxed">{st.summary}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(st.stack || []).map((tech: string) => (
                      <span
                        key={tech}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#FAF6F2] text-[#2D0E03] border border-[#E8DFD8]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8DFD8] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#6E5D53] truncate">
                    {st.apply_email}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartupApply(st.id)}
                    className="text-xs gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Prepare Application
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Verified Job Boards */}
      {activeTab === "boards" && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between bg-white border border-[#E8DFD8]">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#6E5D53] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search boards (e.g. RemoteOK, AI, India, Data, DevOps)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#E8DFD8] text-[#2D0E03] placeholder-[#6E5D53]/60 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {["all", "AI", "Data", "Remote", "India", "Programming"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                    categoryFilter === cat
                      ? "bg-[#B34A0E] text-white"
                      : "bg-[#FEF5E7] text-[#6E5D53] hover:text-[#2D0E03]"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden bg-white border border-[#E8DFD8]">
            <div className="p-4 px-6 border-b border-[#E8DFD8] bg-[#FAF6F2] flex items-center justify-between">
              <span className="text-base font-bold text-[#2D0E03]">
                Awesome Job Boards Catalog
              </span>
              <span className="text-xs text-[#6E5D53]">
                Showing {filteredSources.length} of {totalSources}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F2] text-[#6E5D53] uppercase text-[10px] font-bold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-6">Source Name</th>
                    <th className="py-3 px-6">Domain</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Automation Mode</th>
                    <th className="py-3 px-6">Policy Status</th>
                    <th className="py-3 px-6 text-right">Direct Portal Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD8]">
                  {filteredSources.slice(0, 50).map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF6F2]/60 transition-colors">
                      <td className="py-3 px-6 font-semibold text-[#2D0E03]">
                        {s.name}
                      </td>
                      <td className="py-3 px-6 text-[#6E5D53]">
                        {s.domain}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-[#FAF6F2] text-[#2D0E03] border border-[#E8DFD8] text-[10px]">
                          {s.category || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#B34A0E] text-white hover:bg-[#8F3B0B] font-medium text-[11px] transition-colors"
                        >
                          <span>Apply on Board</span>
                          <ExternalLink className="w-3 h-3" />
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
          <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between bg-white border border-[#E8DFD8]">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#6E5D53] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 675 companies (e.g. Razorpay, Swiggy, Apple, Google)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#E8DFD8] text-[#2D0E03] placeholder-[#6E5D53]/60 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {["all", "Darwinbox", "Greenhouse", "Lever", "Workday", "Direct Career Portal"].map((ats) => (
                <button
                  key={ats}
                  onClick={() => setAtsFilter(ats)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                    atsFilter === ats
                      ? "bg-[#B34A0E] text-white"
                      : "bg-[#FEF5E7] text-[#6E5D53] hover:text-[#2D0E03]"
                  }`}
                >
                  {ats}
                </button>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden bg-white border border-[#E8DFD8]">
            <div className="p-4 px-6 border-b border-[#E8DFD8] bg-[#FAF6F2] flex items-center justify-between">
              <span className="text-base font-bold text-[#2D0E03]">
                Worldwide Direct Employer Registry (README Ingested A–Z)
              </span>
              <span className="text-xs text-[#6E5D53]">
                Showing {filteredCompanies.length} of {totalCompanies}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F2] text-[#6E5D53] uppercase text-[10px] font-bold border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-3 px-6">Company</th>
                    <th className="py-3 px-6">Detected ATS Platform</th>
                    <th className="py-3 px-6">Adapter Mode</th>
                    <th className="py-3 px-6">Policy Status</th>
                    <th className="py-3 px-6 text-right">Direct Career Portal Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD8]">
                  {filteredCompanies.slice(0, 50).map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF6F2]/60 transition-colors">
                      <td className="py-3 px-6 font-semibold text-[#2D0E03]">
                        {c.company_name}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-[#FAF6F2] border border-[#E8DFD8] text-[10px] text-[#B34A0E] font-medium">
                          {c.ats_platform || "Direct Career Portal"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-[#6E5D53]">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#B34A0E] text-white hover:bg-[#8F3B0B] font-medium text-[11px] transition-colors"
                        >
                          <span>Apply Directly</span>
                          <ExternalLink className="w-3 h-3" />
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

      {/* Manual Application Helper Modal */}
      {manualModalJob && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-xl w-full p-6 space-y-5 border border-[#E8DFD8] shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8]">
              <div>
                <h3 className="text-lg font-bold text-[#2D0E03]">
                  Manual Application Assistant
                </h3>
                <p className="text-xs text-[#6E5D53]">
                  {manualModalJob.company_name} — {manualModalJob.title || manualModalJob.job_title} ({manualModalJob.source_name || "Official Portal"})
                </p>
              </div>
              <button
                onClick={() => {
                  setManualModalJob(null);
                  setManualSnapshot(null);
                }}
                className="p-1 rounded-full text-[#6E5D53] hover:text-[#2D0E03] hover:bg-[#FAF6F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualSnapshot ? (
              <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3">
                <SubmittedApplicationPreview
                  snapshot={manualSnapshot}
                  onConfirmSubmitted={handleConfirmManualPortalSubmitted}
                  confirming={confirmingManual}
                />
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setManualModalJob(null);
                      setManualSnapshot(null);
                    }}
                    className="px-4 py-2 rounded-[10px] bg-[#2D0E03] text-white text-xs font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 text-xs">
              <p className="text-[#6E5D53] leading-relaxed">
                Click any prepared field below to copy it instantly into your clipboard, then open the official form on the employer&apos;s portal.
              </p>

              {/* Applicant Profile Quick-Copy Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  onClick={() => copyToClipboard(profile?.full_name || "Alex Rivera", "Name")}
                  className="p-3 bg-[#FAF6F2] rounded-[10px] border border-[#E8DFD8] cursor-pointer hover:border-[#B34A0E] transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-[#6E5D53] block text-[10px]">Full Name</span>
                    <span className="font-semibold text-[#2D0E03]">{profile?.full_name || "Alex Rivera"}</span>
                  </div>
                  {copiedField === "Name" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6E5D53]" />}
                </div>

                <div
                  onClick={() => copyToClipboard(profile?.email || "alex.rivera@example.com", "Email")}
                  className="p-3 bg-[#FAF6F2] rounded-[10px] border border-[#E8DFD8] cursor-pointer hover:border-[#B34A0E] transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-[#6E5D53] block text-[10px]">Email</span>
                    <span className="font-semibold text-[#2D0E03] truncate">{profile?.email || "alex.rivera@example.com"}</span>
                  </div>
                  {copiedField === "Email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6E5D53]" />}
                </div>

                <div
                  onClick={() => copyToClipboard(profile?.phone || "+1 (555) 234-5678", "Phone")}
                  className="p-3 bg-[#FAF6F2] rounded-[10px] border border-[#E8DFD8] cursor-pointer hover:border-[#B34A0E] transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-[#6E5D53] block text-[10px]">Phone</span>
                    <span className="font-semibold text-[#2D0E03]">{profile?.phone || "+1 (555) 234-5678"}</span>
                  </div>
                  {copiedField === "Phone" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6E5D53]" />}
                </div>

                <div
                  onClick={() => copyToClipboard(profile?.linkedin_url || "https://linkedin.com/in/alex-rivera", "LinkedIn")}
                  className="p-3 bg-[#FAF6F2] rounded-[10px] border border-[#E8DFD8] cursor-pointer hover:border-[#B34A0E] transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-[#6E5D53] block text-[10px]">LinkedIn URL</span>
                    <span className="font-semibold text-[#2D0E03] truncate">{profile?.linkedin_url || "https://linkedin.com/in/alex-rivera"}</span>
                  </div>
                  {copiedField === "LinkedIn" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6E5D53]" />}
                </div>
              </div>

              {/* Tailored Cover Pitch */}
              <div
                onClick={() => {
                  const pitch = `Hello ${manualModalJob.company_name} Hiring Team,\n\nI am applying for the ${manualModalJob.title || manualModalJob.job_title} role. With hands-on experience in ${(manualModalJob.extracted_keywords || ["high-scale engineering"]).slice(0, 3).join(", ")}, I have built reliable distributed systems and delivered measurable performance improvements verified in my work history.\n\nThank you for your consideration.\n${profile?.full_name || "Alex Rivera"}`;
                  copyToClipboard(pitch, "Pitch");
                }}
                className="p-3 bg-[#FAF6F2] rounded-[10px] border border-[#E8DFD8] cursor-pointer hover:border-[#B34A0E] transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#6E5D53] text-[10px] font-semibold">Tailored Elevator Pitch / Cover Note (Click to copy)</span>
                  {copiedField === "Pitch" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6E5D53]" />}
                </div>
                <p className="text-[#2D0E03] text-xs leading-relaxed">
                  &quot;Hello {manualModalJob.company_name} Hiring Team, I am applying for the {manualModalJob.title || manualModalJob.job_title} role. With hands-on experience in {(manualModalJob.extracted_keywords || ["high-scale engineering"]).slice(0, 3).join(", ")}, I have built reliable systems with verified evidence metrics...&quot;
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E8DFD8]">
              <button
                type="button"
                disabled={portalFillLoading}
                onClick={() => handleOpenOfficialAndFill(manualModalJob)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-[#B34A0E] text-white text-xs font-medium hover:bg-[#8F3B0B] transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{portalFillLoading ? "Opening & Filling..." : `Open & Auto-Fill on ${manualModalJob.source_name || "Portal"}`}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleDirectManualApply(manualModalJob)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] bg-white border border-[#E8DFD8] text-[#2D0E03] text-xs font-medium hover:bg-[#FAF6F2] transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>I&apos;ve Applied (Show Preview)</span>
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
