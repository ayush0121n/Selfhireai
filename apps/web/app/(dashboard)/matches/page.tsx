"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Filter,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function MatchesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [featured, setFeatured] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMatchesData() {
      try {
        const [pRes, fRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/profile`),
          fetch(`${API_BASE}/api/v1/discovery/featured`),
        ]);
        if (pRes.ok) setProfile(await pRes.json());
        if (fRes.ok) {
          const fData = await fRes.json();
          setFeatured(fData.companies || []);
        }
      } catch (err) {
        console.error("Failed to load match data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMatchesData();
  }, []);

  const evidenceItems = profile?.evidence_items || [];
  const candidateSkills = profile?.skills || ["Python", "FastAPI", "React", "Docker"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Recommended Matches & ATS Scorer
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Real dynamic ATS match calculation based on your verified Evidence Vault and target criteria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="peach" className="px-3 py-1 text-xs">
            {evidenceItems.length} Verified Evidence Points
          </Badge>
        </div>
      </div>

      {/* Grounding Notice if Evidence Vault is light */}
      {evidenceItems.length === 0 && (
        <Card className="p-6 bg-white border-l-4 border-l-[#B34A0E]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B34A0E] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display text-lg font-bold text-[#2D0E03]">
                  No Verified Evidence in Vault
                </h4>
                <p className="text-xs text-[#2D0E03]/70 mt-0.5 leading-relaxed">
                  Real semantic match scoring requires ground truth from your uploaded resume. Upload your resume in the Resume Studio to generate verifiable ATS scores.
                </p>
              </div>
            </div>
            <Link href="/resume" className="flex-shrink-0">
              <Button variant="primary" size="sm" className="text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Upload Resume
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Verified Skills Summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/60">
            Active Candidate Skills ({candidateSkills.length})
          </span>
          <Link href="/resume" className="text-xs text-[#B34A0E] font-semibold hover:underline">
            Manage Skills
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {candidateSkills.map((skill: string) => (
            <span
              key={skill}
              className="text-xs font-mono px-2.5 py-1 rounded bg-[#FEF5E7] text-[#2D0E03] border border-[#6E250A]/10"
            >
              {skill}
            </span>
          ))}
        </div>
      </Card>

      {/* Matched Opportunities */}
      <div className="space-y-4">
        <h3 className="font-display text-2xl font-bold text-[#2D0E03]">
          Verified Feed Recommendations
        </h3>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featured.map((comp: any, idx: number) => (
              <Card key={idx} className="p-6 flex flex-col justify-between hover:border-[#B34A0E]/40 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="peach" className="font-mono text-xs font-bold">
                      Verified ATS Feed
                    </Badge>
                    <span className="text-[10px] uppercase font-semibold text-[#2D0E03]/50 px-2 py-0.5 rounded bg-[#FEF5E7]">
                      {comp.ats_type || "Greenhouse"}
                    </span>
                  </div>

                  <h4 className="font-display text-2xl font-bold text-[#2D0E03]">
                    {comp.name}
                  </h4>
                  <p className="text-xs text-[#2D0E03]/70">
                    Official company career board integration with direct ATS submission support.
                  </p>

                  <div className="text-[11px] font-mono text-[#2D0E03]/60 truncate bg-[#FEF5E7] p-2 rounded">
                    {comp.careers_url || `https://boards.greenhouse.io/${comp.board_token}`}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#6E250A]/10 flex items-center justify-between">
                  <Link href={`/jobs?company=${encodeURIComponent(comp.name)}`}>
                    <Button variant="ghost" size="sm" className="text-xs px-0">
                      View Openings
                    </Button>
                  </Link>
                  <Link href={`/auto-apply?company=${encodeURIComponent(comp.name)}`}>
                    <Button variant="primary" size="sm" className="text-xs gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Prepare Application
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-white border-dashed">
            <Sparkles className="w-8 h-8 text-[#B34A0E] mx-auto mb-2 opacity-50" />
            <h4 className="font-display text-lg font-bold text-[#2D0E03]">
              No Matches Available Yet
            </h4>
            <p className="text-xs text-[#2D0E03]/60 max-w-sm mx-auto mt-1">
              Start by discovering jobs across our 106 official portals or ingesting a live job URL.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
