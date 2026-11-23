"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bookmark, Search, Building2, MapPin, Send, FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([
    {
      id: "saved-01",
      title: "Junior Full Stack Developer",
      company: "Acme Corp",
      location: "Pune, India (Hybrid)",
      score: 94,
      source: "Greenhouse",
      savedDate: "Today",
    },
    {
      id: "saved-02",
      title: "Python Backend Engineer",
      company: "Stripe",
      location: "Bengaluru, India (Remote)",
      score: 92,
      source: "Workday",
      savedDate: "Yesterday",
    },
  ]);

  const removeJob = (id: string) => {
    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Saved Jobs
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Bookmarked positions awaiting resume tailoring and application preparation.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          {savedJobs.length} Bookmarked Opportunities
        </Badge>
      </div>

      {savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedJobs.map((job) => (
            <Card key={job.id} className="p-6 flex flex-col justify-between hover:border-[#B34A0E]/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="peach" className="font-mono font-bold">
                    {job.score}% Match
                  </Badge>
                  <span className="text-[10px] text-[#2D0E03]/50">
                    Saved {job.savedDate}
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
                  onClick={() => removeJob(job.id)}
                  className="text-xs text-red-700 hover:text-red-800 gap-1 px-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
                <div className="flex items-center gap-2">
                  <Link href={`/auto-apply?jobId=${job.id}`}>
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
            No Saved Jobs
          </h4>
          <p className="text-xs text-[#2D0E03]/60 max-w-sm mx-auto mt-1">
            Browse through 106 official portals to bookmark high-conviction job openings.
          </p>
        </Card>
      )}
    </div>
  );
}
