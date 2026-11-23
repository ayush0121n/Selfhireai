"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Bell, Shield, Sparkles, Command } from "lucide-react";
import { Button } from "../ui/button";

export function AppHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#6E250A]/15 sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Search Bar / Command Palette trigger */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#2D0E03]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 106 portals, skills, or candidates... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-white border border-[#6E250A]/20 px-1.5 py-0.5 rounded text-[#2D0E03]/60 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Exact-Action Safety Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF5E7] border border-[#6E250A]/15 text-xs text-[#2D0E03]/80">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium text-[11px]">Human-in-the-Loop Safe</span>
        </div>

        {/* Quick Launch Agent */}
        <Link href="/agent">
          <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B34A0E]" />
            Ask AI Agent
          </Button>
        </Link>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-[10px] text-[#2D0E03]/70 hover:bg-[#FEF5E7] hover:text-[#2D0E03] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B34A0E]" />
        </button>
      </div>
    </header>
  );
}
