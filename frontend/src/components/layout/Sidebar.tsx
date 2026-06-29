// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { cn } from "@utils/cn";
// import {
//   Search,
//   Users,
//   Settings,
//   Menu,
//   X,
//   Zap,
//   Workflow,
//   Home,
//   ChevronRight,
//   BrainCircuit,
//   MessageCircleMore,
//   Clock,
// } from "lucide-react";

// interface NavItem {
//   name: string;
//   href: string;
//   icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
//   parent?: string;
// }

// const NAV_ITEMS: NavItem[] = [
//   { name: "Home Page",  href: "/",                    icon: Home },
//   { name: "Search",     href: "/search",              icon: Search },
//   { name: "Search History", parent: "Search", href: "/search/history", icon: Clock },
//   { name: "Leads",      href: "/leads",               icon: Users },
//   { name: "Leads Automation", href: "/automation",          icon: Workflow },
//   { name: "WhatsApp Automation", href: "/whatsapp-automation", icon: MessageCircleMore},
//   { name: "Logic Module", href: "/logic-module",      icon: BrainCircuit},
//   { name: "Settings",   href: "/settings",            icon: Settings },
// ];

// export function Sidebar({ className }: { className?: string }) {
//   const pathname = usePathname();
//   const [isOpen, setIsOpen] = useState(false);
  
//   return (
//     <>
//       {/* Mobile toggle */}
//       <div className="lg:hidden">
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="fixed top-4 left-4 z-50 h-9 w-9 rounded-xl flex items-center justify-center
//                      bg-white border border-[#E4E1DB] shadow-sm text-[#52525B]
//                      hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-200"
//           aria-label="Toggle sidebar"
//         >
//           {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
//         </button>
//       </div>

//       {/* Sidebar */}
//       <aside
//         className={cn(
//           "fixed top-0 left-0 z-40 h-full w-[240px]",
//           "bg-[#FAFAF8] border-r border-[#E8E5DF]",
//           "transition-transform duration-300 ease-in-out lg:translate-x-0 lg:inset-y-0",
//           "flex flex-col",
//           isOpen ? "translate-x-0" : "-translate-x-full",
//           className
//         )}
//         style={{
//           backgroundImage:
//             "radial-gradient(circle at 1px 1px, #E8E5DF 1px, transparent 0)",
//           backgroundSize: "24px 24px",
//           backgroundPosition: "top left",
//         }}
//       >
//         {/* Solid overlay so dot grid is subtle */}
//         <div className="absolute inset-0 bg-[#FAFAF8]/90 pointer-events-none" />

//         {/* Inner content sits above the dot overlay */}
//         <div className="relative flex flex-col h-full">

//           {/* Logo / Wordmark */}
//           <div className="h-[60px] flex items-center px-5 border-b border-[#E8E5DF]">
//             <div className="flex items-center gap-2.5">
//               {/* Icon mark */}
//               <div
//                 className="h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
//                 style={{
//                   background:
//                     "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
//                   boxShadow: "0 1px 4px rgba(29,78,216,0.25)",
//                 }}
//               >
//                 <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
//               </div>

//               {/* Wordmark */}
//               <div className="flex flex-col leading-none">
//                 <span
//                   className="text-[15px] font-semibold tracking-[-0.02em] text-[#18181B]"
//                   style={{ letterSpacing: "-0.025em" }}
//                 >
//                   LeadFinder
//                 </span>
//                 <span className="text-[10px] font-medium tracking-[0.06em] text-[#A09FA0] titlecase mt-0.5">
//                   Develop by Opti Matrix
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Nav section label */}
//           <div className="px-5 pt-5 pb-1.5">
//             <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#B0AEA8]">
//               Navigation
//             </span>
//           </div>

//           {/* Nav items */}
//           <nav className="px-3 space-y-0.5 flex-1">
//             {NAV_ITEMS.map((item) => {
//               const isActive = pathname === item.href;
//               const isSubItem = !!item.parent;
//               return (
//                 <Link
//                   key={item.name}
//                   href={item.href}
//                   onClick={() => setIsOpen(false)}
//                   className={cn(
//                     "group relative flex items-center gap-3 rounded-[10px] transition-all duration-150",
//                     "text-[13.5px] font-medium",
//                     isSubItem ? "pl-9 pr-3 py-2" : "px-3 py-2.5",
//                     isActive
//                       ? "bg-white text-[#1D4ED8]"
//                       : "text-[#52525B] hover:bg-white/70 hover:text-[#18181B]"
//                   )}
//                   style={
//                     isActive
//                       ? {
//                           boxShadow:
//                             "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(29,78,216,0.1)",
//                         }
//                       : {}
//                   }
//                 >
//                   {/* Active left-edge accent bar */}
//                   {isActive && (
//                     <span
//                       className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
//                       style={{
//                         background:
//                           "linear-gradient(180deg, #3B60E4 0%, #1D4ED8 100%)",
//                       }}
//                     />
//                   )}

//                   {/* Icon wrapper */}
//                   <span
//                     className={cn(
//                       "flex items-center justify-center h-7 w-7 rounded-lg flex-shrink-0 transition-colors duration-150",
//                       isSubItem && "h-5 w-5",
//                       isActive
//                         ? "bg-[#EEF2FF]"
//                         : "bg-transparent group-hover:bg-[#F1F0EC]"
//                     )}
//                   >
//                     <item.icon
//                       className={cn(
//                         "transition-colors duration-150",
//                         isSubItem ? "h-3.5 w-3.5" : "h-[15px] w-[15px]",
//                         isActive
//                           ? "text-[#1D4ED8]"
//                           : "text-[#8E8D8A] group-hover:text-[#3B3B3B]"
//                       )}
//                       strokeWidth={isActive ? 2.2 : 1.8}
//                     />
//                   </span>

//                   <span className="flex-1">{item.name}</span>

//                   {/* Chevron on hover (non-active) */}
//                   {!isActive && (
//                     <ChevronRight
//                       className="h-3.5 w-3.5 text-[#C4C2BC] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
//                       strokeWidth={2}
//                     />
//                   )}
//                 </Link>
//               );
//             })}
//           </nav>
//           {/* Divider */}
//           <div className="mx-5 border-t border-[#E8E5DF] my-3" />

//           {/* Bottom status card */}
//           <div className="px-4 pb-5">
//             <div
//               className="rounded-xl p-3.5 border border-[#E4E1DB]"
//               style={{ background: "rgba(255,255,255,0.8)" }}
//             >
//               <div className="flex items-center justify-between mb-2.5">
//                 <span className="text-[11px] font-semibold text-[#3D3D3D] uppercase tracking-[0.06em]">
//                   API Status
//                 </span>
//                 <span
//                   className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
//                   style={{
//                     background: "#F0FBF4",
//                     color: "#15803D",
//                     border: "1px solid #BBF7D0",
//                   }}
//                 >
//                   <span
//                     className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
//                     style={{ animationDuration: "2s" }}
//                   />
//                   Active
//                 </span>
//               </div>

//               <div className="flex items-center gap-2">
//                 <span
//                   className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"
//                 />
//                 <span className="text-[12px] text-[#74726E]">
//                   Backend: Online
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* Mobile overlay */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
//           onClick={() => setIsOpen(false)}
//         />
//       )}
//     </>
//   );
// }

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@utils/cn";
import {
  Search,
  Users,
  Settings,
  Menu,
  X,
  Zap,
  Workflow,
  Home,
  ChevronRight,
  BrainCircuit,
  MessageCircleMore,
  Clock,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  parent?: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home Page",           href: "/",                    icon: Home,              group: "main" },
  { name: "Search",              href: "/search",              icon: Search,            group: "main" },
  { name: "Search History",      href: "/search/history",      icon: Clock,             group: "main", parent: "Search" },
  { name: "Leads",               href: "/leads",               icon: Users,             group: "leads" },
  { name: "Leads Automation",    href: "/automation",          icon: Workflow,          group: "leads" },
  { name: "WhatsApp Automation", href: "/whatsapp-automation", icon: MessageCircleMore, group: "leads" },
  { name: "Logic Module",        href: "/logic-module",        icon: BrainCircuit,      group: "system" },
  { name: "Settings",            href: "/settings",            icon: Settings,          group: "system" },
];

const GROUP_LABELS: Record<string, string> = {
  main:   "Core",
  leads:  "Leads & Outreach",
  system: "System",
};

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const groups = ["main", "leads", "system"];

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 h-9 w-9 rounded-xl flex items-center justify-center
                     bg-[#F7F5F0] border border-[#DDD9D1] shadow-sm text-[#6B6860]
                     hover:bg-[#EEEAE3] hover:text-[#1C1A17] transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[248px]",
          "border-r border-[#E2DED7]",
          "transition-transform duration-300 ease-in-out lg:translate-x-0 lg:inset-y-0",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
        style={{
          background: "linear-gradient(160deg, #F9F7F3 0%, #F4F1EB 100%)",
        }}
      >
        <div className="relative flex flex-col h-full">

          {/* ── Logo / Wordmark ── */}
          <div className="h-[64px] flex items-center px-5 border-b border-[#E2DED7]">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                  boxShadow: "0 1px 4px rgba(29,78,216,0.22), 0 0 0 1px rgba(59,96,228,0.15)",
                }}
              >
                <Zap className="h-[17px] w-[17px] text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-[-0.025em] text-[#18181B]">
                  LeadFinder
                </span>
                <span className="text-[10px] font-medium tracking-[0.07em] text-[#B0AB9E] uppercase mt-0.5">
                  by Opti Matrix
                </span>
              </div>
            </div>
          </div>

          {/* ── Nav groups ── */}
          <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 space-y-1">
            {groups.map((group, gIdx) => {
              const items = NAV_ITEMS.filter((i) => i.group === group);
              return (
                <div key={group}>
                  {/* Group separator + label for subsequent groups */}
                  {gIdx > 0 && (
                    <div className="flex items-center gap-2.5 px-2 pt-4 pb-2">
                      <div className="h-px flex-1 bg-[#DDD9D1]" />
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#B5B0A6] whitespace-nowrap">
                        {GROUP_LABELS[group]}
                      </span>
                      <div className="h-px flex-1 bg-[#DDD9D1]" />
                    </div>
                  )}

                  {/* First group label */}
                  {gIdx === 0 && (
                    <div className="px-2 pb-2">
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#B5B0A6]">
                        {GROUP_LABELS[group]}
                      </span>
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const isActive = pathname === item.href;
                      const isSubItem = !!item.parent;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-[10px] transition-all duration-150",
                            "text-[13px] font-medium",
                            isSubItem ? "pl-9 pr-3 py-2" : "px-2.5 py-2.5",
                            isActive
                              ? "bg-white text-[#1D4ED8]"
                              : "text-[#6B6860] hover:bg-white/70 hover:text-[#1C1A17]"
                          )}
                          style={
                            isActive
                              ? {
                                  boxShadow:
                                    "0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(29,78,216,0.1)",
                                }
                              : {}
                          }
                        >
                          {/* Active left-edge accent */}
                          {isActive && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-full"
                              style={{
                                background: "linear-gradient(180deg, #3B60E4 0%, #1D4ED8 100%)",
                              }}
                            />
                          )}

                          {/* Icon */}
                          <span
                            className={cn(
                              "flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-150",
                              isSubItem ? "h-5 w-5" : "h-7 w-7",
                              isActive
                                ? "bg-[#EEF2FF]"
                                : "bg-[#EDE9E2] group-hover:bg-[#E5E0D8]"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "transition-colors duration-150",
                                isSubItem ? "h-3.5 w-3.5" : "h-[14px] w-[14px]",
                                isActive
                                  ? "text-[#1D4ED8]"
                                  : "text-[#8E8A82] group-hover:text-[#3B3831]"
                              )}
                              strokeWidth={isActive ? 2.3 : 1.9}
                            />
                          </span>

                          <span className="flex-1 leading-tight">{item.name}</span>

                          {/* Chevron on hover */}
                          {!isActive && (
                            <ChevronRight
                              className="h-3 w-3 text-[#C8C3BA] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              strokeWidth={2.5}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* ── Full-width horizontal rule ── */}
          <div className="border-t border-[#DDD9D1]" />

          {/* ── Bottom status card ── */}
          <div className="px-4 py-4">
            <div
              className="rounded-xl p-3.5 border border-[#DDD9D1]"
              style={{ background: "rgba(255,255,255,0.75)" }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10.5px] font-bold text-[#9E9A93] uppercase tracking-[0.08em]">
                  API Status
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "#F0FBF4",
                    color: "#15803D",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
                    style={{ animationDuration: "2s" }}
                  />
                  Active
                </span>
              </div>

              {/* Thin inner divider */}
              <div className="h-px bg-[#E8E4DC] mb-2.5" />

              {/* Backend row */}
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-[11.5px] text-[#8E8A82]">
                  Backend: <span className="text-[#5A5650] font-medium">Online</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}


