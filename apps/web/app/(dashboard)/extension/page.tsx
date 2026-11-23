"use client";

import React from "react";
import { Puzzle, ShieldCheck, CheckCircle2, Download, ExternalLink, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExtensionIntegrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Chrome Browser Extension (MV3)
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Manifest V3 Companion with Shadow DOM field extraction, side-panel copilot, and loopback encryption.
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-xs">
          Extension Manifest V3 Ready
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#6E250A]/10 pb-3">
            <Puzzle className="w-5 h-5 text-[#B34A0E]" />
            <h3 className="font-display text-xl font-bold text-[#2D0E03]">
              Side Panel & In-Page Autofill
            </h3>
          </div>

          <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
            The Chrome extension operates directly in your active browser tab. It detects supported career pages (Greenhouse, Workday, Lever), inspects form DOM nodes, and extracts the required job description without leaving the portal.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#2D0E03]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Isolated Shadow DOM UI prevents host page script injection</span>
            </div>
            <div className="flex items-center gap-2 text-[#2D0E03]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Direct pairing with local FastAPI backend via loopback token</span>
            </div>
            <div className="flex items-center gap-2 text-[#2D0E03]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Zero LinkedIn scraping: strict adherence to platform policies</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#6E250A]/10 pb-3">
              <Zap className="w-5 h-5 text-[#B34A0E]" />
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                Developer Installation
              </h3>
            </div>

            <p className="text-xs text-[#2D0E03]/70 mt-2 leading-relaxed">
              Load the pre-built unpacked extension directly into Google Chrome or Microsoft Edge from your project workspace:
            </p>

            <div className="mt-3 p-3 rounded-[8px] bg-[#FEF5E7] font-mono text-[11px] text-[#2D0E03] border border-[#6E250A]/10 space-y-1">
              <div>1. Open <code>chrome://extensions</code> in Chrome</div>
              <div>2. Enable "Developer Mode" (top right toggle)</div>
              <div>3. Click "Load Unpacked"</div>
              <div>4. Select <code>apps/extension/dist</code></div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#6E250A]/10 flex items-center justify-between">
            <span className="text-xs text-[#2D0E03]/60">
              Source: <code>apps/extension/</code>
            </span>
            <Button
              variant="primary"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => alert("Extension build located in apps/extension/dist")}
            >
              <Download className="w-3.5 h-3.5" />
              Check Build Artifacts
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
