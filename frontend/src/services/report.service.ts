import { apiClient } from '@utils/api-client';

export interface ReportProgress {
  stage: string;
  percent: number;
  message: string;
}

export interface ReportData {
  generated: boolean;
  generating: boolean;
  generatedAt: string | null;
  reportUrl: string | null;
  reportPath: string | null;
  htmlPath: string | null;
  score: number | null;
  reportVersion: string | null;
  lastAuditAt: string | null;
  progress: ReportProgress | null;
  failureReason: string | null;
}

export interface ReportStatusResponse {
  success: boolean;
  data: {
    leadId: string;
    report: ReportData;
    isQueued: boolean;
  };
}

export interface ReportProgressResponse {
  success: boolean;
  data: {
    leadId: string;
    progress: ReportProgress | null;
    generating: boolean;
    generated: boolean;
    isQueued: boolean;
  };
}

export interface GenerateResponse {
  success: boolean;
  data: {
    leadId: string;
    status: string;
    message: string;
  };
}

class ReportService {
  async generateReport(leadId: string): Promise<GenerateResponse> {
    return apiClient.post<GenerateResponse>(`/reports/generate/${leadId}`);
  }

  async getReportStatus(leadId: string): Promise<ReportStatusResponse> {
    return apiClient.get<ReportStatusResponse>(`/reports/status/${leadId}`);
  }

  async getReportProgress(leadId: string): Promise<ReportProgressResponse> {
    return apiClient.get<ReportProgressResponse>(`/reports/progress/${leadId}`);
  }

  async viewReport(leadId: string): Promise<string> {
    const response = await apiClient.get<{
      success: boolean;
      data: { html: string };
    }>(`/reports/view/${leadId}`);
    if (typeof response === 'string') return response;
    return (response as any)?.data?.html || '';
  }

  async downloadReport(leadId: string): Promise<Blob> {
    return apiClient.getBlob(`/reports/download/${leadId}`);
  }

  async deleteReport(leadId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/reports/${leadId}`);
  }

  downloadPdf(blob: Blob, filename?: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || `audit_report_${Date.now()}.pdf`;
    a.type = 'application/pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  viewPdfInTab(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

export const reportService = new ReportService();
