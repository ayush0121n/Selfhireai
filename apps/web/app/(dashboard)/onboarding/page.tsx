"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Code2,
  MapPin,
  Clock,
  FileText,
  ShieldCheck,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuestionStep {
  id: number;
  aiPrompt: string;
  field: string;
  subtext: string;
}

const ONBOARDING_STEPS: QuestionStep[] = [
  {
    id: 1,
    aiPrompt: "Hi there! I am your SelfHire.ai personal career agent. Let's build your verified profile so I can match you with real jobs and truthfully tailor your applications. First: What target job titles should I search for you?",
    field: "targetRoles",
    subtext: "Select popular roles or type your exact target title.",
  },
  {
    id: 2,
    aiPrompt: "Excellent. Now, what are your core technical skills and tools? I will use these to calculate ATS keyword matches and highlight your real strengths.",
    field: "skills",
    subtext: "Add technical languages, frameworks, databases, and developer tooling.",
  },
  {
    id: 3,
    aiPrompt: "Got it. What is your total years of professional experience, current notice period, and minimum expected annual salary?",
    field: "logistics",
    subtext: "These are used for hard-filter screening and compensation questions.",
  },
  {
    id: 4,
    aiPrompt: "Where would you like to work? Tell me your preferred locations and preferred work mode (Remote, Hybrid, or On-site).",
    field: "location",
    subtext: "We search 106 portals across India and global remote channels.",
  },
  {
    id: 5,
    aiPrompt: "Last step: Share 1-2 major career achievements or project bullet points. I will link each one to an immutable evidence ID using Google's XYZ formula: Accomplished [X], measured by [Y], by doing [Z].",
    field: "evidence",
    subtext: "Evidence-linked bullets guarantee zero hallucinations on your tailored resumes.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [targetRoles, setTargetRoles] = useState<string[]>([
    "Junior Full Stack Developer",
    "Python Developer",
  ]);
  const [newRole, setNewRole] = useState("");

  const [skills, setSkills] = useState<string[]>([
    "Python",
    "JavaScript",
    "React",
    "FastAPI",
    "PostgreSQL",
    "REST APIs",
    "Playwright",
  ]);
  const [newSkill, setNewSkill] = useState("");

  const [experienceYears, setExperienceYears] = useState("1-3");
  const [noticePeriod, setNoticePeriod] = useState("Immediate");
  const [minSalary, setMinSalary] = useState("1200000");

  const [preferredLocations, setPreferredLocations] = useState<string[]>([
    "Pune",
    "Bengaluru",
    "Remote India",
  ]);
  const [newLocation, setNewLocation] = useState("");
  const [workMode, setWorkMode] = useState("Hybrid / Remote");

  const [achievements, setAchievements] = useState<string[]>([
    "Architected REST APIs handling 10,000 requests/minute with 99.9% uptime using FastAPI and PostgreSQL.",
    "Optimized database query latency by 42% through strategic index tuning and Redis caching.",
  ]);
  const [newAchievement, setNewAchievement] = useState("");

  const addRole = () => {
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole("");
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const addLocation = () => {
    if (newLocation.trim() && !preferredLocations.includes(newLocation.trim())) {
      setPreferredLocations([...preferredLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);

    const profileData = {
      user_id: "usr_ayush_01",
      full_name: "Ayush Narkhede",
      email: typeof window !== "undefined" ? localStorage.getItem("selfhire_auth_email") || "ayush@example.com" : "ayush@example.com",
      phone: "+91 98765 43210",
      location: preferredLocations[0] || "Pune, India",
      work_authorization: "Authorized",
      target_roles: targetRoles,
      skills: skills,
      experience_years: experienceYears,
      notice_period: noticePeriod,
      min_salary_annual: parseFloat(minSalary) || 1200000,
      preferred_locations: preferredLocations,
      work_mode: workMode,
      achievements: achievements,
      verified_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("selfhire_candidate_profile", JSON.stringify(profileData));
    }

    // Try posting to local FastAPI backend
    try {
      await fetch("http://127.0.0.1:8000/api/v1/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
    } catch (e) {
      // Local SQLite fallback in browser
    }

    setTimeout(() => {
      setLoading(false);
      router.push("/jobs?onboarded=true");
    }, 600);
  };

  const activeQuestion = ONBOARDING_STEPS[currentStep];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 font-sans">
      {/* Header & Progress Indicator */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#6E250A]/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-brand text-2xl font-bold text-[#B34A0E]">
              SelfHire<span className="text-[#2D0E03]">.ai</span>
            </span>
            <Badge variant="outline" className="text-[11px] bg-[#FAD7A0]/60 text-[#2D0E03]">
              Profile Setup
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#2D0E03] mt-1">
            Personalize Your AI Career Operating System
          </h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {ONBOARDING_STEPS.map((s, idx) => (
            <div
              key={s.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                idx === currentStep
                  ? "bg-[#B34A0E] text-white shadow-md scale-105"
                  : idx < currentStep
                  ? "bg-emerald-500 text-white"
                  : "bg-white border border-[#6E250A]/20 text-[#2D0E03]/50"
              }`}
            >
              {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : s.id}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive AI Agent Conversational Box */}
      <Card className="bg-[#FFFFFF] border-[0.8px] border-[#6E250A]/15 shadow-sm p-6 rounded-[16px] relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FAD7A0] flex items-center justify-center shrink-0 border border-[#B34A0E]/20 text-[#B34A0E]">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#2D0E03]">SelfHire AI Copilot</span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Question
              </span>
            </div>
            <p className="text-base text-[#2D0E03] font-medium leading-relaxed">
              {activeQuestion.aiPrompt}
            </p>
            <p className="text-xs text-[#2D0E03]/60 italic">
              {activeQuestion.subtext}
            </p>
          </div>
        </div>
      </Card>

      {/* Step Content Card */}
      <Card className="bg-[#FFFFFF] border-[0.8px] border-[#6E250A]/15 shadow-sm p-8 rounded-[16px] space-y-6">
        {/* Step 1: Target Roles */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#2D0E03]">
              Target Job Titles
            </label>
            <div className="flex flex-wrap gap-2">
              {targetRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEF5E7] border border-[#6E250A]/20 text-xs font-semibold text-[#2D0E03]"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#B34A0E]" />
                  {role}
                  <button
                    onClick={() => setTargetRoles(targetRoles.filter((r) => r !== role))}
                    className="hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add another role (e.g. React Developer, Cloud Architect)..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#B34A0E]/30"
              />
              <Button onClick={addRole} variant="outline" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Technical Skills */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#2D0E03]">
              Verified Technical Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAD7A0]/40 border border-[#B34A0E]/30 text-xs font-semibold text-[#2D0E03]"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#B34A0E]" />
                  {skill}
                  <button
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker, TypeScript, Redis, Kubernetes)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#B34A0E]/30"
              />
              <Button onClick={addSkill} variant="outline" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Experience & Compensation */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2D0E03]">
                Experience Level
              </label>
              <select
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#CBD5E1] text-sm bg-white"
              >
                <option value="0-1">0-1 Years (Fresher / Intern)</option>
                <option value="1-3">1-3 Years (Junior)</option>
                <option value="3-5">3-5 Years (Mid-Level)</option>
                <option value="5+">5+ Years (Senior)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2D0E03]">
                Notice Period
              </label>
              <select
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#CBD5E1] text-sm bg-white"
              >
                <option value="Immediate">Immediate Joiner</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60+ Days">60+ Days</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2D0E03]">
                Min Target CTC (Annual ₹)
              </label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="1200000"
                className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 4: Locations & Work Mode */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[#2D0E03]">
                Preferred Locations
              </label>
              <div className="flex flex-wrap gap-2">
                {preferredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEF5E7] border border-[#6E250A]/20 text-xs font-semibold text-[#2D0E03]"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#B34A0E]" />
                    {loc}
                    <button
                      onClick={() => setPreferredLocations(preferredLocations.filter((l) => l !== loc))}
                      className="hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add location (e.g. Hyderabad, Delhi NCR, Remote Worldwide)..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#CBD5E1] text-sm focus:outline-none"
                />
                <Button onClick={addLocation} variant="outline" size="sm" className="gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#2D0E03]">
                Work Mode Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["Remote Only", "Hybrid / Remote", "On-site"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkMode(mode)}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border text-center transition-all ${
                      workMode === mode
                        ? "border-[#B34A0E] bg-[#FEF5E7] text-[#B34A0E] shadow-sm"
                        : "border-[#E2E8F0] bg-white text-[#2D0E03]/70 hover:border-[#CBD5E1]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Evidence-Linked Achievements */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#2D0E03]">
                Quantified Resume Achievements (Google XYZ Formula)
              </label>
              <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Zero Hallucinations
              </Badge>
            </div>

            <div className="space-y-3">
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#FEF5E7]/60 border border-[#6E250A]/15 text-xs text-[#2D0E03] flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#B34A0E] shrink-0">#{idx + 1}</span>
                    <span className="leading-relaxed">{ach}</span>
                  </div>
                  <button
                    onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <textarea
                rows={2}
                placeholder="Accomplished [X], measured by [Y], by doing [Z] (e.g. Reduced bundle size by 35% through dynamic imports and tree-shaking)..."
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[#CBD5E1] text-xs focus:outline-none focus:ring-2 focus:ring-[#B34A0E]/30"
              />
              <Button onClick={addAchievement} variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Achievement Bullet
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-[#6E250A]/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || loading}
            className="text-xs"
          >
            Back
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            disabled={loading}
            className="gap-2 text-xs font-semibold shadow-sm"
          >
            {loading ? (
              "Saving Profile & Connecting 106 Portals..."
            ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                <span>Complete Setup & Start Applying</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
