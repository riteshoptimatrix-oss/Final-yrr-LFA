"use client";

import Link from "next/link";
import {
  ArrowRight,
  Search,
  Users,
  BarChart3,
  FileText,
  Globe,
  Loader2,
  AlertCircle,
  Zap,
  TrendingUp,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboard";

export default function HomePage() {
  const { data: stats, isLoading, isError, error, refetch } = useDashboardStats();

  const statCards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: Users,
      description: "All leads in database",
      color: "#1D4ED8",
      bg: "#EEF2FF",
    },
    {
      title: "Websites Found",
      value: stats?.websitesAnalyzed ?? 0,
      icon: Globe,
      description: "Leads with websites",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      title: "Emails Found",
      value: stats?.emailsFound ?? 0,
      icon: BarChart3,
      description: "Email addresses extracted",
      color: "#15803D",
      bg: "#F0FBF4",
    },
    {
      title: "Phone Numbers",
      value: stats?.phoneNumbers ?? 0,
      icon: FileText,
      description: "Phone numbers extracted",
      color: "#B45309",
      bg: "#FFFBEB",
    },
  ];

  const features = [
    {
      icon: Search,
      title: "Google Maps Search",
      description:
        "Automatically discover businesses from Google Maps and local directories with precision geo-targeting and category filters.",
    },
    {
      icon: Globe,
      title: "Website Analysis",
      description:
        "Deep-crawl websites to score authority, extract contact details, and surface the signals that matter for outreach.",
    },
    {
      icon: FileText,
      title: "Data Export",
      description:
        "Export leads to CSV or Excel in one click — ready for any CRM, email platform, or marketing workflow.",
    },
  ];

  const trustedPoints = [
    "No credit card required to start",
    "Real-time data, always fresh",
    "GDPR-compliant data handling",
    "99.9% uptime guarantee",
  ];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#FAFAF8" }}
    >
      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section
        className="w-full relative overflow-hidden"
        style={{
          background: "#FAFAF8",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #E8E5DF 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Subtle overlay to soften grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(160deg, rgba(250,250,248,0.92) 60%, rgba(238,242,255,0.55) 100%)",
          }}
        />

        <div className="relative container mx-auto px-4 md:px-6 py-16 md:py-28">
          {/* Eyebrow badge */}
          <div className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] px-3.5 py-1.5 rounded-full"
              style={{
                background: "#EEF2FF",
                color: "#1D4ED8",
                border: "1px solid rgba(29,78,216,0.15)",
              }}
            >
              <Zap className="h-3 w-3" strokeWidth={2.5} />
              AI-Powered Lead Discovery
            </span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-5 text-center max-w-3xl mx-auto">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]"
              style={{ color: "#18181B", letterSpacing: "-0.03em" }}
            >
              Find your next{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                1,000 leads
              </span>{" "}
              in Just 2 Minutes
            </h1>

            <p
              className="max-w-[620px] text-[16px] md:text-[17px] leading-relaxed"
              style={{ color: "#74726E" }}
            >
              LeadFinder automatically discovers, analyzes, and organizes
              business leads from Google Maps and business directories — so your
              pipeline never runs dry.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/search"
                className="inline-flex h-10 items-center justify-center rounded-[10px] px-7 text-[13.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                  boxShadow: "0 1px 4px rgba(29,78,216,0.35)",
                }}
              >
                Start Finding Leads
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/leads"
                className="inline-flex h-10 items-center justify-center rounded-[10px] px-7 text-[13.5px] font-semibold transition-all duration-150 hover:bg-white active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid #E4E1DB",
                  color: "#3D3D3D",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                View All Leads
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3">
              {trustedPoints.map((pt) => (
                <span
                  key={pt}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                  style={{ color: "#74726E" }}
                >
                  <CheckCircle2
                    className="h-3.5 w-3.5"
                    style={{ color: "#15803D" }}
                    strokeWidth={2.2}
                  />
                  {pt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #E8E5DF" }} />

      {/* ─── Real-time Stats Section ──────────────────────────────────── */}
      <section
        className="w-full py-14 md:py-20"
        style={{ background: "#F5F3EF" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-10 space-y-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.09em]"
              style={{ color: "#B0AEA8" }}
            >
              Live Dashboard
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "#18181B", letterSpacing: "-0.025em" }}
            >
              Real-time Statistics
            </h2>
            <p
              className="max-w-[500px] text-[14px] leading-relaxed"
              style={{ color: "#74726E" }}
            >
              Live analytics from your lead database, auto-refreshing every 10 seconds.
            </p>
          </div>

          {isLoading && !stats ? (
            <div
              className="flex items-center justify-center py-16 rounded-xl"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #E4E1DB" }}
            >
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: "#B0AEA8" }}
              />
              <span className="ml-2 text-[13px]" style={{ color: "#74726E" }}>
                Loading analytics…
              </span>
            </div>
          ) : isError ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #E4E1DB" }}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
              >
                <AlertCircle className="h-5 w-5" style={{ color: "#DC2626" }} />
              </div>
              <p
                className="text-[13.5px] font-semibold"
                style={{ color: "#18181B" }}
              >
                Failed to load analytics
              </p>
              <p
                className="text-[12px] mt-1"
                style={{ color: "#74726E" }}
              >
                {(error as any)?.message || "An error occurred"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 h-8 px-4 rounded-lg text-[12.5px] font-medium transition-all duration-150 hover:opacity-80"
                style={{
                  background: "white",
                  border: "1px solid #E4E1DB",
                  color: "#3D3D3D",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-xl p-5 transition-all duration-150 hover:shadow-md"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid #E4E1DB",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.07em]"
                      style={{ color: "#B0AEA8" }}
                    >
                      {stat.title}
                    </span>
                    <span
                      className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: stat.bg }}
                    >
                      <stat.icon
                        className="h-3.5 w-3.5"
                        style={{ color: stat.color }}
                        strokeWidth={2}
                      />
                    </span>
                  </div>
                  <div
                    className="text-[28px] font-bold tracking-tight leading-none mb-1.5"
                    style={{ color: "#18181B", letterSpacing: "-0.03em" }}
                  >
                    {(stat.value ?? 0).toLocaleString()}
                  </div>
                  <p className="text-[12px]" style={{ color: "#8E8D8A" }}>
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #E8E5DF" }} />

      {/* ─── Features Section ─────────────────────────────────────────── */}
      <section className="w-full py-14 md:py-20" style={{ background: "#FAFAF8" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-10 space-y-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.09em]"
              style={{ color: "#B0AEA8" }}
            >
              What you get
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "#18181B", letterSpacing: "-0.025em" }}
            >
              Everything you need to fill your pipeline
            </h2>
            <p
              className="max-w-[500px] text-[14px] leading-relaxed"
              style={{ color: "#74726E" }}
            >
              From discovery to export, LeadFinder Pro handles the entire
              prospecting workflow so your team can focus on closing.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl p-6 transition-all duration-150 hover:shadow-md group"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid #E4E1DB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <span
                  className="h-10 w-10 rounded-[10px] flex items-center justify-center mb-4 transition-colors duration-150"
                  style={{ background: "#EEF2FF" }}
                >
                  <feat.icon
                    className="h-5 w-5"
                    style={{ color: "#1D4ED8" }}
                    strokeWidth={1.8}
                  />
                </span>
                <h3
                  className="text-[14.5px] font-semibold mb-2"
                  style={{ color: "#18181B" }}
                >
                  {feat.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#74726E" }}>
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #E8E5DF" }} />

      {/* ─── Why LeadFinder Section ────────────────────────────────────── */}
      <section
        className="w-full py-14 md:py-20"
        style={{ background: "#F5F3EF" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-2 items-center max-w-4xl mx-auto">
            {/* Left text */}
            <div className="space-y-4">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.09em]"
                style={{ color: "#B0AEA8" }}
              >
                Why LeadFinder Pro
              </span>
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: "#18181B", letterSpacing: "-0.025em" }}
              >
                Built for teams that move fast
              </h2>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "#74726E" }}
              >
                Manual prospecting costs your team dozens of hours a week.
                LeadFinder Pro replaces that grind with an intelligent agent
                that works around the clock, so every morning you wake up to a
                fresh batch of qualified leads ready for outreach.
              </p>

              <ul className="space-y-3 pt-1">
                {[
                  { icon: TrendingUp, label: "10× faster than manual research" },
                  { icon: Shield, label: "Verified contact data, less bouncing" },
                  { icon: Zap, label: "Automated enrichment on every lead" },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#EEF2FF" }}
                    >
                      <item.icon
                        className="h-3.5 w-3.5"
                        style={{ color: "#1D4ED8" }}
                        strokeWidth={2}
                      />
                    </span>
                    <span className="text-[13.5px] font-medium" style={{ color: "#3D3D3D" }}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right mini-stat card */}
            <div
              className="rounded-xl p-6 space-y-4"
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1px solid #E4E1DB",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.07em]"
                  style={{ color: "#B0AEA8" }}
                >
                  Current stats
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: "#F0FBF4",
                    color: "#15803D",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Live
                </span>
              </div>

              {[
                { label: "Total leads", value: `${stats?.totalLeads ?? 0}+` },
                { label: "With websites", value: `${stats?.websitesAnalyzed ?? 0}+` },
                { label: "Phone numbers", value: `${stats?.phoneNumbers ?? 0}+` },
                { label: "Categories", value: `${stats?.categories ?? 0}` },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderTop: "1px solid #F0EDE8" }}
                >
                  <span className="text-[13px]" style={{ color: "#74726E" }}>
                    {row.label}
                  </span>
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: "#18181B" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #E8E5DF" }} />

      {/* ─── CTA Section ──────────────────────────────────────────────── */}
      <section
        className="w-full py-14 md:py-20 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
        }}
      >
        {/* Subtle dot grid on CTA */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Zap className="h-3 w-3" strokeWidth={2.5} />
              Start for free today
            </span>

            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ color: "white", letterSpacing: "-0.03em" }}
            >
              Ready to fill your pipeline?
            </h2>
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Join thousands of sales teams using LeadFinder Pro to grow their
              customer base and close deals faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/search"
                className="inline-flex h-10 items-center justify-center rounded-[10px] px-7 text-[13.5px] font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "white",
                  color: "#1D4ED8",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                }}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/leads"
                className="inline-flex h-10 items-center justify-center rounded-[10px] px-7 text-[13.5px] font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                View All Leads
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
