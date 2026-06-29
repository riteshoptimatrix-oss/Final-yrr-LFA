"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@store/useAuthStore";
import { authService } from "@services/auth.service";
import { saveAuthToStorage } from "@utils/auth-persistence";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Alert, AlertDescription } from "@components/ui/alert";
import { Loader2, Lock, Mail, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAccessToken, setLoading, setError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { user, accessToken, expiresIn } = response.data;

        setUser(user);
        setAccessToken(accessToken);
        saveAuthToStorage(user, accessToken);
        setError(null);

        localStorage.setItem("authToken", accessToken);

        const maxAge = expiresIn ? Math.floor(expiresIn / 1000) : 28800;
        document.cookie = `auth_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;

        router.push("/leads");
        router.refresh();
      }
    } catch (err: any) {
      const message = err.message || "Invalid email or password";
      setLocalError(message);
      setError(message);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-[#F5F3EF]">
      <div className="mb-8 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-[11px] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
            boxShadow: "0 1px 6px rgba(29,78,216,0.22)",
          }}
        >
          <Shield className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[16px] font-semibold text-[#18181B]">Lead Finder Agent</h1>
          <p className="text-[12px] text-[#B0AEA8]">Admin Dashboard</p>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="border-b border-[#E8E5DF] px-6 py-5">
          <h2 className="text-[18px] font-semibold text-center text-[#18181B] tracking-[-0.02em]">Opti Matrix Login</h2>
          <p className="text-[12.5px] text-center text-[#8E8C86] mt-1.5">
            Enter your credentials to access the admin dashboard
          </p>
        </div>
        <div className="px-6 py-5">
          {localError && (
            <div className="bg-red-50 border border-red-200 rounded-[11px] p-3.5 mb-4">
              <p className="text-[13px] text-red-900">{localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-[#52525B]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  suppressHydrationWarning
                  className="w-full h-10 pl-10 pr-3.5 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13.5px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#52525B]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-10 pl-10 pr-3.5 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13.5px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 px-5 rounded-[9px] text-[13.5px] font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-5"
              style={{
                background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                boxShadow: "0 1px 4px rgba(29,78,216,0.25)",
              }}
            >
              {isLoading && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-[12px] text-[#8E8C86] flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5" strokeWidth={1.8} />
            Authorized admin access only
          </div>
        </div>
      </div>
    </div>
  );
}