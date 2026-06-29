"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { discoverApiUrl } from "@utils/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    discoverApiUrl();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: false,
            gcTime: 300000,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" expand={false} theme="system" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
