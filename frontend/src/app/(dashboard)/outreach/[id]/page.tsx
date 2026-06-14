"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import {
  Loader2,
  Send,
  ArrowLeft,
  Mail,
  Edit3,
  Eye,
  CheckCircle,
  AlertTriangle,
  Building,
  Info,
  ExternalLink,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface JobPost {
  id: string;
  extractedJson: {
    role_title?: string;
    company_name?: string;
  };
}

interface OutreachEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  status: "draft" | "sent" | "failed";
  sentAt: string | null;
  createdAt: string;
  jobPost: JobPost;
}

export default function OutreachPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [outreach, setOutreach] = useState<OutreachEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; previewUrl?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  // Editor tabs
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const fetchOutreachDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/outreach/${id}`);
      const data = response.data.outreach;
      setOutreach(data);
      setRecipientEmail(data.recipientEmail || "");
      setSubject(data.subject || "");
      setHtmlContent(data.htmlContent || "");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to load outreach email draft details. It may have been removed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutreachDetails();
  }, [id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendResult(null);
    setError(null);

    if (!recipientEmail.trim()) {
      setError("Recipient email address is required.");
      setIsSending(false);
      return;
    }

    try {
      const response = await api.post("/outreach/send", {
        outreachEmailId: id,
        recipientEmail: recipientEmail.trim(),
        subject: subject.trim(),
        htmlContent: htmlContent.trim(),
      });

      setSendResult({
        success: true,
        previewUrl: response.data.previewUrl,
        message: response.data.message || "Email dispatched successfully!",
      });

      // Update local status representation
      if (outreach) {
        setOutreach({
          ...outreach,
          status: "sent",
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          htmlContent: htmlContent.trim(),
        });
      }
    } catch (err: any) {
      console.error("Failed to send email:", err);
      setSendResult({
        success: false,
        message: err.response?.data?.message || "Failed to dispatch email via SMTP server.",
      });
      if (outreach) {
        setOutreach({ ...outreach, status: "failed" });
      }
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Retrieving draft details...</p>
      </div>
    );
  }

  if (error && !outreach) {
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

  if (!outreach) return null;

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/jobs/${outreach.jobPost.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Match Details
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Campaign Status:</span>
          <span
            className={`inline-flex items-center font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-[10px] ${
              outreach.status === "sent"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : outreach.status === "failed"
                ? "bg-destructive/10 text-destructive-foreground border border-destructive/20"
                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            }`}
          >
            {outreach.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-red-200 text-sm font-semibold animate-pulse-slow">
          {error}
        </div>
      )}

      {sendResult && (
        <div
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn ${
            sendResult.success
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-destructive/15 border-destructive/25 text-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {sendResult.success ? (
              <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-extrabold text-base">
                {sendResult.success ? "Outreach Email Dispatched!" : "Dispatch Failure"}
              </h3>
              <p className="text-xs mt-1 text-muted-foreground">
                {sendResult.message || "Action updated in logs."}
              </p>
            </div>
          </div>
          {sendResult.success && sendResult.previewUrl && (
            <a
              href={sendResult.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex-shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Sent Log Preview
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form (Left/Center) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-border overflow-hidden">
            {/* Tab controls */}
            <div className="flex justify-between items-center border-b border-border bg-card/15 px-4">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "edit"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Edit3 className="h-4 w-4" /> Edit Draft
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "preview"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-4 w-4" /> Live Render Preview
                </button>
              </div>
            </div>

            {/* Editor fields */}
            <form onSubmit={handleSend} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    To (Recipient Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-secondary/20 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder-muted-foreground/30 text-sm"
                    placeholder="hiring.manager@company.com"
                    disabled={isSending || outreach.status === "sent"}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-secondary/20 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder-muted-foreground/30 text-sm"
                    placeholder="Outreach Subject..."
                    disabled={isSending || outreach.status === "sent"}
                  />
                </div>
              </div>

              {activeTab === "edit" ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email HTML Content
                  </label>
                  <textarea
                    required
                    rows={16}
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary/20 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all font-mono text-xs leading-relaxed"
                    placeholder="<p>Paste or write email HTML here...</p>"
                    disabled={isSending || outreach.status === "sent"}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rendered HTML Container
                  </label>
                  <div
                    className="prose prose-invert max-w-none text-sm text-muted-foreground bg-secondary/15 p-5 rounded-xl border border-border min-h-[350px] overflow-y-auto font-sans"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              )}

              {outreach.status !== "sent" && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all glow-btn"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" /> Transmitting SMTP...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Dispatch Email
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar Info (Right) */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5" /> Campaign Meta
            </h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2 border-b border-border/40 pb-2">
                <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Target Role / Company</p>
                  <p className="mt-0.5">
                    {outreach.jobPost.extractedJson?.role_title || "Unknown Role"} at{" "}
                    {outreach.jobPost.extractedJson?.company_name || "Unknown Company"}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">Draft Created</p>
                <p className="mt-0.5">{new Date(outreach.createdAt).toLocaleString()}</p>
              </div>
              {outreach.sentAt && (
                <div>
                  <p className="font-semibold text-foreground">Dispatched On</p>
                  <p className="mt-0.5 text-emerald-400">
                    {new Date(outreach.sentAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-border bg-gradient-premium">
            <h4 className="text-sm font-bold text-cyan-400">Outreach Best Practices</h4>
            <ul className="text-xs text-muted-foreground mt-3 space-y-2 list-disc list-inside">
              <li>Keep sentences crisp and action-oriented.</li>
              <li>Always verify the hiring manager's email address is valid.</li>
              <li>Make sure custom placeholders (like company name and dates) are filled.</li>
              <li>Avoid jargon; customize talking points to fit their stack.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
