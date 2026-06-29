"use client";

import { useState, useEffect, useCallback } from "react";
import { leadService } from "@/services/lead.service";
import {
  MapPin,
  Loader2,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

interface LocationGroup {
  state: string;
  city: string;
  area: string;
  totalLeads: number;
}

export function LeadLocationSummary({ sessionId }: { sessionId: string | null | undefined }) {
  const [groups, setGroups] = useState<LocationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    try {
      const res = await leadService.getLocationSummary(sessionId);
      if (res?.success && Array.isArray(res.data)) {
        setGroups(res.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    setLoading(true);
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <Card className="border-[#E8E5DF] shadow-sm">
        <CardContent className="p-5 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-[#B0AEA8] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) return null;

  return (
    <Card className="border-[#E8E5DF] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
          <CardTitle className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">
            Leads by Location
          </CardTitle>
          <span className="text-[10px] text-[#B0AEA8] font-medium ml-1">
            ({groups.reduce((s, g) => s + g.totalLeads, 0)} leads)
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E8E5DF]">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] w-[52px]">
                  Sr.
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">
                  <MapPin className="h-3 w-3 inline mr-1" strokeWidth={1.5} />
                  Location
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[90px]">
                  Leads
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, idx) => (
                <tr
                  key={`${g.state}-${g.city}-${g.area}`}
                  className="border-b border-[#F0EFEB] last:border-b-0 hover:bg-[#FAFAF8] transition-colors"
                >
                  <td className="px-4 py-2.5 text-[12px] text-[#8E8C86] font-medium align-top pt-3">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[13px] font-medium text-[#18181B]">
                      {g.state}
                    </span>
                    <span className="text-[#B0AEA8] mx-1.5 text-[13px]">→</span>
                    <span className="text-[13px] text-[#52525B]">{g.city}</span>
                    {g.area && g.area !== "Unknown" && (
                      <>
                        <span className="text-[#B0AEA8] mx-1.5 text-[13px]">→</span>
                        <span className="text-[13px] text-[#52525B]">{g.area}</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-[22px] rounded-[6px] bg-[#EEF2FF] text-[11px] font-semibold text-[#1D4ED8]">
                      {g.totalLeads}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
