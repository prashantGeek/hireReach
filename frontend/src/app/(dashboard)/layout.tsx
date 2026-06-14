"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import { LayoutDashboard, User, Send, LogOut, ChevronRight } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "New Outreach", href: "/jobs/new", icon: Send },
  ];

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col justify-between hidden md:flex">
          <div>
            {/* Logo */}
            <div className="h-16 px-6 flex items-center border-b border-border">
              <Link href="/" className="text-xl font-extrabold tracking-tight text-gradient-premium">
                ReachHire
              </Link>
            </div>

            {/* Nav Links */}
            <nav className="p-4 space-y-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile / Logout */}
          <div className="p-4 border-t border-border bg-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center font-bold text-foreground">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/30 text-red-200 text-sm font-semibold rounded-xl transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top navigation header for mobile */}
          <header className="h-16 border-b border-border bg-card/30 backdrop-blur-xl px-6 flex items-center justify-between md:hidden">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-gradient-premium">
              ReachHire
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary"
              >
                {user?.fullName?.charAt(0).toUpperCase()}
              </Link>
              <button onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Navigation bar for mobile screens (Bottom bar) */}
          <nav className="h-16 border-t border-border bg-card/30 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around md:hidden px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-0.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Main page content scroll container */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8 relative">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto z-10 relative">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
