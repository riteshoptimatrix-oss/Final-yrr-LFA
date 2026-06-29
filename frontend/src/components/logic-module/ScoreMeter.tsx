"use client";

import { cn } from "@utils/cn";

interface ScoreMeterProps {
  score: number;
  maxScore?: number;
  label: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function ScoreMeter({
  score,
  maxScore = 100,
  label,
  color = "#3B82F6",
  size = "md",
  showValue = true,
}: ScoreMeterProps) {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  const radius = size === "sm" ? 28 : size === "md" ? 36 : 48;
  const strokeWidth = size === "sm" ? 4 : size === "md" ? 5 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const fontSize = size === "sm" ? "text-[11px]" : size === "md" ? "text-[13px]" : "text-[16px]";
  const valueSize = size === "sm" ? "text-[13px]" : size === "md" ? "text-[17px]" : "text-[22px]";
  const totalSize = size === "sm" ? 72 : size === "md" ? 90 : 120;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={totalSize} height={totalSize} className="transform -rotate-90">
        <circle
          cx={totalSize / 2}
          cy={totalSize / 2}
          r={radius}
          fill="none"
          stroke="#F1F0EC"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={totalSize / 2}
          cy={totalSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showValue && (
        <span
          className={cn("font-bold tracking-tight", valueSize)}
          style={{ color }}
        >
          {score}
        </span>
      )}
      <span className={cn("font-medium text-[#74726E]", fontSize)}>
        {label}
      </span>
    </div>
  );
}
