"use client";

import { cn } from "@utils/cn";

interface FlowStep {
  name: string;
  description?: string;
  color?: string;
}

interface LogicFlowProps {
  steps: FlowStep[];
  className?: string;
  direction?: "vertical" | "horizontal";
}

function CurveArrow({ color, horizontal }: { color: string; horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="flex items-center justify-center w-10 flex-shrink-0">
        <svg width="36" height="20" viewBox="0 0 36 20" fill="none" className="overflow-visible">
          <path
            d="M2 10H28M28 10L22 4M28 10L22 16"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex justify-center py-2">
      <svg width="22" height="36" viewBox="0 0 22 36" fill="none" className="overflow-visible">
        <path
          d="M11 2V28M11 28L5 22M11 28L17 22"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]"
          style={{ animation: "flowPulse 2s ease-in-out infinite" }}
        />
        <circle cx="11" cy="6" r="2" fill={color} opacity="0.5">
          <animate attributeName="cy" values="6;28;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export function LogicFlow({ steps, className, direction = "vertical" }: LogicFlowProps) {
  if (direction === "horizontal") {
    return (
      <div className={cn("flex items-center justify-center overflow-x-auto py-6", className)}>
        {steps.map((step, idx) => {
          const c = step.color || "#3B82F6";
          return (
            <div key={idx} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-3 min-w-[130px]">
                <div
                  className="relative h-14 w-14 rounded-2xl flex items-center justify-center text-white text-[16px] font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${c}, ${c}cc)`,
                    boxShadow: `0 4px 14px ${c}40`,
                  }}
                >
                  {idx + 1}
                  <div
                    className="absolute -inset-1 rounded-2xl opacity-20"
                    style={{
                      background: `linear-gradient(135deg, ${c}, transparent)`,
                      animation: "flowPulse 2s ease-in-out infinite",
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-[13px] font-semibold text-[#18181B] block">{step.name}</span>
                  {step.description && (
                    <span className="text-[11px] text-[#74726E] mt-0.5 block max-w-[130px] leading-snug">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <CurveArrow color={c} horizontal />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center py-4", className)}>
      {steps.map((step, idx) => {
        const c = step.color || "#3B82F6";
        return (
          <div key={idx} className="flex flex-col items-center w-full max-w-md">
            <div className="flex items-center gap-5 w-full">
              <div
                className="relative h-12 w-12 rounded-2xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${c}, ${c}cc)`,
                  boxShadow: `0 4px 14px ${c}40`,
                }}
              >
                {idx + 1}
                <div
                  className="absolute -inset-1 rounded-2xl opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${c}, transparent)`,
                    animation: "flowPulse 2s ease-in-out infinite",
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#18181B]">{step.name}</span>
                  <div className="h-1 w-1 rounded-full" style={{ backgroundColor: c }} />
                </div>
                {step.description && (
                  <p className="text-[12px] text-[#74726E] mt-0.5 leading-snug">{step.description}</p>
                )}
              </div>
            </div>
            {idx < steps.length - 1 && <CurveArrow color={steps[idx + 1].color || "#3B82F6"} />}
          </div>
        );
      })}
    </div>
  );
}
