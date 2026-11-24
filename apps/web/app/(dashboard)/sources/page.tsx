"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Building2,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [activeTab, setActiveTab] = useState<"boards" | "companies">("boards");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [atsFilter, setAtsFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [srcRes, compRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/jobs/sources?limit=250`),
          fetch(`${API_BASE}/api/v1/jobs/companies?limit=250`)
        ]);
        if (srcRes.ok) {
          const d = await srcRes.json();
          setSources(d.sources || []);
          setTotalSources(d.total || 0);
        }
        if (compRes.ok) {
          const d = await compRes.json();
          setCompanies(d.companies || []);
          setTotalCompanies(d.total || 0);
        }
      } catch (err) {
        console.error("Failed to load sources:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.domain || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "all" || (s.category || "").toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      (c.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.domain || "").toLowerCase().includes(search.toLowerCase());
    const matchesAts = atsFilter === "all" || (c.ats_platform || "").toLowerCase() === atsFilter.toLowerCase();
    return matchesSearch && matchesAts;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#2D0E03]">
            Portals & Career Sources Registry
          </h1>
          <p className="text-sm text-[#6E5D53] mt-1">
            Official index of 1,379 job boards and 675 verified direct employer ATS career pages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="primary" size="sm" className="gap-2 text-xs">
              <span>Explore Active Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8DFD8] gap-2">
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
            Job Boards & Remote Hubs ({totalSources})
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

      {/* Search & Filter Bar */}
      <Card className="p-4 bg-white border border-[#E8DFD8] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#6E5D53] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "boards" ? "Search job boards..." : "Search companies & ATS portals..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-[10px] bg-[#FAF6F2] border border-[#E8DFD8] text-[#2D0E03] placeholder-[#6E5D53]/60 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
          />
        </div>

        {activeTab === "boards" ? (
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {["all", "AI", "Data", "Remote", "India", "Programming"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  category === cat
                    ? "bg-[#B34A0E] text-white"
                    : "bg-[#FAF6F2] text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {["all", "Greenhouse", "Lever", "Workday", "Darwinbox"].map((ats) => (
              <button
                key={ats}
                onClick={() => setAtsFilter(ats)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  atsFilter === ats
                    ? "bg-[#B34A0E] text-white"
                    : "bg-[#FAF6F2] text-[#6E5D53] hover:text-[#2D0E03]"
                }`}
              >
                {ats === "all" ? "All ATS Platforms" : ats}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Tables */}
      {activeTab === "boards" ? (
        <Card className="overflow-hidden bg-white border border-[#E8DFD8]">
          <div className="p-4 px-6 border-b border-[#E8DFD8] bg-[#FAF6F2] flex items-center justify-between">
            <span className="text-sm font-bold text-[#2D0E03]">
              Verified Public Job Sources ({filteredSources.length} showing)
            </span>
            <span className="text-xs text-[#6E5D53]">Zero-scraping policy enforced</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F2] text-[#6E5D53] uppercase text-[10px] font-bold border-b border-[#E8DFD8]">
                <tr>
                  <th className="py-3 px-6">Portal Name</th>
                  <th className="py-3 px-6">Domain</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Integration Mode</th>
                  <th className="py-3 px-6 text-right">Direct Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD8]">
                {filteredSources.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF6F2]/60 transition-colors">
                    <td className="py-3 px-6 font-semibold text-[#2D0E03]">{s.name}</td>
                    <td className="py-3 px-6 text-[#6E5D53]">{s.domain}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 rounded bg-[#FAF6F2] text-[#2D0E03] border border-[#E8DFD8] text-[10px]">
                        {s.category || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.automation_mode}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <a
                        href={s.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#B34A0E] hover:underline font-medium text-xs"
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
      ) : (
        <Card className="overflow-hidden bg-white border border-[#E8DFD8]">
          <div className="p-4 px-6 border-b border-[#E8DFD8] bg-[#FAF6F2] flex items-center justify-between">
            <span className="text-sm font-bold text-[#2D0E03]">
              Direct Company Career Pages ({filteredCompanies.length} showing)
            </span>
            <span className="text-xs text-[#6E5D53]">Greenhouse, Lever, Workday, Darwinbox verified</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F2] text-[#6E5D53] uppercase text-[10px] font-bold border-b border-[#E8DFD8]">
                <tr>
                  <th className="py-3 px-6">Company</th>
                  <th className="py-3 px-6">ATS Platform</th>
                  <th className="py-3 px-6">Policy Status</th>
                  <th className="py-3 px-6 text-right">Career Board Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD8]">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF6F2]/60 transition-colors">
                    <td className="py-3 px-6 font-semibold text-[#2D0E03]">{c.company_name}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 rounded bg-[#FAF6F2] border border-[#E8DFD8] text-[10px] text-[#B34A0E] font-medium">
                        {c.ats_platform || "Direct Career Page"}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {c.policy_status || "APPROVED"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <a
                        href={c.career_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#B34A0E] hover:underline font-medium text-xs"
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
      )}
    </div>
  );
}
