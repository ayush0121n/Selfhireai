"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Shield,
  Sparkles,
  CheckCheck,
  Briefcase,
  Rocket,
  FileCheck2,
  X,
} from "lucide-react";
import { Button } from "../ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SearchResult {
  type: "job" | "startup" | "application";
  title: string;
  subtitle: string;
  href: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: string;
  href: string;
  is_read: boolean;
  created_at: string;
}

const QUICK_ROUTES = [
  { label: "Dashboard & Funnel", href: "/dashboard" },
  { label: "Discover Jobs & Startups", href: "/jobs" },
  { label: "Application Tracker (Kanban)", href: "/applications" },
  { label: "ATS Resume Studio", href: "/resumes" },
  { label: "Approval Gate", href: "/approvals" },
  { label: "Evidence Vault", href: "/vault" },
];

export function AppHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // Non-blocking header poll
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/notifications/read-all`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const navigateTo = (href: string) => {
    setPaletteOpen(false);
    setNotifOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  const awaitingSubmitNotif = notifications.find(
    (n) => !n.is_read && (n.title.includes("Action Required") || n.title.includes("Awaiting"))
  );

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#6E250A]/15 sticky top-0 z-30 px-6 flex items-center justify-between">
        {/* Search Bar / Command Palette trigger */}
        <div className="flex items-center gap-3 w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#2D0E03]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search jobs, startups, applications... (Cmd+K)"
              value={searchQuery}
              onFocus={() => setPaletteOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!paletteOpen) setPaletteOpen(true);
              }}
              className="w-full pl-9 pr-12 py-2 text-xs rounded-[10px] bg-[#FEF5E7]/60 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E] transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-white border border-[#6E250A]/20 px-1.5 py-0.5 rounded text-[#2D0E03]/60 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 relative">
          {awaitingSubmitNotif && (
            <Link
              href={awaitingSubmitNotif.href || "/approvals"}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-semibold animate-pulse"
            >
              <span>Portal Open — Confirm Submit</span>
            </Link>
          )}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF5E7] border border-[#6E250A]/15 text-xs text-[#2D0E03]/80">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-[11px]">Human-in-the-Loop Safe</span>
          </div>

          <Link href="/agent">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#B34A0E]" />
              Ask AI Agent
            </Button>
          </Link>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              fetchNotifications();
            }}
            className="relative p-2 rounded-[10px] text-[#2D0E03]/70 hover:bg-[#FEF5E7] hover:text-[#2D0E03] transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B34A0E]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-[14px] border border-[#6E250A]/20 shadow-lg p-3 z-50 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#6E250A]/10">
                <span className="text-xs font-bold text-[#2D0E03]">
                  Notifications ({unreadCount} unread)
                </span>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] text-[#B34A0E] hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#2D0E03]/60 py-4 text-center">
                    All caught up.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => navigateTo(n.href)}
                      className={`w-full text-left p-2.5 rounded-[10px] border transition-colors ${
                        n.is_read
                          ? "bg-[#FEF5E7]/30 border-transparent text-[#2D0E03]/70"
                          : "bg-[#FEF5E7] border-[#B34A0E]/25 text-[#2D0E03]"
                      } hover:border-[#B34A0E]`}
                    >
                      <div className="text-xs font-semibold">{n.title}</div>
                      <div className="text-[11px] text-[#2D0E03]/70 mt-0.5">{n.body}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Command Palette Modal */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#2D0E03]/30 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-[16px] border border-[#6E250A]/20 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#6E250A]/10">
              <Search className="w-4 h-4 text-[#B34A0E]" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, YC/HN startups, applications, or jump to a page..."
                className="flex-1 text-sm text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="p-1 rounded hover:bg-[#FEF5E7] text-[#2D0E03]/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-2">
              {searching && (
                <div className="text-xs text-[#2D0E03]/60 px-2 py-2">Searching workspace...</div>
              )}

              {!searchQuery.trim() && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#2D0E03]/50 px-2">
                    Quick Navigation
                  </div>
                  {QUICK_ROUTES.map((r) => (
                    <button
                      key={r.href}
                      type="button"
                      onClick={() => navigateTo(r.href)}
                      className="w-full text-left px-3 py-2 rounded-[10px] text-xs font-medium text-[#2D0E03] hover:bg-[#FEF5E7] flex items-center justify-between"
                    >
                      <span>{r.label}</span>
                      <span className="font-mono text-[10px] text-[#2D0E03]/50">{r.href}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.trim() && !searching && results.length === 0 && (
                <div className="text-xs text-[#2D0E03]/60 px-2 py-4 text-center">
                  No matching jobs, startups, or applications for "{searchQuery}".
                </div>
              )}

              {results.map((item, idx) => (
                <button
                  key={`${item.type}-${idx}`}
                  type="button"
                  onClick={() => navigateTo(item.href)}
                  className="w-full text-left px-3 py-2.5 rounded-[10px] hover:bg-[#FEF5E7] flex items-center gap-3 transition-colors"
                >
                  {item.type === "startup" ? (
                    <Rocket className="w-4 h-4 text-[#B34A0E] flex-shrink-0" />
                  ) : item.type === "application" ? (
                    <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Briefcase className="w-4 h-4 text-[#B34A0E] flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#2D0E03] truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#2D0E03]/60 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FAD7A0] text-[#2D0E03]">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
