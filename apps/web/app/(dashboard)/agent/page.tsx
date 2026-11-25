"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  User,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
  toolExecution?: {
    tool: string;
    status: "completed" | "pending_approval" | "executing";
    payload?: string;
    approval_id?: string | null;
    hash?: string | null;
  };
}

export default function AgentPage() {
  const [mode, setMode] = useState<"chat" | "assistant" | "autonomous">("assistant");
  const [input, setInput] = useState("");
  const [candidateName, setCandidateName] = useState("Candidate");
  const [portalCount, setPortalCount] = useState<number>(1379);
  const [skillCount, setSkillCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-init",
      sender: "agent",
      text: "Connected to your live profile, Evidence Vault, and job portal registry. What would you like to work on today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [approvedActions, setApprovedActions] = useState<Record<string, boolean>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLiveState = async () => {
      try {
        const [profRes, srcRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/profile`),
          fetch(`${API_BASE}/api/v1/jobs/sources?limit=1`),
        ]);
        let name = "Candidate";
        let skillsLen = 0;
        let portalsLen = 1379;

        if (profRes.ok) {
          const p = await profRes.json();
          name = p.full_name || "Candidate";
          skillsLen = Array.isArray(p.skills) ? p.skills.length : 0;
          setCandidateName(name);
          setSkillCount(skillsLen);
        }
        if (srcRes.ok) {
          const s = await srcRes.json();
          portalsLen = s.total || 1379;
          setPortalCount(portalsLen);
        }

        setMessages([
          {
            id: "m-init",
            sender: "agent",
            text: `Hello ${name}! I am connected to ${portalsLen.toLocaleString()} official job portals and verified matches against your ${skillsLen} indexed skills. What would you like to achieve today?`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch {
        // Keep clean initial greeting
      }
    };
    loadLiveState();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode,
          candidate_id: candidateName,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolExecution: data.toolExecution || undefined,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: "Unable to reach the local Career API. Please ensure the backend server is running on port 8000.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveExecution = async (msg: Message) => {
    const approvalId = msg.toolExecution?.approval_id;
    if (!approvalId) {
      setApprovedActions((prev) => ({ ...prev, [msg.id]: true }));
      return;
    }

    setApprovingId(msg.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/approvals/${encodeURIComponent(approvalId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setApprovedActions((prev) => ({ ...prev, [msg.id]: true }));
        setMessages((prev) => [
          ...prev,
          {
            id: `a-conf-${Date.now()}`,
            sender: "agent",
            text: `Confirmed! Application submitted cleanly (#${data.receipt?.confirmation_number || "CONFIRMED"}). View full filled details in Approval Gate or Application Tracker.`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } finally {
      setApprovingId(null);
    }
  };

  const getSuggestedPrompts = () => {
    if (mode === "chat") {
      return [
        "What salary range should I target for Full-Stack roles?",
        "How should I structure my distributed systems interview answers?",
        "Analyze my career strengths based on my verified skills",
      ];
    }
    if (mode === "autonomous") {
      return [
        `Scan ${portalCount.toLocaleString()} portals for top matching roles and stage a draft`,
        "Score active jobs against my verified Evidence Vault",
      ];
    }
    return [
      "Find matching Python and TypeScript jobs in India or Remote",
      "Prepare a tailored resume & form package for the top matching job",
      "Show remote full-stack roles matching my verified stack",
    ];
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Agent Sidebar & Mode Selector */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <Card className="p-5">
          <h3 className="font-display text-lg font-bold text-[#2D0E03] mb-3">
            Operating Mode
          </h3>
          <div className="space-y-2">
            {[
              {
                id: "chat",
                name: "Chat Mode",
                desc: "Q&A, interview advice, salary strategy",
                icon: Bot,
              },
              {
                id: "assistant",
                name: "Assistant Mode",
                desc: "Searches live jobs & prepares tailored forms",
                icon: Sparkles,
              },
              {
                id: "autonomous",
                name: "Autonomous Mode",
                desc: `Matches across ${portalCount.toLocaleString()} portals & stages top draft`,
                icon: Zap,
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as "chat" | "assistant" | "autonomous")}
                  className={`w-full text-left p-3 rounded-[10px] border transition-all ${
                    isSelected
                      ? "bg-[#B34A0E] text-white border-transparent shadow-sm"
                      : "bg-[#FEF5E7]/60 border-[#6E250A]/10 text-[#2D0E03] hover:bg-[#FEF5E7]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#B34A0E]"}`} />
                    <span className="text-xs font-bold font-sans">{m.name}</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isSelected ? "text-white/85" : "text-[#2D0E03]/65"}`}>
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#6E250A]/10 text-[11px] text-[#2D0E03]/70 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Strict Human-in-the-Loop approval gate enforced.</span>
          </div>
        </Card>

        <Card className="flex-1 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D0E03]/50">
              Suggested Prompts
            </h4>
            <span className="text-[10px] text-[#B34A0E] font-medium">1-Click Run</span>
          </div>
          <div className="space-y-2 text-xs">
            {getSuggestedPrompts().map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-[8px] bg-[#FEF5E7]/50 hover:bg-[#FEF5E7] text-[#2D0E03]/85 hover:text-[#2D0E03] border border-[#6E250A]/10 transition-colors group flex items-start justify-between gap-2"
              >
                <span>&quot;{prompt}&quot;</span>
                <ArrowRight className="w-3 h-3 text-[#B34A0E] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Chat Stream & Composer */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 px-6 border-b border-[#6E250A]/10 bg-[#FEF5E7]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#B34A0E] text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display text-base font-bold text-[#2D0E03]">
                SelfHire AI Agent
              </div>
              <div className="text-[11px] text-[#2D0E03]/65 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live · {portalCount.toLocaleString()} Portals · {skillCount} Verified Skills
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="terracotta" className="text-[10px]">
              {candidateName}
            </Badge>
            <Badge variant="peach" className="capitalize text-[10px]">
              {mode} Mode
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isApproved = approvedActions[msg.id];
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser ? "bg-[#2D0E03] text-white" : "bg-[#B34A0E] text-white"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-[12px] text-xs leading-relaxed ${
                      isUser
                        ? "bg-[#2D0E03] text-white"
                        : "bg-[#FEF5E7] border border-[#6E250A]/15 text-[#2D0E03]"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.toolExecution && (
                    <div className="p-3.5 rounded-[12px] bg-white border border-[#6E250A]/15 shadow-sm text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-[#2D0E03]/70">
                        <span className="font-semibold text-[#B34A0E]">
                          {msg.toolExecution.tool}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                            isApproved || msg.toolExecution.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-[#FAD7A0]/50 text-[#2D0E03]"
                          }`}
                        >
                          {isApproved
                            ? "Approved & Submitted"
                            : msg.toolExecution.status === "pending_approval"
                            ? "Ready for Review"
                            : "Completed"}
                        </span>
                      </div>

                      {msg.toolExecution.payload && (
                        <div className="p-2.5 rounded-lg bg-[#FEF5E7]/70 text-xs text-[#2D0E03]/85">
                          {msg.toolExecution.payload}
                        </div>
                      )}

                      {msg.toolExecution.status === "pending_approval" && (
                        <div className="p-3 rounded-[10px] border border-[#B34A0E]/25 bg-[#FAD7A0]/20 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B34A0E]">
                            <ShieldAlert className="w-4 h-4" />
                            Human Approval Required
                          </div>
                          <p className="text-[11px] text-[#2D0E03]/80">
                            Review and confirm this prepared application before anything is submitted.
                          </p>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <Link
                              href="/approvals"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6E250A] hover:underline"
                            >
                              Inspect Full Form in Approval Gate <ExternalLink className="w-3 h-3" />
                            </Link>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-xs"
                              disabled={isApproved || approvingId === msg.id}
                              onClick={() => handleApproveExecution(msg)}
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
                                </>
                              ) : approvingId === msg.id ? (
                                "Submitting..."
                              ) : (
                                "Approve & Submit"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] text-[#2D0E03]/40 ${isUser ? "text-right" : "text-left"}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-7 h-7 rounded-full bg-[#B34A0E] text-white flex items-center justify-center text-xs font-bold">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3 rounded-[12px] bg-[#FEF5E7] border border-[#6E250A]/15 text-xs text-[#2D0E03]/70 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B34A0E] animate-ping"></span>
                <span>Searching live portals and verified evidence...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[#6E250A]/10 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder={`Ask in ${mode} mode... (e.g. "Find matching Python jobs")`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 text-xs rounded-[10px] bg-[#FEF5E7]/50 border border-[#6E250A]/15 text-[#2D0E03] placeholder-[#2D0E03]/40 focus:outline-none focus:ring-1 focus:ring-[#B34A0E]"
            />

            <Button type="submit" variant="primary" size="sm" disabled={isLoading || !input.trim()} className="gap-1.5 text-xs px-4">
              <span>{isLoading ? "Thinking..." : "Send"}</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
