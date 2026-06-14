"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import {
  Loader2,
  Sparkles,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  FileText,
  Building,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface JobPost {
  id: string;
  sourceUrl: string | null;
  createdAt: string;
  extractedJson: {
    role_title?: string;
    company_name?: string;
    location?: string;
    salary_range?: string;
    company_description?: string;
    key_requirements?: string[];
    key_responsibilities?: string[];
  };
}

interface MatchResponse {
  outreachEmailId: string;
  matchScore: number;
  matchedSkills: string[];
  matchedExperiencePoints: string[];
  missingOrWeakAreas: string[];
  recommendedTalkingPoints: string[];
  emailDraft: {
    recipientEmail: string;
    subject: string;
    htmlContent: string;
  };
}

export default function JobDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<JobPost | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Match generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [matchData, setMatchData] = useState<MatchResponse | null>(null);

  const generationMessages = [
    "Summarizing candidate resume details...",
    "Correlating technical capabilities with requirements...",
    "Computing match percentage coefficients...",
    "Compiling critical talking points & recommendations...",
    "Composing personalized outreach draft...",
  ];

  const fetchJobDetails = async () => {
    try {
      setIsLoadingJob(true);
      setError(null);
      const response = await api.get(`/job-post/${id}`);
      setJob(response.data.jobPost);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to retrieve job details. It may have been deleted."
      );
    } finally {
      setIsLoadingJob(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleGenerateOutreach = async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    setError(null);

    const interval = setInterval(() => {
      setGenerationStep((prev) => (prev < generationMessages.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      const response = await api.post("/outreach/generate", {
        jobPostId: id,
      });
      clearInterval(interval);
      setMatchData(response.data);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Match generation error:", err);
      setError(
        err.response?.data?.message ||
          "An unexpected error occurred while generating outreach. Ensure your profile is fully complete."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingJob) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Retrieving job records...</p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-border text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Notice</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!job) return null;

  const { extractedJson } = job;
  const roleTitle = extractedJson.role_title || "Unknown Role";
  const companyName = extractedJson.company_name || "Unknown Company";
  const location = extractedJson.location || "Remote";
  const salaryRange = extractedJson.salary_range || "N/A";
  const companyDesc = extractedJson.company_description || "";
  const requirements = extractedJson.key_requirements || [];
  const responsibilities = extractedJson.key_responsibilities || [];

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        {job.sourceUrl && (
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-primary hover:underline"
          >
            Open Original Post
          </a>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-red-200 text-sm font-semibold animate-pulse-slow">
          {error}
        </div>
      )}

      {isGenerating ? (
        <div className="glass-panel rounded-2xl p-10 border border-border flex flex-col items-center justify-center py-24 text-center animate-pulse-slow">
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
            <div
              className="absolute inset-3 rounded-full border-4 border-muted border-b-cyan-400 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
            ></div>
            <div className="absolute inset-6 flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Analyzing Qualifications Match</h2>
          <p className="text-sm text-primary font-semibold tracking-wider uppercase mb-1">
            {generationMessages[generationStep]}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mt-3">
            Wait a moment as the model weighs requirements against your candidate record and crafts a custom elevator pitch.
          </p>
        </div>
      ) : matchData ? (
        // Match Result view
        <div className="space-y-8">
          {/* Main Scoring Card */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 border border-border flex flex-col md:flex-row items-center gap-8 bg-gradient-premium">
            {/* Score Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke={
                    matchData.matchScore >= 80
                      ? "#10b981"
                      : matchData.matchScore >= 60
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={377}
                  initial={{ strokeDashoffset: 377 }}
                  animate={{ strokeDashoffset: 377 - (377 * matchData.matchScore) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold">{matchData.matchScore}%</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                  Match Score
                </span>
              </div>
            </div>

            {/* Score summary text */}
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-2xl font-black">AI Assessment Ready</h2>
              <p className="text-muted-foreground text-sm max-w-xl">
                The model calculated a match coefficient of {matchData.matchScore}% for your profile
                as a <span className="text-foreground font-semibold">{roleTitle}</span> at{" "}
                <span className="text-foreground font-semibold">{companyName}</span>. A draft letter
                has been stored and is ready for editing.
              </p>
              <div className="flex justify-center md:justify-start gap-4">
                <button
                  onClick={() => setMatchData(null)}
                  className="px-4 py-2 border border-border hover:bg-secondary/40 text-sm font-semibold rounded-xl transition-all"
                >
                  Re-evaluate
                </button>
                <Link
                  href={`/outreach/${matchData.outreachEmailId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all glow-btn"
                >
                  Open Email Editor <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Matched Skills / Strengths */}
            <div className="glass-panel rounded-2xl p-6 border border-border flex flex-col space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Matched Strengths
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {matchData.matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
                {matchData.matchedSkills.length === 0 && (
                  <p className="text-xs text-muted-foreground">No matching keywords parsed.</p>
                )}
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 mt-2 list-disc list-inside">
                {matchData.matchedExperiencePoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Gap Analysis / Missing Skills */}
            <div className="glass-panel rounded-2xl p-6 border border-border flex flex-col space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Gap Analysis
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2.5">
                {matchData.missingOrWeakAreas.map((pt, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></span>
                    <span>{pt}</span>
                  </li>
                ))}
                {matchData.missingOrWeakAreas.length === 0 && (
                  <p className="text-xs text-muted-foreground">No notable skill gaps detected.</p>
                )}
              </ul>
            </div>

            {/* Talking Points */}
            <div className="glass-panel rounded-2xl p-6 border border-border flex flex-col space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" /> Talking Points
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2.5">
                {matchData.recommendedTalkingPoints.map((pt, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                    <span>{pt}</span>
                  </li>
                ))}
                {matchData.recommendedTalkingPoints.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Highlight your general experiences and skills.
                  </p>
                )}
              </ul>
            </div>
          </div>

          {/* Email Preview */}
          <div className="glass-panel rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-card/10 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                Generated Outreach Draft Preview
              </h3>
              <Link
                href={`/outreach/${matchData.outreachEmailId}`}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Go to full editor <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2 text-sm text-muted-foreground border-b border-border/50 pb-3">
                <span className="font-semibold text-foreground">Subject:</span>
                <span>{matchData.emailDraft.subject}</span>
              </div>
              <div
                className="prose prose-invert max-w-none text-sm text-muted-foreground/90 bg-secondary/10 p-4 rounded-xl border border-border/30 h-48 overflow-y-auto font-sans"
                dangerouslySetInnerHTML={{ __html: matchData.emailDraft.htmlContent }}
              />
            </div>
          </div>
        </div>
      ) : (
        // Standard Job Details view
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details (Left/Center) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-border space-y-6">
              {/* Job Summary Header */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{roleTitle}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" /> {companyName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {location}
                    </span>
                    <span>•</span>
                    <span className="text-primary font-medium">Est. {salaryRange}</span>
                  </div>
                </div>
              </div>

              {companyDesc && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    About the Company
                  </h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">{companyDesc}</p>
                </div>
              )}

              {/* Requirements & Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                    Requirements
                  </h3>
                  {requirements.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No structured requirements found.</p>
                  ) : (
                    <ul className="text-xs text-muted-foreground/90 space-y-2 list-disc list-inside">
                      {requirements.map((reqStr, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {reqStr}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                    Responsibilities
                  </h3>
                  {responsibilities.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No structured responsibilities found.
                    </p>
                  ) : (
                    <ul className="text-xs text-muted-foreground/90 space-y-2 list-disc list-inside">
                      {responsibilities.map((respStr, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {respStr}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Callouts (Right Sidebar) */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-border bg-gradient-premium flex flex-col justify-between h-fit space-y-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" /> Outbound AI Match
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Evaluate your saved profile details directly against this job post's requirements.
                  The generator scores keywords, identifies gaps, and formats a customized draft message.
                </p>
              </div>

              <button
                onClick={handleGenerateOutreach}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/35 glow-btn"
              >
                <Sparkles className="h-5 w-5 animate-pulse" /> Evaluate & Draft
              </button>
            </div>

            {/* Original Text Preview */}
            <div className="glass-panel rounded-2xl p-6 border border-border space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Extracted Job Meta Info
              </h3>
              <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>Created At:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>Requirements Count:</span>
                  <span className="font-semibold text-foreground">{requirements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Responsibilities Count:</span>
                  <span className="font-semibold text-foreground">{responsibilities.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
