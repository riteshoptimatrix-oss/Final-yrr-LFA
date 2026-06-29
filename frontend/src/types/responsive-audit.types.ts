export interface ResponsiveAudit {
  mobileFriendly: boolean;
  responsiveLayout: boolean;
  horizontalScroll: boolean;
  overflowIssues: boolean;
  viewportMeta: boolean;
  viewportContent?: string;
  touchFriendly: boolean;
  fontSizeIssues: boolean;
}

export interface UIUXIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  element?: string;
  location?: string;
}

export interface UIUXAudit {
  alignmentIssues: boolean;
  brokenButtons: boolean;
  croppedSections: boolean;
  mobileLayoutBroken: boolean;
  overlappingContent: boolean;
  hiddenContent: boolean;
  navigationIssues: boolean;
  spacingIssues: boolean;
  issues: UIUXIssue[];
}

export interface LayoutMetrics {
  hasHorizontalScroll: boolean;
  bodyOverflowX: boolean;
  elementsOffscreen: number;
  fixedWidthElements: number;
  overlappingElements: number;
}

export interface ResponsiveScores {
  responsiveScore: number;
  uiuxScore: number;
  mobileExperienceScore: number;
}

export interface LeadResponsiveData {
  responsiveAudit?: ResponsiveAudit;
  uiuxAudit?: UIUXAudit;
  responsiveScore?: number;
  uiuxScore?: number;
  mobileExperienceScore?: number;
  desktopScreenshot?: string;
  mobileScreenshot?: string;
  responsiveAuditCompleted?: boolean;
  responsiveAuditedAt?: string;
  desktopMetrics?: LayoutMetrics;
  mobileMetrics?: LayoutMetrics;
}

export interface ResponsiveAuditStats {
  total: number;
  audited: number;
  notAudited: number;
  averageResponsiveScore: number;
  averageUiuxScore: number;
  averageMobileScore: number;
  mobileUnfriendly: number;
  layoutIssues: number;
  alignmentIssues: number;
  horizontalScrollIssues: number;
}

export type ScoreLevel = 'good' | 'medium' | 'poor';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'good';
  if (score >= 50) return 'medium';
  return 'poor';
}

export function getScoreColor(score: number): string {
  const level = getScoreLevel(score);
  if (level === 'good') return 'text-green-600';
  if (level === 'medium') return 'text-yellow-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  const level = getScoreLevel(score);
  if (level === 'good') return 'bg-green-100';
  if (level === 'medium') return 'bg-yellow-100';
  return 'bg-red-100';
}

export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  const level = getScoreLevel(score);
  if (level === 'good') return 'default';
  if (level === 'medium') return 'secondary';
  return 'destructive';
}
