"use client";

import React, { useState } from "react";
import { SlidersHorizontal, CheckCircle2, ShieldCheck, Save, DollarSign, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PreferencesSettingsPage() {
  const [minSalary, setMinSalary] = useState("₹10,00,000");
  const [workMode, setWorkMode] = useState("Hybrid");
  const [noticePeriod, setNoticePeriod] = useState("15 Days");
  const [sponsorshipRequired, setSponsorshipRequired] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Job Search & Targeting Preferences
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Configure salary floors, preferred employment formats, and notice period constraints.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          Hard Constraints Active
        </Badge>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2D0E03]">Minimum Expected Compensation</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2D0E03]">Preferred Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              >
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">On-site</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2D0E03]">Notice Period</label>
              <select
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              >
                <option value="Immediate">Immediate / 0 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#2D0E03]">
              <input
                type="checkbox"
                checked={sponsorshipRequired}
                onChange={(e) => setSponsorshipRequired(e.target.checked)}
                className="rounded text-[#B34A0E] focus:ring-[#B34A0E]"
              />
              <span>Requires Visa Sponsorship for Target Positions</span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#2D0E03]/60 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Filters applied to all 106 portals
            </span>
            <Button type="submit" variant="primary" size="sm" className="text-xs gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Save Targeting Rules
            </Button>
          </div>

          {saved && (
            <div className="p-3 rounded-[8px] bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Targeting rules updated successfully!
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
