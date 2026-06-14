"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { Mail, Lock, User, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setAbsLoading] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters.";
    } else if (fullName.trim().length > 100) {
      errors.fullName = "Full name must be less than 100 characters.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (password.length > 72) {
      errors.password = "Password must be less than 72 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setAbsLoading(true);

    try {
      await register(fullName, email, password);
    } catch (err: any) {
      console.warn("Registration failed:", err.response?.data?.message || err.message);
      if (err.code === "ERR_NETWORK" || !err.response) {
        setError(
          "Network Error: Unable to connect to the backend server. Please verify that the backend is running on http://localhost:8080."
        );
      } else {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 400 && data?.errors?.fieldErrors) {
          const errors = data.errors.fieldErrors;
          const mappedErrors: Record<string, string> = {};
          Object.keys(errors).forEach((key) => {
            if (errors[key] && errors[key].length > 0) {
              mappedErrors[key] = errors[key][0];
            }
          });
          setFieldErrors(mappedErrors);
        } else if (status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: data?.message || "Email already in use.",
          }));
        } else if (status === 500) {
          setError("Server Error: An unexpected issue occurred on the server. Please try again later.");
        } else {
          setError(data?.message || "Registration failed. Please check your credentials.");
        }
      }
    } finally {
      setAbsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow"></div>
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-slow"
        style={{ animationDelay: "3s" }}
      ></div>

      <div className="w-full max-w-md z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient-premium mb-2">
            ReachHire
          </h1>
          <p className="text-sm text-muted-foreground">
            Sleek AI-Powered LinkedIn Outreach Coordinator
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Create account</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-red-200 text-sm font-medium animate-pulse-slow">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.fullName;
                        return copy;
                      });
                    }
                  }}
                  className={`block w-full pl-10 pr-4 py-3 bg-secondary/50 border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.fullName
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : "border-border focus:ring-primary"
                  }`}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1.5 flex items-center text-xs text-red-400 font-medium animate-pulse-slow">
                  <AlertCircle className="mr-1 h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.email;
                        return copy;
                      });
                    }
                  }}
                  className={`block w-full pl-10 pr-4 py-3 bg-secondary/50 border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.email
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : "border-border focus:ring-primary"
                  }`}
                  placeholder="name@example.com"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 flex items-center text-xs text-red-400 font-medium animate-pulse-slow">
                  <AlertCircle className="mr-1 h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.password;
                        return copy;
                      });
                    }
                  }}
                  className={`block w-full pl-10 pr-4 py-3 bg-secondary/50 border rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.password
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : "border-border focus:ring-primary"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 flex items-center text-xs text-red-400 font-medium animate-pulse-slow">
                  <AlertCircle className="mr-1 h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/30 glow-btn"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <div className="flex items-center">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
