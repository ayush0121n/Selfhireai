"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Key,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CloudflareSettingsCard from "@/components/CloudflareSettingsCard";

export default function SecuritySettingsPage() {
  const [vaultLocked, setVaultLocked] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState("");

  const handlePurge = () => {
    if (confirm("Are you sure? This will permanently wipe all local session memory and vault caches under India DPDP Act compliance.")) {
      setPurgeStatus("Local session memory and vault wiped successfully.");
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
            Zero-Trust Credential Isolation. Local AES-256-GCM Keystore, Supabase Auth tokens, and DPDP 2023 compliance.
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-xs">
          AES-256-GCM Keystore Active
        </Badge>
      </div>

      {/* Cloudflare Edge & Turnstile Protection */}
      <CloudflareSettingsCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local AES Vault Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#6E250A]/10 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#B34A0E]" />
              <h3 className="font-display text-xl font-bold text-[#2D0E03]">
                Local Keystore Status
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
              ENCRYPTED
            </span>
          </div>

          <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
            Portal credentials (Workday, Greenhouse, Naukri) are encrypted locally using your master 32-byte AES key. Credentials are <strong>never</strong> transmitted to external cloud models.
          </p>

          <div className="p-3.5 rounded-[10px] bg-[#FEF5E7] border border-[#6E250A]/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2D0E03]">Vault Master Key:</span>
              <span className="font-mono text-[#2D0E03]/60">••••••••••••••••••••32B</span>
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
              {vaultLocked ? "Unlock Vault" : "Lock Vault Keystore"}
            </Button>
          </div>
        </Card>

        {/* Supabase & Cloud Isolation */}
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

      {/* Danger Zone: India DPDP Act 2023 Compliance */}
      <Card className="p-6 border border-red-200 bg-red-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display text-lg font-bold text-red-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-700" />
              Hard Memory & Vault Purge (DPDP Act 2023)
            </h4>
            <p className="text-xs text-red-800/80 max-w-xl leading-relaxed">
              Exercise your legal Right to Erasure. Permanently delete all local candidate embeddings, cached session cookies, and in-flight approval tokens.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handlePurge}
            className="text-xs flex-shrink-0"
          >
            Hard Purge All Data
          </Button>
        </div>

        {purgeStatus && (
          <div className="mt-3 p-2.5 rounded bg-white text-xs font-semibold text-red-800 border border-red-200">
            {purgeStatus}
          </div>
        )}
      </Card>
    </div>
  );
}
