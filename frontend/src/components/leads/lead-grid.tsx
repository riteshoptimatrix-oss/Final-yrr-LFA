import { memo } from "react";
import { Lead } from "@/types/index";
import { LeadCard } from "./lead-card";

export interface LeadGridProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

function LeadGridInner({ leads, onLeadClick }: LeadGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {leads.map((lead, index) => (
        <LeadCard key={lead.id ?? `lead-${index}`} lead={lead} onClick={onLeadClick} />
      ))}
    </div>
  );
}

export const LeadGrid = memo(LeadGridInner);
