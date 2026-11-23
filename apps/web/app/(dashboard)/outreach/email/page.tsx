"use client";

import React, { useState } from "react";
import DirectOutreachStudio from "@/components/DirectOutreachStudio";
import EmailOutreachComposer from "@/components/EmailOutreachComposer";
import { Badge } from "@/components/ui/badge";
import { Mail, Sparkles } from "lucide-react";

export default function ColdEmailPage() {
  const [activeTab, setActiveTab] = useState<"composer" | "studio">("composer");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Recruiter Outreach & Connected Email Composer
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Connect Gmail, Outlook or SMTP to compose and dispatch 1:1 recruiter outreach grounded in verified Google XYZ evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("composer")}
            className={`px-4 py-2 rounded-[12px] text-xs font-semibold transition ${
              activeTab === "composer"
                ? "bg-[#B34A0E] text-white shadow-sm"
                : "bg-white border border-[#6E250A]/15 text-[#2D0E03]"
            }`}
          >
            Connected Mailbox Composer
          </button>
          <button
            onClick={() => setActiveTab("studio")}
            className={`px-4 py-2 rounded-[12px] text-xs font-semibold transition ${
              activeTab === "studio"
                ? "bg-[#B34A0E] text-white shadow-sm"
                : "bg-white border border-[#6E250A]/15 text-[#2D0E03]"
            }`}
          >
            Direct Target Studio & Tailoring
          </button>
        </div>
      </div>

      {activeTab === "composer" ? (
        <EmailOutreachComposer />
      ) : (
        <DirectOutreachStudio />
      )}
    </div>
  );
}
