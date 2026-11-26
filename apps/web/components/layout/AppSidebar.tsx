"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Search,
  Sparkles,
  Bookmark,
  FileText,
  FileCheck2,
  Send,
  Users,
  Mail,
  MessageSquare,
  History,
  GraduationCap,
  TrendingUp,
  BrainCircuit,
  Puzzle,
  Settings,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Globe,
  LogOut,
} from "lucide-react";
import { cn } from "../ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Evidence Vault", href: "/vault", icon: ShieldCheck, badge: "Verified" },
      { name: "Discover Jobs", href: "/jobs", icon: Search },
      { name: "ATS Resume Studio", href: "/resumes", icon: FileText },
      { name: "Approval Gate", href: "/approvals", icon: FileCheck2, badge: "Gate" },
    ],
  },
  {
    title: "APPLICATIONS & WORKFLOW",
    items: [
      { name: "Application Tracker", href: "/applications", icon: FileCheck2 },
      { name: "AI Agent", href: "/agent", icon: Bot, badge: "Live" },
      { name: "Auto Apply", href: "/auto-apply", icon: Send, badge: "Safe" },
      { name: "Recommended Jobs", href: "/matches", icon: Sparkles },
      { name: "Saved Jobs", href: "/saved-jobs", icon: Bookmark },
    ],
  },
  {
    title: "CONNECTIONS",
    items: [
      { name: "Connected Portals", href: "/portals", icon: Globe },
      { name: "Hiring Posts Feed", href: "/hiring-posts", icon: MessageSquare, badge: "Live" },
      { name: "Recruiter Discovery", href: "/outreach", icon: Users },
      { name: "Cold Email & Composer", href: "/outreach/email", icon: Mail },
      { name: "Follow-ups", href: "/outreach/follow-ups", icon: History },
    ],
  },
  {
    title: "CAREER INTELLIGENCE",
    items: [
      { name: "Interview Prep", href: "/interviews", icon: GraduationCap },
      { name: "Market Insights", href: "/career-insights", icon: TrendingUp },
      { name: "Skills Assessment", href: "/skills", icon: BrainCircuit },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Profile & Identity", href: "/settings/profile", icon: Settings },
      { name: "Chrome Extension", href: "/extension", icon: Puzzle },
      { name: "Admin CRM", href: "/admin", icon: Building2, badge: "Admin" },
      { name: "Settings & Security", href: "/settings/security", icon: ShieldCheck },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-[#6E250A]/15 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-[#6E250A]/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <span className="font-brand text-2xl tracking-tight text-[#B34A0E]">
            SelfHire<span className="text-[#2D0E03]">.ai</span>
          </span>
          <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#FAD7A0] text-[#2D0E03] font-bold">
            OS
          </span>
        </Link>
      </div>

      {/* Live Agent Status Widget */}
      <div className="mx-4 my-3 p-3 rounded-[12px] bg-[#FEF5E7] border border-[#6E250A]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-[#2D0E03]">AI Autonomous</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
          Ready
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-2 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="px-3 text-[10px] font-bold tracking-wider text-[#2D0E03]/50 uppercase font-sans">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-medium transition-all",
                      isActive
                        ? "bg-[#B34A0E] text-white shadow-sm font-semibold"
                        : "text-[#2D0E03]/80 hover:bg-[#FEF5E7] hover:text-[#2D0E03]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#B34A0E]")} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.2 rounded font-semibold",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#FAD7A0] text-[#2D0E03]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile Pill */}
      <div className="p-4 border-t border-[#6E250A]/10 bg-[#FEF5E7]/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#B34A0E] text-white flex items-center justify-center font-bold text-xs">
            AY
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-[#2D0E03]">Ayush</div>
            <div className="text-[10px] text-[#2D0E03]/60">Candidate (Pro)</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings/security"
            className="p-1.5 text-[#2D0E03]/60 hover:text-[#B34A0E] transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("selfhire_auth_role");
              localStorage.removeItem("selfhire_auth_email");
              document.cookie = "selfhire_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              window.location.href = "/login";
            }}
            className="p-1.5 text-[#2D0E03]/60 hover:text-red-600 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
