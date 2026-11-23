"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Filter,
  Search,
  Building2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Lock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface ApplicationRecord {
  id: string;
  receipt_id?: string;
  approval_id?: string;
  status: string;
  destination_url: string;
  confirmation_number?: string;
  payload_hash?: string;
  screenshot_url?: string;
  expires_at?: string;
  submitted_at?: string;
  job_title?: string;
  company_name?: string;
}

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const stages = [
    { id: "PREPARED", label: "Prepared" },
    { id: "NEEDS_APPROVAL", label: "Needs Approval" },
    { id: "CONFIRMED", label: "Confirmed / Submitted" },
    { id: "INTERVIEW", label: "Interview" },
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Could not fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#2D0E03]">
              Application Tracker & Immutable Receipts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAD7A0] text-[#2D0E03]">
              Real Submissions
            </span>
          </div>
          <p className="text-xs text-[#2D0E03]/70 font-sans mt-1">
            Real-time pipeline. Every submission is recorded with a canonical SHA-256 confirmation hash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchApplications}
            variant="outline"
            size="sm"
            className="text-xs border-[#6E250A]/20 text-[#2D0E03] bg-white hover:bg-[#FEF5E7]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <div className="flex rounded-[10px] bg-white border border-[#6E250A]/15 p-1 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded-[6px] font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-[#B34A0E] text-white"
                  : "text-[#2D0E03]/70 hover:text-[#2D0E03]"
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-[6px] font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-[#B34A0E] text-white"
                  : "text-[#2D0E03]/70 hover:text-[#2D0E03]"
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Zero Fake Data Empty State */}
      {applications.length === 0 && !loading && (
        <Card className="p-12 text-center bg-white border border-[#6E250A]/15 rounded-xl">
          <FileCheck2 className="w-12 h-12 text-[#B34A0E]/40 mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-[#2D0E03] mb-1">
            Application Pipeline Ready (0 Fake Records)
          </h3>
          <p className="text-xs text-[#2D0E03]/60 max-w-md mx-auto mb-4">
            No applications have been prepared or submitted yet. Discover open jobs or tailor your resume to queue an application into the Exact-Action Approval Gate.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/jobs">
              <Button size="sm" className="text-xs bg-[#B34A0E] text-white hover:bg-[#B34A0E]/90">
                <span>Browse 1,379 Portals & Jobs</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
            <Link href="/approvals">
              <Button variant="outline" size="sm" className="text-xs border-[#6E250A]/20 text-[#2D0E03] bg-white hover:bg-[#FEF5E7]">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-[#B34A0E]" />
                <span>Open Approval Gate</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Kanban Board View */}
      {applications.length > 0 && viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage.id);
            return (
              <div key={stage.id} className="space-y-3 min-w-[220px]">
                <div className="flex items-center justify-between p-3 rounded-[10px] bg-white border border-[#6E250A]/15 shadow-2xs">
                  <span className="font-display text-sm font-bold text-[#2D0E03]">
                    {stage.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FEF5E7] text-[#2D0E03] font-bold font-mono">
                    {stageApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageApps.map((app, idx) => (
                    <Card
                      key={app.receipt_id || app.approval_id || `${app.id}-${idx}`}
                      className="p-4 space-y-2 hover:border-[#B34A0E]/40 transition-all bg-white border-[0.8px] border-[#6E250A]/15"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF5E7] text-[#B34A0E]">
                          {app.status}
                        </span>
                        <span className="text-[10px] text-[#2D0E03]/50">
                          {app.submitted_at ? new Date(app.submitted_at).toLocaleTimeString() : "Pending"}
                        </span>
                      </div>

                      <h4 className="font-display text-sm font-bold text-[#2D0E03] leading-snug">
                        {app.job_title || app.id}
                      </h4>

                      <div className="text-[11px] text-[#2D0E03]/70 font-medium truncate">
                        {app.destination_url}
                      </div>

                      <div className="pt-2 border-t border-[#6E250A]/10 flex items-center justify-between text-[11px]">
                        <span className="text-[#2D0E03]/60 font-mono text-[9px] truncate max-w-[120px]">
                          {app.confirmation_number || app.payload_hash || app.approval_id}
                        </span>
                        <Link href="/approvals" className="text-[#B34A0E] font-semibold hover:underline">
                          Review
                        </Link>
                      </div>
                    </Card>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="p-4 text-center rounded-[10px] bg-[#FEF5E7]/40 border border-dashed border-[#6E250A]/15 text-[11px] text-[#2D0E03]/50">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {applications.length > 0 && viewMode === "table" && (
        <Card className="overflow-hidden bg-white border border-[#6E250A]/15 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FEF5E7] text-[#2D0E03]/70 uppercase text-[10px] font-bold border-b border-[#6E250A]/10">
              <tr>
                <th className="py-3 px-6">Application ID</th>
                <th className="py-3 px-6">Destination Portal</th>
                <th className="py-3 px-6">Stage</th>
                <th className="py-3 px-6">Receipt / Hash</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6E250A]/10">
              {applications.map((app, idx) => (
                <tr
                  key={app.receipt_id || app.approval_id || `${app.id}-${idx}`}
                  className="hover:bg-[#FEF5E7]/40 transition-colors"
                >
                  <td className="py-4 px-6 font-semibold text-[#2D0E03]">
                    {app.id}
                  </td>
                  <td className="py-4 px-6 text-[11px] text-[#2D0E03]/70 truncate max-w-xs">
                    {app.destination_url}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEF5E7] text-[#B34A0E] border border-[#6E250A]/15">
                      {app.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-[#2D0E03]/60 truncate max-w-xs">
                    {app.confirmation_number || app.payload_hash || "Awaiting Decision"}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href="/approvals">
                      <Button variant="ghost" size="sm" className="text-xs text-[#B34A0E]">
                        Review
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
