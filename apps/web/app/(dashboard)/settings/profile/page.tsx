"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Link2,
  CheckCircle2,
  ShieldCheck,
  Save,
  AlertCircle,
  Upload,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ProfileStrength {
  score: number;
  tier: string;
  checks: { key: string; label: string; weight: number; passed: boolean }[];
  missing: string[];
}

export default function ProfileSettingsPage() {
  const [profileObj, setProfileObj] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [workAuth, setWorkAuth] = useState("Authorized");
  const [noticeDays, setNoticeDays] = useState("15");
  const [strength, setStrength] = useState<ProfileStrength | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, strRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/profile`),
        fetch(`${API_BASE}/api/v1/profile/strength`),
      ]);
      if (profRes.ok) {
        const p = await profRes.json();
        setProfileObj(p);
        setName(p.full_name || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setLocation(p.location || "");
        setGithubUrl(p.github_url || "");
        setLinkedinUrl(p.linkedin_url || "");
        setSkillsText(Array.isArray(p.skills) ? p.skills.join(", ") : "");
        setWorkAuth(p.work_authorization || "Authorized");
        setNoticeDays(String(p.notice_period_days ?? 15));
      }
      if (strRes.ok) {
        setStrength(await strRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImportResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setImportMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      setImportMsg(`Imported ${file.name} — synced ${data.claims_extracted || 0} claims and ${data.skills_total || 0} skills.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resume import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const parsedSkills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...(profileObj || { user_id: "usr_default", skills: [], education: [], experience: [], projects: [], evidence: [] }),
        full_name: name,
        email,
        phone,
        location,
        github_url: githubUrl || null,
        linkedin_url: linkedinUrl || null,
        skills: parsedSkills,
        work_authorization: workAuth,
        notice_period_days: Number(noticeDays) || 0,
      };
      const res = await fetch(`${API_BASE}/api/v1/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setProfileObj(updated);
      setSaved(true);
      const strRes = await fetch(`${API_BASE}/api/v1/profile/strength`);
      if (strRes.ok) setStrength(await strRes.json());
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Candidate Profile & Identity
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Manage your verified identity, public links, and Dossier Profile Strength Meter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleImportResume}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs border-[#6E250A]/25 text-[#2D0E03] gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {importing ? "Importing..." : "Import from Resume"}
          </Button>
          <Badge variant="peach" className="px-3 py-1 text-xs">
            {strength ? `${strength.score}% • ${strength.tier}` : "Loading..."}
          </Badge>
        </div>
      </div>

      {importMsg && (
        <Card className="p-3.5 border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{importMsg}</span>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          {loading ? (
            <div className="h-64 animate-pulse bg-[#FEF5E7]/60 rounded-[12px]" />
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2D0E03]">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
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
                      required
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
                      required
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
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2D0E03]">GitHub URL</label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2D0E03]">LinkedIn URL</label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2D0E03]">Core Skills (comma-separated — used for job matching &amp; auto-fill)</label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Python, FastAPI, TypeScript, React, PostgreSQL"
                  className="w-full px-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2D0E03]">Work Authorization</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#2D0E03]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={workAuth}
                      onChange={(e) => setWorkAuth(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2D0E03]">Notice Period (days)</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[#2D0E03]/60 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Grounded in backend CandidateProfile
                </span>
                <Button type="submit" variant="primary" size="sm" disabled={saving} className="text-xs gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Profile Changes"}
                </Button>
              </div>

              {saved && (
                <div className="p-3 rounded-[8px] bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Profile saved to backend!
                </div>
              )}
            </form>
          )}
        </Card>

        {/* Dossier Profile Strength Meter */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <h3 className="font-display text-xl font-bold text-[#2D0E03]">
              Profile Strength Meter
            </h3>
            <span className="font-mono text-lg font-bold text-[#B34A0E]">
              {strength?.score ?? 0}%
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#FEF5E7] overflow-hidden border border-[#6E250A]/10">
            <div
              className="h-full bg-[#B34A0E] transition-all duration-300"
              style={{ width: `${strength?.score ?? 0}%` }}
            />
          </div>

          <div className="space-y-2">
            {(strength?.checks || []).map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between text-xs p-2 rounded-[8px] bg-[#FEF5E7]/60"
              >
                <span className={c.passed ? "text-[#2D0E03] font-medium" : "text-[#2D0E03]/60"}>
                  {c.label}
                </span>
                <span className={`font-mono text-[10px] font-bold ${c.passed ? "text-emerald-700" : "text-[#B34A0E]"}`}>
                  {c.passed ? `+${c.weight}%` : `0/${c.weight}%`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
