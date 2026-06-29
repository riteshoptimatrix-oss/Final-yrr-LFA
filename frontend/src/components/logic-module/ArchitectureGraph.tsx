"use client";

import { cn } from "@utils/cn";

interface ArchLayer {
  layer: string;
  tech: string;
  items: readonly string[];
  color: string;
}

interface ArchitectureGraphProps {
  layers: readonly ArchLayer[];
  className?: string;
}

function ArchConnector({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  return (
    <div className="flex justify-center py-2">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${fromColor.replace('#','')}-${toColor.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={toColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d="M14 0V24M14 24L8 18M14 24L20 18"
          stroke={`url(#grad-${fromColor.replace('#','')}-${toColor.replace('#','')})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle r="3" fill={fromColor} opacity="0.5">
          <animateMotion dur="2s" repeatCount="indefinite" path="M14,4 L14,24" />
        </circle>
        <circle r="2" fill={toColor} opacity="0.4">
          <animateMotion dur="2s" repeatCount="indefinite" path="M14,4 L14,24" begin="0.5s" />
        </circle>
      </svg>
    </div>
  );
}

export function ArchitectureGraph({ layers, className }: ArchitectureGraphProps) {
  return (
    <div className={cn("flex flex-col items-center max-w-2xl mx-auto", className)}>
      {layers.map((layer, idx) => (
        <div key={idx} className="flex flex-col items-center w-full">
          <div
            className="w-full rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.01]"
            style={{
              borderColor: `${layer.color}30`,
              backgroundColor: `${layer.color}04`,
              boxShadow: `0 2px 8px ${layer.color}10`,
            }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg, ${layer.color}15, ${layer.color}06)`,
                borderBottom: `1px solid ${layer.color}20`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3.5 w-3.5 rounded-md flex-shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-[14px] font-semibold text-[#18181B]">{layer.layer}</span>
              </div>
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: `${layer.color}10`,
                  color: layer.color,
                  border: `1px solid ${layer.color}20`,
                }}
              >
                {layer.tech}
              </span>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {layer.items.map((item, iidx) => (
                <span
                  key={iidx}
                  className="text-[11.5px] font-medium px-2.5 py-1 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: `${layer.color}08`,
                    color: layer.color,
                    border: `1px solid ${layer.color}15`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          {idx < layers.length - 1 && (
            <ArchConnector fromColor={layers[idx].color} toColor={layers[idx + 1].color} />
          )}
        </div>
      ))}
    </div>
  );
}
