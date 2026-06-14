"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import {
  FileText,
  Mail,
  Plus,
  ArrowRight,
  ExternalLink,
  Loader2,
  Calendar,
  Send,
  UserCheck,
  FileSearch,
} from "lucide-react";

interface JobPost {
  id: string;
  sourceUrl: string | null;
  createdAt: string;
  extractedJson: {
    role_title?: string;
    company_name?: string;
    location?: string;
  };
}

interface OutreachEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  status: "draft" | "sent" | "failed";
  createdAt: string;
  sentAt: string | null;
  jobPost: JobPost;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [history, setHistory] = useState<OutreachEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, outreachRes, profileRes] = await Promise.all([
        api.get("/job-post"),
        api.get("/outreach/history"),
        api.get("/profile").catch(() => null), // Catch 404 gracefully
      ]);

      setJobPosts(jobsRes.data.jobPosts || []);
      setHistory(outreachRes.data.history || []);
      if (profileRes && profileRes.data?.profile) {
        setProfileExists(true);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalJobs = jobPosts.length;
  const emailsSent = history.filter((h) => h.status === "sent").length;
  const activeDrafts = history.filter((h) => h.status === "draft").length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          Gathering dashboard insights...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Welcome back, <span className="font-semibold text-foreground">{user?.fullName}</span>.
            Let's customize your next career touchpoint.
          </p>
        </div>
        <div className="flex gap-3">
          {!profileExists && (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/40 text-yellow-300 text-sm font-semibold rounded-xl transition-all"
            >
              <UserCheck className="h-4 w-4" />
              Complete Profile
            </Link>
          )}
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all glow-btn"
          >
            <Plus className="h-4 w-4" />
            New Outreach
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Jobs Parsed
            </p>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileSearch className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-4">{totalJobs}</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Emails Sent
            </p>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-4">{emailsSent}</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Drafts Pending
            </p>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold mt-4">{activeDrafts}</p>
        </div>
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Parsed Jobs */}
        <div className="glass-panel rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card/10">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Recent Parsed Jobs
            </h2>
            <Link
              href="/jobs/new"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Add new <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-start">
            {jobPosts.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center justify-center my-auto">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">
                  No job posts extracted yet.
                </p>
                <Link
                  href="/jobs/new"
                  className="mt-4 inline-flex items-center text-xs font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-all"
                >
                  Parse your first job
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {jobPosts.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {job.extractedJson?.role_title || "Unknown Role"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {job.extractedJson?.company_name || "Unknown Company"} •{" "}
                        {job.extractedJson?.location || "Remote"}
                      </p>
                      <span className="inline-flex items-center text-[10px] text-muted-foreground mt-2 bg-muted/50 px-2 py-0.5 rounded">
                        <Calendar className="h-2.5 w-2.5 mr-1" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center justify-center"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Outreach History */}
        <div className="glass-panel rounded-2xl border border-border flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card/10">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-400" /> Outreach Campaign History
            </h2>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {history.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center justify-center my-auto">
                <Mail className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">
                  No outreach campaigns created yet.
                </p>
                <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">
                  Once you parse a job post, you can match your profile and generate email outreach
                  campaigns.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice(0, 5).map((email) => (
                  <div
                    key={email.id}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            email.status === "sent"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : email.status === "failed"
                              ? "bg-destructive/10 text-destructive-foreground border border-destructive/20"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}
                        >
                          {email.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          {new Date(email.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground truncate mt-2">
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        To: {email.recipientEmail || "N/A"} •{" "}
                        {email.jobPost?.extractedJson?.company_name || "N/A"}
                      </p>
                    </div>

                    {email.status === "draft" ? (
                      <Link
                        href={`/outreach/${email.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-all"
                      >
                        Edit Draft
                      </Link>
                    ) : (
                      <Link
                        href={`/outreach/${email.id}`}
                        className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
