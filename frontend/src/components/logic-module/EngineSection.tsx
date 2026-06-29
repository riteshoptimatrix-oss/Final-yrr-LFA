"use client";

import type { ReactNode } from "react";
import { cn } from "@utils/cn";

interface EngineSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  gradient: string;
  accentColor: string;
  children: ReactNode;
}

export function EngineSection({
  id,
  title,
  subtitle,
  icon,
  gradient,
  accentColor,
  children,
}: EngineSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div
        className="rounded-2xl border border-[#E4E1DB] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <div
          className="relative px-7 py-6 flex items-center gap-5 overflow-hidden"
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, ${accentColor} 2px, transparent 0)`,
            backgroundSize: "32px 32px",
          }} />
          <div
            className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 relative"
            style={{ boxShadow: `0 2px 8px ${accentColor}20` }}
          >
            {icon}
          </div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <h2 className="text-[19px] font-bold text-[#18181B] tracking-tight">{title}</h2>
              <span
                className="hidden sm:inline-block h-5 w-[2px] rounded-full"
                style={{ backgroundColor: `${accentColor}40` }}
              />
              <span
                className="hidden sm:inline text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${accentColor}12`,
                  color: accentColor,
                  border: `1px solid ${accentColor}25`,
                }}
              >
                Engine
              </span>
            </div>
            {subtitle && (
              <p className="text-[13px] text-[#52525B] mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="px-7 py-6">
          {children}
        </div>
      </div>
    </section>
  );
}
