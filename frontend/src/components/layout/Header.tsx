"use client";

import { User, LogOut, ChevronRight, LayoutDashboard, Search, Users, BarChart3, TrendingUp, Settings as SettingsIcon, Bot, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { useAuthStore } from "@store/useAuthStore";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ComponentType } from "react";
import { authService } from "@services/auth.service";
import { clearAuthFromStorage } from "@utils/auth-persistence";

const PAGE_META: Record<string, { title: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  "/dashboard": { title: "Dashboard", icon: LayoutDashboard },
  "/search": { title: "Search", icon: Search },
  "/leads": { title: "Leads", icon: Users },
  "/crm": { title: "CRM Pipeline", icon: BarChart3 },
  "/analytics": { title: "Analytics", icon: TrendingUp },
  "/settings": { title: "Settings", icon: SettingsIcon },
  "/automation": { title: "Automation", icon: Bot },
  "/whatsapp-automation": { title: "WhatsApp Automation", icon: MessageCircle },
};

/** Mapping of subpaths to their parent labels for breadcrumb generation */ 
const PARENT_LABELS: Record<string, string> = {
  "leads": "Leads",
  "automation": "Automation",
};


function formatSegment(seg: string): string {
  return seg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function deriveDisplayName(user: { name?: string; email?: string } | null): string {
  if (!user) return "";
  if (user.name) return user.name;
  if (user.email) {
    const prefix = user.email.split("@")[0];
    const first = prefix.split(/[._]/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return "";
}
  
export function Header() {
  const pathname = usePathname();
  const { user, loading, clearAuth } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { pageTitle, pageIcon: PageIcon, breadcrumbs } = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const basePath = "/" + (segments[0] || "dashboard");
    const meta = PAGE_META[basePath];
    const title = meta?.title || formatSegment(segments[0] || "dashboard");
    const Icon = meta?.icon || LayoutDashboard;

    const crumbs: { label: string; path: string }[] = [];
    if (segments.length > 1) {
      crumbs.push({ label: title, path: "/" + segments[0] });
      for (let i = 1; i < segments.length; i++) {
        const parentLabel = PARENT_LABELS[segments[i]] || formatSegment(segments[i]);
        crumbs.push({ label: parentLabel, path: "/" + segments.slice(0, i + 1).join("/") });
      }
    }

    return {
      pageTitle: crumbs.length > 0 ? crumbs[crumbs.length - 1].label : title,
      pageIcon: Icon,
      breadcrumbs: crumbs,
    };
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoading(true);
    await authService.logout();
    clearAuth();
    clearAuthFromStorage();
    localStorage.removeItem("authToken");
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 lg:px-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      style={{
        backgroundColor: "#FAFAF8",
        borderBottom: "1px solid #E8E5DF",
      }}
    >
      {/* Left Section - Title + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-[9px] flex items-center justify-center shrink-0 bg-[#EEF2FF] border border-[#C7D2FE]">
            <PageIcon className="h-4 w-4 text-[#1D4ED8]" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold hidden sm:block text-[#18181B] tracking-[-0.02em] truncate">
              {pageTitle}
            </h1>
          {breadcrumbs.length > 1 && (
            <nav className="hidden sm:flex items-center gap-1 mt-0.5 text-[11px] text-[#B0AEA8]">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-2.5 h-2.5" strokeWidth={2} />}
                  <span className={i === breadcrumbs.length - 1 ? "text-[#52525B] font-medium" : ""}>
                    {crumb.label}
                  </span>
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-9 w-9 rounded-[9px] flex items-center justify-center transition-all duration-150
                         hover:bg-white border border-transparent hover:border-[#E4E1DB]"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] font-semibold text-[#1D4ED8] bg-[#EEF2FF] border border-[#C7D2FE]">
                  {deriveDisplayName(user).charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-[11px]"
            style={{
              backgroundColor: "#FAFAF8",
              border: "1px solid #E8E5DF",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {/* User Info Section */}
            <div className="px-4 py-3.5">
              {loading ? (
                <p className="text-[13px] text-[#B0AEA8]">Loading...</p>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-[#18181B]">
                    {deriveDisplayName(user)}
                  </p>
                  <p className="text-[12px] text-[#B0AEA8] mt-1">
                    {user?.email ?? ""}
                  </p>
                  <div className="mt-3">
                    <span
                      className="inline-flex items-center text-[10.5px] font-semibold px-2.5 py-1 rounded-full tracking-[0.06em] uppercase"
                      style={{
                        backgroundColor: "#EEF2FF",
                        color: "#1D4ED8",
                        border: "1px solid #C7D2FE",
                      }}
                    >
                      {user?.role ?? ""}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Separator */}
            <div style={{ height: "1px", backgroundColor: "#E8E5DF" }} />

            {/* Profile MenuItem */}
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="w-full px-4 py-2.5 flex items-center gap-2.5 rounded-lg text-[13px] cursor-pointer"
            >
              <User className="h-4 w-4 text-[#B0AEA8] shrink-0" strokeWidth={1.8} />
              <span>Profile</span>
            </DropdownMenuItem>

            {/* Separator */}
            <div style={{ height: "1px", backgroundColor: "#E8E5DF" }} />

            {/* Logout MenuItem */}
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full px-4 py-2.5 flex items-center gap-2.5 rounded-lg text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4 text-[#B0AEA8] shrink-0" strokeWidth={1.8} />
              <span>{isLoading ? "Logging out..." : "Logout"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
