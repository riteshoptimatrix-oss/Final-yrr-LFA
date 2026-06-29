"use client";

import { cn } from "@utils/cn";

interface PipelineStage {
  name: string;
  color: string;
}

interface AnimatedPipelineProps {
  stages: PipelineStage[];
  className?: string;
}

function ConnectorLine({ color }: { color: string }) {
  return (
    <div className="flex justify-center py-1">
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" className="overflow-visible">
        <path
          d="M12 0V20M12 20L6 14M12 20L18 14"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
        />
        <circle r="3" fill={color} opacity="0.4">
          <animateMotion dur="1.5s" repeatCount="indefinite" path="M12,0 L12,20" />
        </circle>
      </svg>
    </div>
  );
}

export function AnimatedPipeline({ stages, className }: AnimatedPipelineProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {stages.map((stage, idx) => (
        <div key={idx} className="flex flex-col">
          <div className="flex items-center gap-4 group">
            <div
              className="relative h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`,
                boxShadow: `0 4px 12px ${stage.color}40`,
              }}
            >
              <div
                className="h-3 w-3 rounded-full bg-white/80"
                style={{ animation: `flowPulse 1.5s ease-in-out ${idx * 0.2}s infinite` }}
              />
            </div>
            <div
              className="flex-1 h-12 rounded-xl flex items-center px-5 text-[13px] font-semibold text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${stage.color}22, ${stage.color}11)`,
                color: stage.color,
                border: `1px solid ${stage.color}30`,
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="relative z-10">{stage.name}</span>
              <div
                className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.07]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${stage.color})`,
                }}
              />
            </div>
          </div>
          {idx < stages.length - 1 && <ConnectorLine color={stages[idx + 1].color} />}
        </div>
      ))}
    </div>
  );
}
