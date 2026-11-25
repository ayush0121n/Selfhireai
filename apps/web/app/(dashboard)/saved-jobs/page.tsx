"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Send, Trash2, RefreshCw, ExternalLink, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SavedJobRecord {
  job_id: string;
  title: string;
  company: string;
  location: string;
  work_mode?: string;
  score: number;
  source: string;
  canonical_url?: string;
  saved_at: string;
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/saved-jobs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSavedJobs(data.saved_jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const removeJob = async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/saved-jobs/${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedJobs((prev) => prev.filter((j) => j.job_id !== jobId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove saved job");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Saved Jobs
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            SQLite-persisted bookmarked positions awaiting resume tailoring and Exact-Action preparation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSavedJobs}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="peach" className="px-3 py-1 text-xs">
            {savedJobs.length} Bookmarked Opportunities
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-xs text-red-800 flex items-center justify-between">
          <span>Could not load saved jobs: {error}</span>
          <Button variant="outline" size="sm" onClick={loadSavedJobs} className="text-xs">
            Retry
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 h-40 animate-pulse bg-white/70" />
          ))}
        </div>
      ) : savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedJobs.map((job) => (
            <Card
              key={job.job_id}
              className="p-6 flex flex-col justify-between hover:border-[#B34A0E]/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="peach" className="font-mono font-bold">
                    {job.score}% Match
                  </Badge>
                  <span className="text-[10px] text-[#2D0E03]/50 font-mono">
                    {job.source} • {new Date(job.saved_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                  {job.title}
                </h3>
                <div className="text-xs text-[#2D0E03]/70 font-medium">
                  {job.company} • {job.location}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeJob(job.job_id)}
                  className="text-xs text-red-700 hover:text-red-800 gap-1 px-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
                <div className="flex items-center gap-2">
                  {job.canonical_url && (
                    <a href={job.canonical_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        <ExternalLink className="w-3.5 h-3.5" /> Posting
                      </Button>
                    </a>
                  )}
                  <Link href={`/auto-apply?jobId=${encodeURIComponent(job.job_id)}`}>
                    <Button variant="primary" size="sm" className="text-xs gap-1">
                      <Send className="w-3.5 h-3.5" /> Prepare
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center bg-white border-dashed">
          <Bookmark className="w-8 h-8 text-[#B34A0E] mx-auto mb-2 opacity-50" />
          <h4 className="font-display text-lg font-bold text-[#2D0E03]">
            No Saved Jobs Yet
          </h4>
          <p className="text-xs text-[#2D0E03]/60 max-w-sm mx-auto mt-1 mb-4">
            Bookmark high-conviction openings from Discover Jobs or Startups Hiring to stage them here.
          </p>
          <Link href="/jobs">
            <Button variant="primary" size="sm" className="text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" /> Browse Live Jobs
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
