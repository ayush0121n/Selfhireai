"use client";

import React from "react";
import DirectOutreachStudio from "@/components/DirectOutreachStudio";
import { Badge } from "@/components/ui/badge";

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Recruiter Discovery & 1-to-1 Cold Outreach
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Verified Talent Acquisition Database (1,838 Recruiters). 1:1 human-approved outreach with zero mass-spamming.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          1,838 Decision Makers Indexed
        </Badge>
      </div>

      <DirectOutreachStudio />
    </div>
  );
}
