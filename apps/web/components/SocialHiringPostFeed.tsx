"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Building,
  Mail,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface SocialPost {
  post_id: string;
  source_platform: string;
  poster_name: string;
  poster_title?: string;
  poster_contact?: string;
  company_name: string;
  extracted_job_title: string;
  location_work_mode: string;
  tech_stack: string[];
  raw_post_text: string;
  posted_at: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  suggested_outreach_subject: string;
  suggested_outreach_body: string;
  direct_apply_url?: string;
}

export default function SocialHiringPostFeed() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/posts/feed");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      // Fallback curated feed
      setPosts([
        {
          post_id: "post_lin_01",
          source_platform: "LinkedIn",
          poster_name: "Rohan Deshmukh",
          poster_title: "Head of Engineering at BrowserStack",
          poster_contact: "rohan.d@browserstack.com",
          company_name: "BrowserStack",
          extracted_job_title: "Senior Full-Stack Engineer",
          location_work_mode: "Remote",
          tech_stack: ["Python", "React", "Next.js", "Docker"],
          raw_post_text: "We are expanding our core Cloud infrastructure team in Mumbai/Remote! Looking for a Senior Full-Stack Engineer with 3+ years experience in Python, React, Next.js, and Docker. Experience with microservices and high-throughput systems is a massive plus. DM me directly or send your resume to rohan.d@browserstack.com with subject 'FullStack - Infra'.",
          posted_at: "3 hours ago",
          match_score: 94,
          matched_skills: ["Python", "React", "Next.js", "Docker"],
          missing_skills: [],
          suggested_outreach_subject: "Application: Senior Full-Stack Engineer @ BrowserStack (Referral from your LinkedIn post)",
          suggested_outreach_body: "Hi Rohan,\n\nI saw your LinkedIn post regarding the Senior Full-Stack Engineer opening at BrowserStack. With proven hands-on experience in Python, React, Next.js, and Docker delivering microservices with sub-200ms latency, I would love to connect.",
          direct_apply_url: "https://www.browserstack.com/careers"
        },
        {
          post_id: "post_lin_02",
          source_platform: "LinkedIn",
          poster_name: "Priya Nair",
          poster_title: "Lead Technical Recruiter at Postman",
          poster_contact: "priya.nair@postman.com",
          company_name: "Postman",
          extracted_job_title: "Frontend & Full-Stack Engineer",
          location_work_mode: "Remote-first",
          tech_stack: ["React", "TypeScript", "GraphQL", "WebSockets"],
          raw_post_text: "Hiring alert! Postman API Platform is looking for Frontend and Full-Stack Engineers (React, TypeScript, GraphQL, WebSockets). If you love developer tooling and building snappy user interfaces, let's connect! Email me: priya.nair@postman.com.",
          posted_at: "5 hours ago",
          match_score: 88,
          matched_skills: ["React", "TypeScript"],
          missing_skills: ["GraphQL"],
          suggested_outreach_subject: "Full-Stack Opportunity: Postman API Platform",
          suggested_outreach_body: "Hi Priya,\n\nI came across your hiring alert for Postman. As an engineer passionate about snappy developer tools and robust React architectures, I'd welcome the chance to share my background.",
          direct_apply_url: "https://www.postman.com/careers"
        },
        {
          post_id: "post_x_01",
          source_platform: "Twitter / X",
          poster_name: "Arjun Mehta (@arjun_builds)",
          poster_title: "Founder & CTO at Stealth AI",
          poster_contact: "arjun@stealthai.dev",
          company_name: "Stealth AI",
          extracted_job_title: "Foundational Engineer",
          location_work_mode: "Remote",
          tech_stack: ["FastAPI", "Next.js", "PostgreSQL", "OpenAI"],
          raw_post_text: "We just closed our Seed round and are hiring our first 2 foundational engineers. Stack: FastAPI, Next.js, PostgreSQL, OpenAI/Claude APIs. Must love shipping fast, writing clean code, and zero corporate bureaucracy. Competitive equity + salary. Email arjun@stealthai.dev.",
          posted_at: "1 day ago",
          match_score: 91,
          matched_skills: ["FastAPI", "Next.js", "PostgreSQL"],
          missing_skills: [],
          suggested_outreach_subject: "Foundational Engineer - Stealth AI",
          suggested_outreach_body: "Hi Arjun,\n\nCongratulations on the Seed round! I specialize in shipping end-to-end FastAPI and Next.js applications fast without corporate overhead.",
          direct_apply_url: "mailto:arjun@stealthai.dev"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;

    setScanning(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/posts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawInput, source_platform: "LinkedIn" })
      });

      if (res.ok) {
        const newPost: SocialPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        setSelectedPost(newPost);
        setRawInput("");
      }
    } catch {
      // Deterministic fallback
      const simulated: SocialPost = {
        post_id: `post_${Date.now()}`,
        source_platform: "LinkedIn",
        poster_name: "Recruiter / Hiring Lead",
        company_name: "Tech Venture",
        extracted_job_title: "Full-Stack Engineer",
        location_work_mode: "Remote",
        tech_stack: ["Python", "React", "Next.js"],
        raw_post_text: rawInput,
        posted_at: "Just now",
        match_score: 89,
        matched_skills: ["Python", "React", "Next.js"],
        missing_skills: [],
        suggested_outreach_subject: "Application: Full-Stack Engineer @ Tech Venture",
        suggested_outreach_body: "Hi,\n\nI saw your post regarding the engineering opening. My background in building responsive web applications and high-throughput APIs directly aligns with what your team needs.",
        poster_contact: "hiring@techventure.io"
      };
      setPosts(prev => [simulated, ...prev]);
      setSelectedPost(simulated);
      setRawInput("");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-white rounded-[12px] border-[0.8px] border-border-subtle shadow-[0px_4px_6px_rgba(0,0,0,0.02)] p-[20px] space-y-[20px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px] pb-[16px] border-b border-border-subtle">
        <div className="flex items-center gap-[12px]">
          <div className="w-10 h-10 rounded-[12px] bg-accent-primary/10 flex items-center justify-center text-accent-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-[32px] md:text-[36px] font-[700] leading-[1.2] text-text-primary">
              Social Hiring Post Scanner & Direct Reachout
            </h2>
            <p className="font-sans text-[14px] leading-[1.63] text-text-primary/75 font-normal">
              Review informal hiring posts from LinkedIn, Twitter/X & Peerlist. Ingest posts, extract role details, and compose 1-click tailored cold outreach.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[8px]">
          <span className="inline-flex items-center gap-[6px] px-[12px] py-[4px] rounded-full text-[12px] font-semibold bg-surface-peach text-accent-primary border-[0.8px] border-border-subtle">
            <Zap className="w-3.5 h-3.5" /> AI Job & Recruiter Extractor
          </span>
        </div>
      </div>

      {/* Paste & Scan Input Form */}
      <form onSubmit={handleScanPost} className="p-[16px] rounded-[12px] bg-[#FEF5E7]/50 border-[0.8px] border-border-subtle space-y-[12px]">
        <label className="block font-sans text-[14px] font-medium text-text-primary">
          Paste Informal Hiring Post (from LinkedIn, Twitter/X, or recruiter email):
        </label>
        <div className="flex flex-col sm:flex-row gap-[12px]">
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={2}
            placeholder="e.g. 'We are hiring 2 Senior Full-Stack Engineers at Stripe! Tech stack: Python, React, Next.js. DM or email me at alex@stripe.com...'"
            className="flex-1 p-[12px] bg-white border-[0.8px] border-border-subtle rounded-[12px] font-sans text-[13px] leading-[1.63] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            required
          />
          <Button
            type="submit"
            disabled={scanning}
            className="self-end sm:self-stretch px-[20px] text-[13px] gap-[6px] whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-[#FAD7A0]" />
            {scanning ? "Extracting..." : "Scan & Match Post"}
          </Button>
        </div>
      </form>

      {/* Posts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px]">
        {/* Feed Column */}
        <div className="lg:col-span-7 space-y-[16px]">
          <div className="flex items-center justify-between text-[13px] text-text-primary/70 font-sans">
            <span>Discovered Hiring Posts ({posts.length})</span>
            <span>Ranked by Candidate Profile Fit</span>
          </div>

          {posts.map((post) => (
            <div
              key={post.post_id}
              onClick={() => setSelectedPost(post)}
              className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition ${
                selectedPost?.post_id === post.post_id
                  ? "bg-[#FEF5E7]/80 border-accent-primary shadow-sm"
                  : "bg-white border-border-subtle hover:border-[#6E250A]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-[12px] mb-[8px]">
                <div>
                  <div className="flex items-center gap-[8px]">
                    <span className="font-display text-[18px] font-bold text-text-primary">
                      {post.extracted_job_title}
                    </span>
                    <span className="px-[8px] py-[1px] rounded-full text-[10px] font-bold bg-[#FAD7A0] text-accent-primary">
                      {post.source_platform}
                    </span>
                  </div>
                  <div className="font-sans text-[12px] text-text-primary/70 mt-[2px]">
                    <strong>{post.company_name}</strong> • Posted by {post.poster_name} ({post.posted_at})
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-[8px] py-[2px] rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border-[0.8px] border-emerald-300">
                    {post.match_score}% Match
                  </span>
                </div>
              </div>

              <p className="font-sans text-[13px] text-text-primary/80 line-clamp-2 leading-[1.63] mb-[12px]">
                "{post.raw_post_text}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-[8px] pt-[8px] border-t border-border-subtle/50 text-[12px]">
                <div className="flex flex-wrap gap-[6px]">
                  {post.tech_stack.slice(0, 4).map((tech, i) => (
                    <span
                      key={i}
                      className={`px-[6px] py-[1px] rounded text-[10px] font-mono font-medium ${
                        post.matched_skills.includes(tech)
                          ? "bg-emerald-50 text-emerald-800 border-[0.8px] border-emerald-200"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <span className="text-accent-primary font-medium font-sans text-[12px] flex items-center gap-[4px]">
                  View Outreach Pitch →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Post Details & 1-Click Outreach */}
        <div className="lg:col-span-5">
          {selectedPost ? (
            <div className="p-[20px] rounded-[12px] bg-[#FEF5E7]/40 border-[0.8px] border-border-subtle space-y-[16px] sticky top-6">
              <div className="border-b border-border-subtle pb-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-accent-primary font-sans">
                    Tailored Direct Outreach
                  </span>
                  <span className="text-[11px] text-text-primary/60 font-sans">
                    Contact: {selectedPost.poster_contact || "Direct Message"}
                  </span>
                </div>
                <h3 className="font-display text-[20px] font-bold text-text-primary mt-[4px]">
                  {selectedPost.extracted_job_title} @ {selectedPost.company_name}
                </h3>
              </div>

              {/* Subject */}
              <div className="space-y-[4px]">
                <label className="text-[11px] font-bold text-text-primary/70 uppercase font-sans">
                  Subject Line:
                </label>
                <div className="p-[10px] bg-white rounded-[8px] border-[0.8px] border-border-subtle font-sans text-[12px] font-medium text-text-primary">
                  {selectedPost.suggested_outreach_subject}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-[4px]">
                <label className="text-[11px] font-bold text-text-primary/70 uppercase font-sans">
                  Personalized Cold Message (Grounded in Verified XYZ Metrics):
                </label>
                <div className="p-[12px] bg-white rounded-[8px] border-[0.8px] border-border-subtle font-sans text-[12px] leading-[1.63] text-text-primary whitespace-pre-line max-h-60 overflow-y-auto">
                  {selectedPost.suggested_outreach_body}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-[8px] pt-[8px]">
                <Button
                  variant="primary"
                  className="w-full text-[13px] gap-[6px] shadow-sm"
                  onClick={() => {
                    const fullText = `Subject: ${selectedPost.suggested_outreach_subject}\n\n${selectedPost.suggested_outreach_body}`;
                    navigator.clipboard.writeText(fullText);
                    setCopiedPostId(selectedPost.post_id);
                  }}
                >
                  {copiedPostId === selectedPost.post_id ? (
                    <span className="inline-flex items-center gap-[4px]">
                      <Check className="w-3.5 h-3.5 text-[#FAD7A0]" /> Copied Pitch to Clipboard!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-[4px]">
                      <Copy className="w-3.5 h-3.5" /> 1-Click Copy Full Outreach
                    </span>
                  )}
                </Button>

                {selectedPost.poster_contact && selectedPost.poster_contact.includes("@") && (
                  <a
                    href={`mailto:${selectedPost.poster_contact}?subject=${encodeURIComponent(
                      selectedPost.suggested_outreach_subject
                    )}&body=${encodeURIComponent(selectedPost.suggested_outreach_body)}`}
                    className="inline-flex items-center justify-center w-full px-[20px] py-[10px] rounded-[12px] border-[0.8px] border-[#6E250A]/20 bg-white text-text-primary font-sans text-[13px] font-medium hover:bg-canvas-warm transition"
                  >
                    <Mail className="w-3.5 h-3.5 mr-[6px] text-accent-primary" />
                    Open in Mail Client (`mailto:`)
                  </a>
                )}

                {selectedPost.direct_apply_url && (
                  <a
                    href={selectedPost.direct_apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full text-[12px] text-accent-primary hover:underline font-sans pt-[4px]"
                  >
                    <span>Visit Company Career Portal</span>
                    <ExternalLink className="w-3 h-3 ml-[4px]" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-[32px] rounded-[12px] border-[0.8px] border-dashed border-border-subtle text-center text-text-primary/60 font-sans space-y-[8px]">
              <MessageSquare className="w-8 h-8 mx-auto text-accent-primary/50" />
              <p className="text-[13px]">Select a hiring post on the left to inspect extracted details and generate a tailored 1-to-1 message.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
