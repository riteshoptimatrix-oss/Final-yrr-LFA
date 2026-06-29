import { LeadResponsiveData, getScoreColor, getScoreBgColor } from '@/types/responsive-audit.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  Smartphone, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

interface ResponsiveAuditDetailProps {
  data: LeadResponsiveData;
}

export function ResponsiveAuditDetail({ data }: ResponsiveAuditDetailProps) {
  if (!data.responsiveAuditCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Responsive Audit</CardTitle>
          <CardDescription>No audit data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { responsiveAudit, uiuxAudit, responsiveScore, uiuxScore, mobileExperienceScore } = data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Responsive & UI/UX Scores
          </CardTitle>
          <CardDescription>
            Audited on {data.responsiveAuditedAt ? new Date(data.responsiveAuditedAt).toLocaleDateString() : 'Unknown'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${getScoreBgColor(responsiveScore || 0)}`}>
              <div className="flex items-center gap-2 mb-2">
                <Monitor className={`w-5 h-5 ${getScoreColor(responsiveScore || 0)}`} />
                <span className="font-semibold text-sm">Responsive Score</span>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(responsiveScore || 0)}`}>
                {responsiveScore || 0}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${getScoreBgColor(uiuxScore || 0)}`}>
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className={`w-5 h-5 ${getScoreColor(uiuxScore || 0)}`} />
                <span className="font-semibold text-sm">UI/UX Score</span>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(uiuxScore || 0)}`}>
                {uiuxScore || 0}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${getScoreBgColor(mobileExperienceScore || 0)}`}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className={`w-5 h-5 ${getScoreColor(mobileExperienceScore || 0)}`} />
                <span className="font-semibold text-sm">Mobile Score</span>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(mobileExperienceScore || 0)}`}>
                {mobileExperienceScore || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {responsiveAudit && (
        <Card>
          <CardHeader>
            <CardTitle>Responsive Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <StatusItem
                label="Mobile Friendly"
                status={responsiveAudit.mobileFriendly}
              />
              <StatusItem
                label="Responsive Layout"
                status={responsiveAudit.responsiveLayout}
              />
              <StatusItem
                label="No Horizontal Scroll"
                status={!responsiveAudit.horizontalScroll}
              />
              <StatusItem
                label="No Overflow Issues"
                status={!responsiveAudit.overflowIssues}
              />
              <StatusItem
                label="Viewport Meta"
                status={responsiveAudit.viewportMeta}
              />
              <StatusItem
                label="Touch Friendly"
                status={responsiveAudit.touchFriendly}
              />
              <StatusItem
                label="No Font Issues"
                status={!responsiveAudit.fontSizeIssues}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {uiuxAudit && uiuxAudit.issues && uiuxAudit.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>UI/UX Issues Detected</CardTitle>
            <CardDescription>{uiuxAudit.issues.length} issues found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uiuxAudit.issues.slice(0, 10).map((issue, index) => (
                <div key={index} className="flex items-start gap-2 p-2 border rounded">
                  {issue.severity === 'critical' && (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  {issue.severity === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {issue.severity === 'info' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {issue.type}
                      </Badge>
                      <Badge 
                        variant={
                          issue.severity === 'critical' 
                            ? 'destructive' 
                            : issue.severity === 'warning' 
                            ? 'secondary' 
                            : 'default'
                        }
                        className="text-xs"
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{issue.description}</p>
                    {issue.element && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Element: {issue.element}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {uiuxAudit.issues.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {uiuxAudit.issues.length - 10} more issues
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(data.desktopScreenshot || data.mobileScreenshot) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Screenshots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.desktopScreenshot && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Desktop View
                  </h4>
                  <img
                    src={data.desktopScreenshot}
                    alt="Desktop screenshot"
                    className="w-full rounded border"
                  />
                </div>
              )}
              {data.mobileScreenshot && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile View
                  </h4>
                  <img
                    src={data.mobileScreenshot}
                    alt="Mobile screenshot"
                    className="w-full rounded border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {status ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}
