import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@store/useAuthStore";

export const useProtectedRoute = () => {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);
};
