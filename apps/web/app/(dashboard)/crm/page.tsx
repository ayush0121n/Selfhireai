"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, Building2, Mail, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ContactRecord {
  id: number | string;
  name: string;
  job_title: string;
  company: string;
  location: string;
  linkedin_url?: string;
  company_website?: string;
}

export default function AdminCrmPage() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchContacts = async (searchQuery = "") => {
    setLoading(true);
    setErrorMsg("");
    try {
      const url = searchQuery.trim()
        ? `${API_BASE}/api/v1/contacts?q=${encodeURIComponent(searchQuery.trim())}&limit=100`
        : `${API_BASE}/api/v1/contacts?limit=100`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load recruiter CRM directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(query);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#6E250A]/20 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#B34A0E] text-xs font-mono uppercase tracking-widest mb-1">
            <Users className="w-4 h-4" />
            <span>Verified Talent Acquisition CRM</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-[#2D0E03]">
            Recruiter &amp; Referral Directory
          </h1>
          <p className="text-sm text-[#6E250A]/80 mt-1">
            Cross-reference target employers with verified Talent Acquisition leads for human-gated 1:1 outreach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/outreach">
            <Button className="bg-[#B34A0E] hover:bg-[#6E250A] text-[#FEF5E7]">
              <Sparkles className="w-4 h-4 mr-2" />
              Open Outreach Studio
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 bg-[#FEF5E7] border-[#6E250A]/20">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6E250A]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by recruiter name, company (e.g. Razorpay, Swiggy), or location..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#6E250A]/30 bg-white text-sm text-[#2D0E03] focus:outline-none focus:ring-2 focus:ring-[#B34A0E]"
            />
          </div>
          <Button type="submit" variant="outline" className="border-[#6E250A]/30 text-[#2D0E03]">
            Search CRM
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQuery("");
              fetchContacts("");
            }}
            className="text-[#6E250A]"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </form>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-36 rounded-xl bg-[#FAD7A0]/30 animate-pulse border border-[#6E250A]/10" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="p-8 text-center bg-white border-[#6E250A]/20">
          <p className="text-[#2D0E03] font-medium">No matching recruiters found.</p>
          <p className="text-xs text-[#6E250A]/70 mt-1">
            Try clearing your search filter or seeding the 1,838 recruiter database.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-4 bg-white border-[#6E250A]/20 hover:border-[#B34A0E] transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-[#2D0E03] text-base leading-tight">
                    {contact.name}
                  </h2>
                  <Badge className="bg-[#FAD7A0] text-[#2D0E03] text-[10px] font-mono shrink-0">
                    TA LEAD
                  </Badge>
                </div>
                <p className="text-xs text-[#6E250A]/80 mt-1">{contact.job_title}</p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#B34A0E] mt-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{contact.company}</span>
                  {contact.location && (
                    <span className="text-[#6E250A]/60 font-normal">· {contact.location}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#6E250A]/10">
                {contact.linkedin_url ? (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#6E250A] hover:text-[#B34A0E] font-medium"
                  >
                    Profile <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-[#6E250A]/50 font-mono">MANUAL_LINK</span>
                )}
                <Link href={`/outreach/email?company=${encodeURIComponent(contact.company)}&recipient=${encodeURIComponent(contact.name)}`}>
                  <Button size="sm" className="h-7 text-xs bg-[#2D0E03] hover:bg-[#B34A0E] text-[#FEF5E7]">
                    <Mail className="w-3 h-3 mr-1" />
                    Draft 1:1
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
