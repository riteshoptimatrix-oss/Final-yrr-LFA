import type { ReactNode } from "react";
import { Sidebar } from "@components/layout/Sidebar";
import { Header } from "@components/layout/Header";
import { AuthHydrator } from "@components/auth/AuthHydrator";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 lg:pl-64">
        <AuthHydrator>
          <Header />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </AuthHydrator>
      </div>
    </div>
  );
}
