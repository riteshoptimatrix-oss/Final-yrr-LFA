"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AreaDensityItem } from "@/types/analytics";
import { getCityCoord } from "@/config/city-coordinates";
import { Loader2, AlertCircle, MapPin } from "lucide-react";

const DENSITY_COLORS: Record<string, { fill: string; border: string; text: string }> = {
  high: { fill: "#ef4444", border: "#dc2626", text: "High Density" },
  medium: { fill: "#eab308", border: "#ca8a04", text: "Medium Density" },
  low: { fill: "#22c55e", border: "#16a34a", text: "Low Density" },
};

interface CityCluster {
  city: string;
  state: string;
  totalLeads: number;
  densityLevel: 'high' | 'medium' | 'low';
  areas: AreaDensityItem[];
  topCategory: string;
}

interface AreaHeatmapProps {
  data: AreaDensityItem[];
  loading: boolean;
  error: boolean;
}

export function AreaHeatmap({ data, loading, error }: AreaHeatmapProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const clusters = useMemo(() => {
    const map = new Map<string, CityCluster>();
    for (const item of data) {
      const key = `${item.state}::${item.city}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalLeads += item.totalLeads;
        existing.areas.push(item);
        if (item.totalLeads > 150) existing.densityLevel = 'high';
        else if (item.totalLeads > 50 && existing.densityLevel !== 'high') existing.densityLevel = 'medium';
      } else {
        const top = item.topCategories[0]?.category || '';
        map.set(key, {
          city: item.city,
          state: item.state,
          totalLeads: item.totalLeads,
          densityLevel: item.densityLevel,
          areas: [item],
          topCategory: top,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalLeads - a.totalLeads);
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
          <span className="text-[13px] font-medium">Failed to load heatmap data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="border-b border-[#E8E5DF] px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-[#18181B]">Area Heatmap</h3>
          <p className="text-[12px] text-[#B0AEA8] mt-1">Business density by city — marker size reflects lead volume</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Low
          </span>
        </div>
      </div>

      <div className="h-[350px]">
        <MapContainer
          center={[22.5, 71.5]}
          zoom={7}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {clusters.map((cluster) => {
            const coord = getCityCoord(cluster.city);
            if (!coord) return null;
            const colors = DENSITY_COLORS[cluster.densityLevel] || DENSITY_COLORS.low;
            const radius = Math.max(8, Math.min(40, Math.sqrt(cluster.totalLeads) * 2));

            return (
              <CircleMarker
                key={`${cluster.state}::${cluster.city}`}
                center={[coord.lat, coord.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: colors.fill,
                  color: colors.border,
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.6,
                }}
                eventHandlers={{
                  click: () => setSelectedCity(selectedCity === cluster.city ? null : cluster.city),
                }}
              >
                <Tooltip sticky>
                  <div className="text-[12px] min-w-[140px]">
                    <p className="font-semibold text-[13px]">{cluster.city}</p>
                    <p className="text-[#8E8C86] mt-0.5">{colors.text}</p>
                    <p className="font-bold mt-1">{cluster.totalLeads} leads</p>
                    {cluster.topCategory && (
                      <p className="text-[#8E8C86]">Top: {cluster.topCategory}</p>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="text-[12px] min-w-[180px]">
                    <p className="font-semibold text-[14px] mb-1">{cluster.city}</p>
                    <p className="text-[#8E8C86] mb-2">{cluster.state} · {colors.text}</p>
                    <p className="font-bold mb-1">{cluster.totalLeads} total leads</p>
                    <div className="border-t border-[#E8E5DF] pt-1.5 mt-1.5">
                      <p className="text-[11px] font-semibold text-[#8E8C86] uppercase mb-1">Areas</p>
                      {cluster.areas.slice(0, 8).map((area) => (
                        <div key={area.area} className="flex justify-between items-center py-0.5">
                          <span>{area.area}</span>
                          <span className="font-medium">{area.totalLeads}</span>
                        </div>
                      ))}
                      {cluster.areas.length > 8 && (
                        <p className="text-[#B0AEA8] text-[11px] mt-1">+{cluster.areas.length - 8} more areas</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {clusters.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-8 w-8 text-[#B0AEA8] mb-2" />
          <p className="text-[13px] text-[#52525B]">No area data available</p>
          <p className="text-[11px] text-[#B0AEA8] mt-1">Leads with area data will appear here</p>
        </div>
      )}
    </div>
  );
}
