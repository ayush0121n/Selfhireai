"use client";

import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Briefcase, CheckCircle2, ShieldCheck, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfileSettingsPage() {
  const [name, setName] = useState("Ayush Sharma");
  const [email, setEmail] = useState("ayush@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [location, setLocation] = useState("Pune, India");
  const [headline, setHeadline] = useState("Full Stack Engineer (Python, React, FastAPI)");
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
            Candidate Profile & Identity
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Manage your verified identity, contact information, and target professional headline.
          </p>
        </div>
        <Badge variant="peach" className="px-3 py-1 text-xs">
          Profile Verified
        </Badge>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2D0E03]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2D0E03]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2D0E03]">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2D0E03]">Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2D0E03]">Professional Headline</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#2D0E03]/60 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Grounded in local Evidence Vault
            </span>
            <Button type="submit" variant="primary" size="sm" className="text-xs gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Save Profile Changes
            </Button>
          </div>

          {saved && (
            <div className="p-3 rounded-[8px] bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
