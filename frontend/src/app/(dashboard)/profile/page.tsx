"use client";

import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Loader2, Save, Plus, X, Globe, Link as LinkIcon, Link2, Phone, MapPin, Briefcase } from "lucide-react";

interface Project {
  title: string;
  description: string;
  technologies: string[];
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("0");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [summary, setSummary] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch existing profile
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/profile");
      if (response.data?.profile) {
        const p = response.data.profile;
        setTitle(p.title || "");
        setYearsExperience(String(p.yearsExperience ?? 0));
        setLocation(p.location || "");
        setPhone(p.phone || "");
        setSummary(p.summary || "");
        setLinkedinUrl(p.linkedinUrl || "");
        setGithubUrl(p.githubUrl || "");
        setPortfolioUrl(p.portfolioUrl || "");
        setSkills(p.skillsJson || []);
        setProjects(p.projectsJson || []);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error loading profile:", error);
        setMessage({ type: "error", text: "Failed to load professional profile." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Basic Validation
    if (!title.trim()) {
      setMessage({ type: "error", text: "Professional Title is required." });
      setIsSaving(false);
      return;
    }
    if (!location.trim()) {
      setMessage({ type: "error", text: "Location is required." });
      setIsSaving(false);
      return;
    }
    if (summary.trim().length < 10) {
      setMessage({ type: "error", text: "Professional summary must be at least 10 characters." });
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        yearsExperience: yearsExperience === "" ? 0 : Number(yearsExperience),
        location: location.trim(),
        phone: phone.trim() || null,
        summary: summary.trim(),
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        portfolioUrl: portfolioUrl.trim() || null,
        skillsJson: skills,
        projectsJson: projects.map((p) => ({
          title: p.title.trim(),
          description: p.description.trim(),
          technologies: p.technologies,
        })),
      };

      const response = await api.post("/profile", payload);
      if (response.data?.profile) {
        setMessage({ type: "success", text: "Professional profile saved successfully!" });
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update professional profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add Skill
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleaned = newSkill.trim().replace(/,/g, "");
      if (cleaned && !skills.includes(cleaned)) {
        setSkills([...skills, cleaned]);
        setNewSkill("");
      }
    }
  };

  // Remove Skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Add Empty Project
  const handleAddProject = () => {
    setProjects([...projects, { title: "", description: "", technologies: [] }]);
  };

  // Update Project field
  const handleUpdateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  // Delete Project
  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Add Tech Tag inside project
  const handleAddTech = (projectIndex: number, techStr: string) => {
    const cleaned = techStr.trim().replace(/,/g, "");
    if (cleaned && !projects[projectIndex].technologies.includes(cleaned)) {
      const updated = [...projects];
      updated[projectIndex].technologies.push(cleaned);
      setProjects(updated);
    }
  };

  // Remove Tech Tag inside project
  const handleRemoveTech = (projectIndex: number, techIndex: number) => {
    const updated = [...projects];
    updated[projectIndex].technologies = updated[projectIndex].technologies.filter(
      (_, i) => i !== techIndex
    );
    setProjects(updated);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Retrieving profile parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Professional Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Define your qualifications, skills, and projects. The AI reads this profile to compose matches and letters.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold animate-pulse-slow ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Details Card */}
        <div className="glass-panel rounded-2xl p-6 border border-border space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <Briefcase className="h-5 w-5" /> Professional Blueprint
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Job Title / Designation
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Senior Full Stack Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                required
                value={yearsExperience}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith("0") && val.length > 1) {
                    setYearsExperience(val.slice(1));
                  } else {
                    setYearsExperience(val);
                  }
                }}
                className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Contact Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Professional Summary
            </label>
            <textarea
              required
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-sans"
              placeholder="Detail your core expertise, key business impacts, and career focus..."
            />
          </div>
        </div>

        {/* Links Card */}
        <div className="glass-panel rounded-2xl p-6 border border-border space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
            <Globe className="h-5 w-5" /> Professional Portals & Networks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                GitHub Profile URL
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Portfolio URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="https://mywebsite.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Tag Area */}
        <div className="glass-panel rounded-2xl p-6 border border-border space-y-6">
          <h2 className="text-xl font-bold text-violet-400">Core Expertise & Skills</h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Add Skills (Type name & hit Enter or comma)
            </label>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleAddSkill}
              className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all mb-4"
              placeholder="e.g. React, TypeScript, GraphQL..."
            />

            <div className="flex flex-wrap gap-2.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-foreground text-primary transition-colors focus:outline-none"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-xs text-muted-foreground">No skills added yet. Define some to boost AI matching scores.</p>
              )}
            </div>
          </div>
        </div>

        {/* Projects Card */}
        <div className="glass-panel rounded-2xl p-6 border border-border space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl font-bold text-teal-400">Highlighted Projects</h2>
            <button
              type="button"
              onClick={handleAddProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 text-primary text-xs font-bold rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" /> Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No projects added. Click "Add Project" to add relevant experience.
            </p>
          ) : (
            <div className="space-y-6 divide-y divide-border/50">
              {projects.map((proj, idx) => (
                <div key={idx} className={`pt-6 ${idx === 0 ? "pt-0" : ""} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Project #{idx + 1}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        required
                        value={proj.title}
                        onChange={(e) => handleUpdateProject(idx, "title", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-secondary/20 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="E-Commerce API Service"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">
                        Technologies Used (Comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Node.js, Postgres, Redis (Press comma to add tag)"
                        onKeyDown={(e) => {
                          if (e.key === "," || e.key === "Enter") {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              handleAddTech(idx, val);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-secondary/20 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {proj.technologies.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary border border-border text-muted-foreground rounded text-[10px] font-semibold"
                          >
                            {tech}
                            <button
                              type="button"
                              onClick={() => handleRemoveTech(idx, tIdx)}
                              className="hover:text-foreground text-muted-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Project Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(idx, "description", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-secondary/20 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all font-sans"
                      placeholder="Explain what problem this project solved and your core contributions..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Submit Control */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all glow-btn"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" /> Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
