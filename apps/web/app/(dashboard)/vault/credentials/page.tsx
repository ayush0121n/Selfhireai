"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Server,
  Layers,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface VaultPortalItem {
  portal_domain: string;
  username: string;
}

export default function VaultCredentialsPage() {
  const [portals, setPortals] = useState<VaultPortalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDomain, setFormDomain] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchVaultPortals();
  }, []);

  const fetchVaultPortals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/vault/portals`);
      if (res.ok) {
        const data = await res.json();
        setPortals(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error("Failed to load encrypted vault credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDomain.trim() || !formUsername.trim() || !formPassword.trim()) {
      setStatusMsg({ type: "error", text: "Please enter portal domain, username, and password." });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/vault/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal_domain: formDomain.trim().toLowerCase(),
          username: formUsername.trim(),
          password: formPassword.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg({
          type: "success",
          text: data.message || `Credentials for ${formDomain} safely encrypted in local AES-256-GCM vault.`,
        });
        setFormDomain("");
        setFormUsername("");
        setFormPassword("");
        fetchVaultPortals();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.detail || "Failed to store credential" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Network error communicating with local vault service." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (domain: string) => {
    if (!confirm(`Permanently purge encrypted credentials for ${domain}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/vault/${encodeURIComponent(domain)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: `Credential for ${domain} purged from vault.` });
        fetchVaultPortals();
      } else {
        const err = await res.json();
        setStatusMsg({ type: "error", text: err.detail || "Could not delete credential." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error purging credential." });
    }
  };

  const quickPresets = [
    { label: "Greenhouse", domain: "boards.greenhouse.io" },
    { label: "Ashby", domain: "jobs.ashbyhq.com" },
    { label: "Lever", domain: "jobs.lever.co" },
    { label: "Workday", domain: "myworkdayjobs.com" },
    { label: "Darwinbox", domain: "darwinbox.in" },
    { label: "Wellfound", domain: "wellfound.com" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D0E03]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B34A0E] mb-1">
            <ShieldCheck className="h-4 w-4" />
            Zero-Leak Architecture
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2D0E03]">
            Local Encrypted Credentials Vault
          </h1>
          <p className="text-sm text-[#6E5D53] mt-1 max-w-2xl">
            Store portal logins locally using <strong>AES-256-GCM</strong> with 100,000-iteration PBKDF2 key derivation.
            Passwords never leave your machine and are never injected into LLM prompts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/vault">
            <Button variant="outline" className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5">
              Evidence Vault
            </Button>
          </Link>
          <Button
            onClick={fetchVaultPortals}
            variant="outline"
            className="border-[#2D0E03]/20 text-[#2D0E03] hover:bg-[#2D0E03]/5 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Architecture Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white/70 border border-[#2D0E03]/10 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-[#2D0E03] font-semibold text-sm">
            <Lock className="h-4 w-4 text-[#B34A0E]" />
            AES-256-GCM Encryption
          </div>
          <p className="text-xs text-[#6E5D53]">
            Encrypted on disk with unique 96-bit random initialization vectors per write.
          </p>
        </Card>

        <Card className="p-4 bg-white/70 border border-[#2D0E03]/10 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-[#2D0E03] font-semibold text-sm">
            <KeyRound className="h-4 w-4 text-[#B34A0E]" />
            Local Keystore Isolation
          </div>
          <p className="text-xs text-[#6E5D53]">
            Managed strictly in memory. Credentials are never written to cloud logs or telemetry.
          </p>
        </Card>

        <Card className="p-4 bg-white/70 border border-[#2D0E03]/10 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-[#2D0E03] font-semibold text-sm">
            <Server className="h-4 w-4 text-[#B34A0E]" />
            Direct Autofill Ready
          </div>
          <p className="text-xs text-[#6E5D53]">
            Auto-fills candidate accounts during exact-action manual submissions on supported portals.
          </p>
        </Card>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusMsg.type === "success"
              ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
              : "bg-red-500/10 border-red-500/30 text-red-700"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Credential Form */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white border border-[#2D0E03]/10 rounded-2xl shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#2D0E03] flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#B34A0E]" />
                Store Portal Login
              </h2>
              <p className="text-xs text-[#6E5D53] mt-0.5">
                Saved credentials will be encrypted immediately and bound to the domain.
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-[#6E5D53] uppercase tracking-wider block mb-2">
                Quick Portal Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((p) => (
                  <button
                    key={p.domain}
                    type="button"
                    onClick={() => setFormDomain(p.domain)}
                    className="px-2 py-1 text-xs rounded-md bg-[#FEF5E7] border border-[#2D0E03]/15 text-[#2D0E03] hover:border-[#B34A0E] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveCredential} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D0E03] mb-1">
                  Portal Domain
                </label>
                <input
                  type="text"
                  placeholder="e.g. boards.greenhouse.io"
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#2D0E03]/20 bg-[#FAF6F2] focus:bg-white focus:outline-none focus:border-[#B34A0E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D0E03] mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  placeholder="candidate@example.com"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#2D0E03]/20 bg-[#FAF6F2] focus:bg-white focus:outline-none focus:border-[#B34A0E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D0E03] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#2D0E03]/20 bg-[#FAF6F2] focus:bg-white focus:outline-none focus:border-[#B34A0E] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#6E5D53] hover:text-[#2D0E03]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#B34A0E] hover:bg-[#8F3B0B] text-white font-medium py-2 rounded-lg"
              >
                {isSubmitting ? "Encrypting & Storing..." : "Save to Local Vault"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Portals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#2D0E03] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#B34A0E]" />
              Secured Portals ({portals.length})
            </h2>
            <span className="text-xs text-[#6E5D53]">Zero plaintext exposure</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[#6E5D53] border border-dashed border-[#2D0E03]/20 rounded-2xl bg-white/40">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#B34A0E]" />
              Decrypting keystore metadata...
            </div>
          ) : portals.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#2D0E03]/20 rounded-2xl bg-white/40 space-y-3">
              <Lock className="h-10 w-10 text-[#B34A0E]/50 mx-auto" />
              <div className="text-sm font-semibold text-[#2D0E03]">No portal credentials stored yet</div>
              <p className="text-xs text-[#6E5D53] max-w-md mx-auto">
                Add login credentials for Ashby, Greenhouse, Lever, or company job portals to streamline one-click applications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {portals.map((item) => (
                <Card
                  key={item.portal_domain}
                  className="p-4 bg-white border border-[#2D0E03]/10 rounded-xl hover:shadow-sm transition-shadow flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[#FEF5E7] text-[#B34A0E] border border-[#2D0E03]/10">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#2D0E03] flex items-center gap-2">
                        {item.portal_domain}
                        <Badge variant="outline" className="text-[10px] bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30">
                          AES-256-GCM
                        </Badge>
                      </div>
                      <div className="text-xs text-[#6E5D53] mt-0.5">
                        Username: <span className="font-mono text-[#2D0E03]">{item.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.portal_domain)}
                      className="text-red-600 hover:bg-red-50 h-8 px-2.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
