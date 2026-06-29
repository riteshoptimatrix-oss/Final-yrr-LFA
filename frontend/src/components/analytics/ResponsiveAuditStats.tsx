import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { responsiveAuditService } from '@/services/responsive-audit.service';
import { ResponsiveAuditStats as StatsType } from '@/types/responsive-audit.types';
import { 
  Monitor, 
  Smartphone, 
  LayoutGrid, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export function ResponsiveAuditStats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await responsiveAuditService.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Responsive Audit Analytics</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Responsive Audit Analytics</CardTitle>
          <CardDescription className="text-red-600">
            {error || 'No data available'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const auditedPercentage = stats.total > 0 
    ? Math.round((stats.audited / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Responsive Audit Analytics
          </CardTitle>
          <CardDescription>
            UI/UX and responsive design insights across all websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Websites"
              value={stats.total}
              icon={<Monitor className="w-4 h-4" />}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Audited"
              value={stats.audited}
              icon={<LayoutGrid className="w-4 h-4" />}
              color="bg-green-100 text-green-600"
              badge={`${auditedPercentage}%`}
            />
            <StatCard
              label="Not Audited"
              value={stats.notAudited}
              icon={<AlertTriangle className="w-4 h-4" />}
              color="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Mobile Unfriendly"
              value={stats.mobileUnfriendly}
              icon={<Smartphone className="w-4 h-4" />}
              color="bg-red-100 text-red-600"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Average Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScoreRow
              label="Responsive"
              score={stats.averageResponsiveScore}
              icon={<Monitor className="w-4 h-4" />}
            />
            <ScoreRow
              label="UI/UX"
              score={stats.averageUiuxScore}
              icon={<LayoutGrid className="w-4 h-4" />}
            />
            <ScoreRow
              label="Mobile Experience"
              score={stats.averageMobileScore}
              icon={<Smartphone className="w-4 h-4" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Common Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <IssueRow
              label="Layout Issues"
              count={stats.layoutIssues}
              total={stats.audited}
            />
            <IssueRow
              label="Alignment Issues"
              count={stats.alignmentIssues}
              total={stats.audited}
            />
            <IssueRow
              label="Horizontal Scroll"
              count={stats.horizontalScrollIssues}
              total={stats.audited}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightRow
              label="Mobile-Ready Sites"
              value={stats.audited - stats.mobileUnfriendly}
              total={stats.audited}
              positive={true}
            />
            <InsightRow
              label="Sites Need Work"
              value={stats.layoutIssues + stats.alignmentIssues}
              total={stats.audited}
              positive={false}
            />
            <InsightRow
              label="Audit Progress"
              value={stats.audited}
              total={stats.total}
              positive={stats.audited > stats.notAudited}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  badge 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  badge?: string;
}) {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value}</span>
        {badge && (
          <Badge variant="outline" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ScoreRow({ 
  label, 
  score, 
  icon 
}: { 
  label: string; 
  score: number; 
  icon: React.ReactNode;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreTrend = (s: number) => {
    if (s >= 80) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (s >= 50) return <Minus className="w-3 h-3 text-yellow-600" />;
    return <TrendingDown className="w-3 h-3 text-red-600" />;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {getScoreTrend(score)}
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function IssueRow({ 
  label, 
  count, 
  total 
}: { 
  label: string; 
  count: number; 
  total: number;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{count}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-red-500 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percentage}% affected</span>
    </div>
  );
}

function InsightRow({ 
  label, 
  value, 
  total, 
  positive 
}: { 
  label: string; 
  value: number; 
  total: number;
  positive: boolean;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <Badge 
          variant={positive ? 'default' : 'destructive'} 
          className="text-xs"
        >
          {percentage}%
        </Badge>
        <span className="font-semibold">{value}/{total}</span>
      </div>
    </div>
  );
}
