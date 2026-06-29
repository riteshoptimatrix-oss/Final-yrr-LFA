"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/services/lead.service";
import { useLeadFilterStore } from "@/store/useLeadFilterStore";
import { useSearchParams } from "next/navigation";

export function useFilterOptions() {
  const { filters, setOptions, setOptionsLoading } = useLeadFilterStore();
  const state = filters.state || undefined;
  const city = filters.city || undefined;
  const area = filters.area || undefined;

  return useQuery({
    queryKey: ["lead-filter-options", state, city, area],
    queryFn: async () => {
      setOptionsLoading(true);
      const options = await leadService.getFilterOptions({ state, city, area });
      setOptions(options);
      return options;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useFilterCounts() {
  const { filters, setCounts, setCountsLoading } = useLeadFilterStore();

  const params: Record<string, string> = {};
  if (filters.category) params.category = filters.category;
  if (filters.state) params.state = filters.state;
  if (filters.city) params.city = filters.city;

  return useQuery({
    queryKey: ["lead-filter-counts", params],
    queryFn: async () => {
      setCountsLoading(true);
      const counts = await leadService.getFilterCounts(params);
      setCounts(counts);
      return counts;
    },
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useFilterFromUrl() {
  const searchParams = useSearchParams();
  const { setMultipleFilters } = useLeadFilterStore();
  const initialized = useRef(false);

  useEffect(() => {
    const params = {
      search: searchParams.get("search") || searchParams.get("keyword") || "",
      category: searchParams.get("category") || "",
      source: searchParams.get("source") || "",
      state: searchParams.get("state") || "",
      city: searchParams.get("city") || "",
      area: searchParams.get("area") || "",
      businessType: searchParams.get("businessType") || "",
      status: searchParams.get("status") || "",
      quality: searchParams.get("quality") || "",
      confidence: searchParams.get("confidence") || "",
      minConfidence: searchParams.get("minConfidence") || "",
      maxConfidence: searchParams.get("maxConfidence") || "",
      hasWebsite: searchParams.get("hasWebsite") || "all",
      hasPhone: searchParams.get("hasPhone") || "all",
      hasEmail: searchParams.get("hasEmail") || "all",
      socialOnly: searchParams.get("socialOnly") === "true",
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      hasWhatsApp: searchParams.get("hasWhatsApp") || "all",
      validationStatus: searchParams.get("validationStatus") || "",
      qualificationLevel: searchParams.get("qualificationLevel") || "",
      websiteType: searchParams.get("websiteType") || "",
      searchSessionId: searchParams.get("searchSessionId") || searchParams.get("sessionId") || "",
      sortField: searchParams.get("sortField") || "",
      sortOrder: searchParams.get("sortOrder") || "",
      page: parseInt(searchParams.get("page") || "1", 10),
    };

    setMultipleFilters(params as any);
    initialized.current = true;
  }, [searchParams, setMultipleFilters]);

  return initialized.current;
}
