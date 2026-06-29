"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AreaDensityItem } from "@/types/analytics";
import { Loader2, AlertCircle, BarChart3 } from "lucide-react";

interface TopAreasChartProps {
  data: AreaDensityItem[];
  loading: boolean;
  error: boolean;
}

function densityColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
  }
}

export function TopAreasChart({ data, loading, error }: TopAreasChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 10).map((item) => ({
      name: item.area.length > 18 ? item.area.slice(0, 16) + '…' : item.area,
      fullName: item.area,
      city: item.city,
      leads: item.totalLeads,
      color: densityColor(item.densityLevel),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 bg-white rounded-[14px] border border-[#E8E5DF]">
        <Loader2 className="h-6 w-6 text-[#1D4ED8] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80 bg-white rounded-[14px] border border-[#E8E5DF]">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-[13px] font-medium">Failed to load chart data</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="border-b border-[#E8E5DF] px-5 py-4">
          <h3 className="text-[14px] font-semibold text-[#18181B]">Top Areas by Leads</h3>
          <p className="text-[12px] text-[#B0AEA8] mt-1">Business lead distribution across areas</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-8 w-8 text-[#B0AEA8] mb-2" />
          <p className="text-[13px] text-[#52525B]">No data yet</p>
          <p className="text-[11px] text-[#B0AEA8] mt-1">Lead distribution will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#E8E5DF] px-5 py-4">
        <h3 className="text-[14px] font-semibold text-[#18181B]">Top Areas by Leads</h3>
        <p className="text-[12px] text-[#B0AEA8] mt-1">Business lead distribution across areas</p>
      </div>
      <div className="p-5 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DF" horizontal={false} />
            <XAxis type="number" stroke="#B0AEA8" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#B0AEA8"
              tick={{ fontSize: 11 }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FAFAF8",
                border: "1px solid #E8E5DF",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [value, "Leads"]}
              labelFormatter={(label: string) => {
                const item = chartData.find((d) => d.name === label);
                return item ? `${item.fullName}, ${item.city}` : label;
              }}
            />
            <Bar dataKey="leads" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
