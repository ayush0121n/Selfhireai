"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock, Key, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CloudflareSettingsCard from "@/components/CloudflareSettingsCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SecuritySettingsPage() {
  const [vaultLocked, setVaultLocked] = useState(false);
  const [portalCount, setPortalCount] = useState<number | null>(null);
  const [purgeStatus, setPurgeStatus] = useState("");
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVault = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/vault/portals`);
        if (res.ok) {
          const data = await res.json();
          setPortalCount(Array.isArray(data.portals) ? data.portals.length : 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to inspect keystore");
      }
    };
    loadVault();
  }, []);

  const handlePurge = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently wipe all local session memory, saved jobs, follow-ups, and vault caches under India DPDP Act compliance."
      )
    ) {
      return;
    }
    setPurging(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/account`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPurgeStatus(data.message || "All user data and session memory purged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute hard purge");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#2D0E03]">
            Security & Credential Vault
          </h1>
          <p className="text-sm text-[#2D0E03]/70 font-sans mt-1">
            Zero-Trust Credential Isolation. Local AES-256-GCM Keystore, Supabase RLS, and DPDP 2023 Right to Erasure.
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-xs">
          AES-256-GCM Keystore Active
        </Badge>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </Card>
      )}

      <CloudflareSettingsCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#B34A0E]" />
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                Local Keystore Status
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {vaultLocked ? "LOCKED" : "ENCRYPTED"}
            </span>
          </div>

          <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
            Portal credentials (Workday, Greenhouse, Naukri) are encrypted locally using your master 32-byte AES key. Credentials are <strong>never</strong> transmitted to external cloud models.
          </p>

          <div className="p-3.5 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2D0E03]">Encrypted Portals Stored:</span>
              <span className="font-mono text-[#2D0E03] font-bold">
                {portalCount === null ? "Checking..." : portalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2D0E03]">Keystore File:</span>
              <span className="font-mono text-[11px] text-[#2D0E03]/60">data/credentials_vault.enc</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2D0E03]">Algorithm:</span>
              <span className="font-mono text-emerald-700 font-semibold">AES-256-GCM</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVaultLocked(!vaultLocked)}
              className="text-xs gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#B34A0E]" />
              {vaultLocked ? "Unlock Vault View" : "Lock Vault View"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                Supabase Row-Level Security
              </h3>
            </div>
            <Badge variant="peach">RLS Enforced</Badge>
          </div>

          <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
            Multi-tenant candidate profiles and resume evidence are strictly partitioned by <code>auth.uid() = user_id</code>. No user or AI subagent can access cross-tenant data.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-[8px] bg-[#FEF5E7]/60 border border-[#6E250A]/10 flex items-center justify-between">
              <span className="font-semibold text-[#2D0E03]">Cloud Database:</span>
              <span className="font-mono text-[11px] text-[#2D0E03]/70">Supabase PostgreSQL</span>
            </div>
            <div className="p-3 rounded-[8px] bg-[#FEF5E7]/60 border border-[#6E250A]/10 flex items-center justify-between">
              <span className="font-semibold text-[#2D0E03]">Approval TTL:</span>
              <span className="font-mono text-emerald-700 font-bold">30 Minutes (Fixed)</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 border border-red-200 bg-red-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display text-lg font-bold text-red-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-700" />
              Hard Memory & Vault Purge (DPDP Act 2023)
            </h4>
            <p className="text-xs text-red-800/80 max-w-xl leading-relaxed">
              Exercise your legal Right to Erasure. Permanently delete all local candidate embeddings, saved jobs, follow-ups, and in-flight approval tokens.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            disabled={purging}
            onClick={handlePurge}
            className="text-xs flex-shrink-0"
          >
            {purging ? "Purging..." : "Hard Purge All Data"}
          </Button>
        </div>

        {purgeStatus && (
          <div className="mt-3 p-2.5 rounded bg-white text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {purgeStatus}
          </div>
        )}
      </Card>
    </div>
  );
}
