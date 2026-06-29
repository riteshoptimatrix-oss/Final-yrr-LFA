"use client";

import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/services/lead.service";
import { analyticsService } from "@/services/analytics.service";

export interface DashboardStats {
  totalLeads: number;
  phoneNumbers: number;
  emailsFound: number;
  websitesAnalyzed: number;
  highPotentialLeads: number;
  categories: number;
  sources: string[];
  recentLeads: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      console.log(`[useDashboardStats] fetching stats`);

      const [leadsRes, overviewRes, categories] = await Promise.all([
        leadService.getLeads({ limit: "200" }),
        analyticsService.getOverview(),
        leadService.getCategories(),
      ]);

      const leads = leadsRes.data || [];
      const overview = overviewRes.data;

      const stats: DashboardStats = {
        totalLeads: overview?.totalLeads ?? leads.length,
        phoneNumbers: leads.filter((l) => l.phone).length,
        emailsFound: leads.filter((l) => l.email).length,
        websitesAnalyzed: leads.filter((l) => l.hasWebsite).length,
        highPotentialLeads: overview?.highPotentialLeads ?? leads.filter((l) => (l.leadScore || 0) >= 70).length,
        categories: categories?.length || 0,
        sources: [...new Set(leads.map((l) => l.source).filter(Boolean))] as string[],
        recentLeads: leads.length,
      };

      console.log(`[useDashboardStats] stats computed: totalLeads=${stats.totalLeads}, phones=${stats.phoneNumbers}, emails=${stats.emailsFound}, websites=${stats.websitesAnalyzed}`);
      return stats;
    },
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnMount: "always",
  });
}
