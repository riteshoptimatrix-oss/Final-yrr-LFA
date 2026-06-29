"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@utils/cn";
import { ChevronDown } from "lucide-react";

interface LogicCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  badge?: string;
  badgeColor?: string;
}

export function LogicCard({
  title,
  subtitle,
  icon,
  children,
  className,
  defaultOpen = true,
  badge,
  badgeColor,
}: LogicCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E4E1DB] overflow-hidden transition-all duration-300",
        "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF8] transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#F1F0EC] flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#18181B]">{title}</h3>
              {badge && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
                  style={{
                    background: `${badgeColor || "#EEF2FF"}20`,
                    color: badgeColor || "#1D4ED8",
                    border: `1px solid ${badgeColor || "#1D4ED8"}30`,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[12.5px] text-[#74726E] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#A09FA0] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 pb-5 pt-1 border-t border-[#E8E5DF]">
          {children}
        </div>
      </div>
    </div>
  );
}
