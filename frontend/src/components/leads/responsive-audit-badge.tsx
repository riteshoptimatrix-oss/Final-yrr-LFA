import { Badge } from '@/components/ui/badge';
import { getScoreLevel, getScoreBadgeVariant } from '@/types/responsive-audit.types';
import { Monitor, Smartphone, LayoutGrid } from 'lucide-react';

interface ResponsiveAuditBadgeProps {
  responsiveScore?: number;
  uiuxScore?: number;
  mobileExperienceScore?: number;
  responsiveAuditCompleted?: boolean;
  compact?: boolean;
}

export function ResponsiveAuditBadge({
  responsiveScore,
  uiuxScore,
  mobileExperienceScore,
  responsiveAuditCompleted,
  compact = false,
}: ResponsiveAuditBadgeProps) {
  if (!responsiveAuditCompleted) {
    return (
      <Badge variant="outline" className="text-xs">
        Not Audited
      </Badge>
    );
  }

  if (compact) {
    const avgScore = Math.round(
      ((responsiveScore || 0) + (uiuxScore || 0) + (mobileExperienceScore || 0)) / 3
    );
    const variant = getScoreBadgeVariant(avgScore);
    const level = getScoreLevel(avgScore);

    return (
      <Badge variant={variant} className="text-xs">
        {level === 'good' && '✓'}
        {level === 'medium' && '⚠'}
        {level === 'poor' && '✗'}
        {' '}
        {avgScore}
      </Badge>
    );
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {responsiveScore !== undefined && (
        <Badge variant={getScoreBadgeVariant(responsiveScore)} className="text-xs gap-1">
          <Monitor className="w-3 h-3" />
          {responsiveScore}
        </Badge>
      )}
      {uiuxScore !== undefined && (
        <Badge variant={getScoreBadgeVariant(uiuxScore)} className="text-xs gap-1">
          <LayoutGrid className="w-3 h-3" />
          {uiuxScore}
        </Badge>
      )}
      {mobileExperienceScore !== undefined && (
        <Badge variant={getScoreBadgeVariant(mobileExperienceScore)} className="text-xs gap-1">
          <Smartphone className="w-3 h-3" />
          {mobileExperienceScore}
        </Badge>
      )}
    </div>
  );
}
