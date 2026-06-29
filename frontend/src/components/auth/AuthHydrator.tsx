"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@store/useAuthStore";
import { loadAuthFromStorage } from "@utils/auth-persistence";

export function AuthHydrator({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setLoading = useAuthStore((s) => s.setLoading);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    const stored = loadAuthFromStorage();
    if (stored) {
      setUser(stored.user);
      setAccessToken(stored.accessToken);
    }
    setLoading(false);
  }, [setUser, setAccessToken, setLoading]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}
