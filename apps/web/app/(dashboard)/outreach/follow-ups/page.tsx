"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FollowUpItem {
  id: string;
  recruiter_name: string;
  recruiter_title: string;
  company: string;
  role: string;
  channel: "Email" | "LinkedIn";
  initial_sent_date: string;
  stage: "Day 3 Bump" | "Day 7 Value-Add" | "Day 14 Final Check";
  due_status: "DUE_TODAY" | "SCHEDULED" | "REPLIED" | "EXPIRED";
  suggested_subject: string;
  suggested_body: string;
}

const INITIAL_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: "fu-01",
    recruiter_name: "Sarah Jenkins",
    recruiter_title: "Staff Technical Recruiter",
    company: "Stripe",
    role: "Senior Full Stack Engineer",
    channel: "Email",
    initial_sent_date: "2026-11-16",
    stage: "Day 7 Value-Add",
    due_status: "DUE_TODAY",
    suggested_subject: "Re: Senior Full Stack role at Stripe — recent distributed caching benchmark",
    suggested_body:
      "Hi Sarah,\n\nFollowing up on my note last week regarding Stripe's engineering openings. I recently read about Stripe's infrastructure scaling challenges and wanted to share how I optimized Redis worker pools to cut webhook latency by 42% at scale.\n\nWould love 10 minutes to connect if this aligns with the team's Q4 roadmap!\n\nBest,\nAyush Narkhede",
  },
  {
    id: "fu-02",
    recruiter_name: "David Chen",
    recruiter_title: "Head of Talent",
    company: "Acme Corp",
    role: "Lead Python / Backend Engineer",
    channel: "LinkedIn",
    initial_sent_date: "2026-11-20",
    stage: "Day 3 Bump",
    due_status: "SCHEDULED",
    suggested_subject: "Quick bump — Lead Python Engineer position",
    suggested_body:
      "Hi David, quick follow-up to check if my background in high-throughput FastAPI services caught your team's interest. Happy to share our technical case studies!",
  },
  {
    id: "fu-03",
    recruiter_name: "Priya Sharma",
    recruiter_title: "Principal Recruiter",
    company: "Razorpay",
    role: "Staff Platform Engineer",
    channel: "Email",
    initial_sent_date: "2026-11-09",
    stage: "Day 14 Final Check",
    due_status: "DUE_TODAY",
    suggested_subject: "Closing the loop — Staff Platform Engineer at Razorpay",
    suggested_body:
      "Hi Priya,\n\nI understand your schedule is tight. I am closing the loop on my application for the Staff Platform Engineer role. If the headcount is filled, no worries at all — I'd be glad to stay in touch for future platform initiatives.\n\nWarm regards,\nAyush",
  },
  {
    id: "fu-04",
    recruiter_name: "Marcus Vance",
    recruiter_title: "VP of Engineering",
    company: "CloudScale Systems",
    role: "Senior Distributed Systems Engineer",
    channel: "Email",
    initial_sent_date: "2026-11-18",
    stage: "Day 3 Bump",
    due_status: "REPLIED",
    suggested_subject: "Re: Distributed systems opening",
    suggested_body: "Candidate received recruiter interview invitation on Nov 21.",
  },
];

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpItem[]>(INITIAL_FOLLOW_UPS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "DUE" | "REPLIED">("ALL");
  const [selectedItem, setSelectedItem] = useState<FollowUpItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleMarkReplied = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, due_status: "REPLIED" } : it))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
              Smart Follow-up Intelligence
            </h1>
            <Badge variant="terracotta" className="text-xs">
              Cadence Active
            </Badge>
          </div>
          <p className="text-sm text-[#2D0E03]/70 font-sans">
            Automated Day 3, Day 7, and Day 14 follow-up reminders. Verified with Google XYZ evidence citations to maximize recruiter response rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="peach" className="px-3 py-1 font-semibold text-xs">
            Response Rate: 38.4%
          </Badge>
        </div>
      </div>

      {/* Cadence Timeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-[#B34A0E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60 font-sans">
              Day 3: Polite Bump
            </span>
            <Clock className="w-4 h-4 text-[#B34A0E]" />
          </div>
          <div className="text-2xl font-bold font-display text-[#2D0E03]">
            {items.filter((i) => i.stage === "Day 3 Bump").length} Queued
          </div>
          <p className="text-[11px] text-[#2D0E03]/60 mt-1">
            Short 2-sentence note to bring initial outreach back to the top of inbox.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#E67E22]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60 font-sans">
              Day 7: Value-Add Insight
            </span>
            <Sparkles className="w-4 h-4 text-[#E67E22]" />
          </div>
          <div className="text-2xl font-bold font-display text-[#2D0E03]">
            {items.filter((i) => i.stage === "Day 7 Value-Add").length} Active
          </div>
          <p className="text-[11px] text-[#2D0E03]/60 mt-1">
            Shares a relevant technical artifact or benchmark matching company pain points.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60 font-sans">
              Day 14: Graceful Closure
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-display text-[#2D0E03]">
            {items.filter((i) => i.stage === "Day 14 Final Check").length} Pending
          </div>
          <p className="text-[11px] text-[#2D0E03]/60 mt-1">
            Polite closing loop leaving the door open for future strategic hiring.
          </p>
        </Card>
      </div>

      {/* Main Table & Filter Controls */}
      <Card className="overflow-hidden">
        <div className="p-4 px-6 border-b border-[#6E250A]/10 bg-[#FEF5E7]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={activeFilter === "ALL" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("ALL")}
              className="text-xs"
            >
              All Outreaches ({items.length})
            </Button>
            <Button
              variant={activeFilter === "DUE" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("DUE")}
              className="text-xs"
            >
              Due Today ({items.filter((i) => i.due_status === "DUE_TODAY").length})
            </Button>
            <Button
              variant={activeFilter === "REPLIED" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("REPLIED")}
              className="text-xs"
            >
              Replied ({items.filter((i) => i.due_status === "REPLIED").length})
            </Button>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by recruiter or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[10px] bg-white border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FEF5E7] text-[#2D0E03]/70 uppercase text-[10px] font-bold border-b border-[#6E250A]/10">
              <tr>
                <th className="py-3.5 px-6">Recruiter & Company</th>
                <th className="py-3.5 px-6">Target Role</th>
                <th className="py-3.5 px-6">Cadence Stage</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6E250A]/10">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#FEF5E7]/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-[#2D0E03]">
                      {item.recruiter_name}
                    </div>
                    <div className="text-[11px] text-[#2D0E03]/60">
                      {item.recruiter_title} • <span className="font-medium text-[#B34A0E]">{item.company}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-[#2D0E03]">
                    {item.role}
                    <div className="text-[10px] text-[#2D0E03]/50">
                      via {item.channel} ({item.initial_sent_date})
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge variant="peach" className="text-[10px] font-mono">
                      {item.stage}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-6">
                    {item.due_status === "DUE_TODAY" && (
                      <span className="inline-flex items-center gap-1.5 text-[#B34A0E] font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-[#B34A0E] animate-ping"></span>
                        Due Today
                      </span>
                    )}
                    {item.due_status === "SCHEDULED" && (
                      <span className="text-[#2D0E03]/60 font-medium text-[11px]">
                        Scheduled
                      </span>
                    )}
                    {item.due_status === "REPLIED" && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Replied
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="text-xs py-1 px-2.5"
                    >
                      View Draft
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCopyDraft(item)}
                      className="text-xs py-1 px-2.5 gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Draft Modal / Detail Viewer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#2D0E03]">
                  AI Generated Follow-up Draft
                </h3>
                <p className="text-xs text-[#2D0E03]/60">
                  Targeted to {selectedItem.recruiter_name} at {selectedItem.company} ({selectedItem.stage})
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-sm font-bold text-[#2D0E03]/50 hover:text-[#2D0E03]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#2D0E03] block mb-1">
                  Subject Line:
                </label>
                <div className="p-2.5 rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/10 text-[#2D0E03] font-mono">
                  {selectedItem.suggested_subject}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#2D0E03] block mb-1">
                  Message Body:
                </label>
                <div className="p-3 rounded-[8px] bg-[#FEF5E7] border border-[#6E250A]/10 text-[#2D0E03] whitespace-pre-wrap leading-relaxed">
                  {selectedItem.suggested_body}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#6E250A]/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleMarkReplied(selectedItem.id);
                  setSelectedItem(null);
                }}
                className="text-xs text-emerald-800"
              >
                Mark as Replied
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopyDraft(selectedItem)}
                  className="text-xs gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === selectedItem.id ? "Copied to Clipboard!" : "Copy Full Message"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
