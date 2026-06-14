"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { FileText, Link as LinkIcon, Sparkles, Loader2, FileSearch } from "lucide-react";

export default function NewJobPage() {
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper to rotate loading texts for a premium feel
  const loadingMessages = [
    "Contacting AI Model...",
    "Scanning text structures...",
    "Extracting role metadata & level...",
    "Compiling critical qualifications...",
    "Saving parsed schema to database...",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rawText.trim().length < 20) {
      setError("Please paste a description of at least 20 characters.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    // Simulate analysis step transitions
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const response = await api.post("/job-post/extract", {
        rawText: rawText.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
      });

      clearInterval(interval);
      const { jobPostId } = response.data;
      router.push(`/jobs/${jobPostId}`);
    } catch (err: any) {
      clearInterval(interval);
      console.error("Extraction error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to parse the job description. Please ensure you entered valid text."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Extract Job Post</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Paste any raw job descriptions, requirements, or social hiring posts. Our AI parses roles, skills, and details automatically.
        </p>
      </div>

      {isLoading ? (
        <div className="glass-panel rounded-2xl p-10 border border-border flex flex-col items-center justify-center py-24 text-center animate-pulse-slow">
          <div className="relative w-20 h-20 mb-8">
            {/* Spinning accent circles */}
            <div className="absolute inset-0 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
            <div
              className="absolute inset-3 rounded-full border-4 border-muted border-b-cyan-400 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
            ></div>
            <div className="absolute inset-6 flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Analyzing Job Description</h2>
          <p className="text-sm text-primary font-semibold tracking-wider uppercase mb-1">
            {loadingMessages[loadingStep]}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mt-3">
            Our AI model is extracting responsibilities, requirements, technical skills, and salary indices to generate outreach templates.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 md:p-8 border border-border">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4" /> Source Link / URL (Optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-muted-foreground/40 text-sm"
                placeholder="https://linkedin.com/jobs/view/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Job Post Text (Requirements, Posting body, or Description)
              </label>
              <textarea
                required
                rows={12}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-muted-foreground/40 text-sm font-sans"
                placeholder="Paste the raw job description copy here..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all glow-btn"
              >
                <FileSearch className="h-5 w-5" /> Parse Description
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
