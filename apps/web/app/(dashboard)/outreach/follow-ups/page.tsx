"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Search,
  Send,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface FollowUpItem {
  id: string;
  recruiter_name: string;
  recruiter_title: string;
  company: string;
  role: string;
  channel: string;
  initial_sent_date: string;
  stage: string;
  due_status: string;
  suggested_subject: string;
  suggested_body: string;
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "DUE" | "REPLIED">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");

  const loadFollowUps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/outreach/follow-ups`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.follow_ups || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.recruiter_name.toLowerCase().includes(search.toLowerCase()) ||
      item.company.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "DUE") return item.due_status === "DUE_TODAY";
    if (activeFilter === "REPLIED") return item.due_status === "REPLIED";
    return true;
  });

  const handleCopyDraft = (item: FollowUpItem) => {
    const fullText = `Subject: ${item.suggested_subject}\n\n${item.suggested_body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const updateStatus = async (id: string, due_status: string) => {
    const res = await fetch(`${API_BASE}/api/v1/outreach/follow-ups/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ due_status }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((it) => (it.id === id ? data.follow_up : it)));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecruiter.trim() || !newCompany.trim()) return;
    const res = await fetch(`${API_BASE}/api/v1/outreach/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recruiter_name: newRecruiter.trim(),
        company: newCompany.trim(),
        role: newRole.trim() || "Software Engineer",
        channel: "Email",
        stage: "Day 3 Bump",
        suggested_subject: `Following up — ${newRole.trim() || "Software Engineer"} at ${newCompany.trim()}`,
        suggested_body: `Hi ${newRecruiter.trim()},\n\nFollowing up on my application for the ${newRole.trim() || "Software Engineer"} role at ${newCompany.trim()}. Happy to share any additional details!`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => [data.follow_up, ...prev]);
      setNewRecruiter("");
      setNewCompany("");
      setNewRole("");
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Outreach Follow-ups CRM
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            SQLite-persisted Day 3 / Day 7 / Day 14 recruiter follow-up queue. Zero automated spam.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadFollowUps} className="text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)} className="text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Follow-up
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="p-5">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-[#2D0E03]">Recruiter Name</label>
              <input
                required
                value={newRecruiter}
                onChange={(e) => setNewRecruiter(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full mt-1 px-3 py-2 text-xs rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#2D0E03]">Company</label>
              <input
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="e.g. Meridian AI"
                className="w-full mt-1 px-3 py-2 text-xs rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#2D0E03]">Role</label>
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="w-full mt-1 px-3 py-2 text-xs rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/15"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="text-xs">
              Save Follow-up
            </Button>
          </form>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by recruiter, company, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-white border border-[#6E250A]/15"
          />
        </div>
        <div className="flex gap-1.5">
          {(["ALL", "DUE", "REPLIED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border ${
                activeFilter === f
                  ? "bg-[#B34A0E] text-white border-transparent"
                  : "bg-white text-[#2D0E03]/70 border-[#6E250A]/15"
              }`}
            >
              {f === "ALL" ? "All" : f === "DUE" ? "Due Today" : "Replied"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold text-[#2D0E03]">
                  {item.recruiter_name} • {item.company}
                </h3>
                <div className="text-xs text-[#2D0E03]/70">
                  {item.role} ({item.stage} • {item.channel})
                </div>
              </div>
              <Badge
                variant={item.due_status === "REPLIED" ? "success" : "peach"}
                className="text-[10px]"
              >
                {item.due_status}
              </Badge>
            </div>

            <div className="p-3 rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/10 text-xs text-[#2D0E03]/80 whitespace-pre-line">
              <div className="font-semibold text-[#2D0E03] mb-1">
                Subject: {item.suggested_subject}
              </div>
              {item.suggested_body}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#6E250A]/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyDraft(item)}
                className="text-xs gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedId === item.id ? "Copied!" : "Copy Draft"}
              </Button>
              <div className="flex items-center gap-2">
                {item.due_status !== "REPLIED" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateStatus(item.id, "REPLIED")}
                    className="text-xs gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mark Replied
                  </Button>
                )}
                {item.due_status === "DUE_TODAY" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateStatus(item.id, "SCHEDULED")}
                    className="text-xs gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Mark Sent
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
