import { apiClient } from "@utils/api-client";

export interface WhatsAppTemplatesData {
  website: { name: string; message: string };
  no_website: { name: string; message: string };
}

export interface TemplateUpdateResponse {
  success: boolean;
  message: string;
  data: { name: string; message: string };
}

class WhatsAppTemplateService {
  async getTemplates(): Promise<WhatsAppTemplatesData> {
    const response = await apiClient.get<{ success: boolean; data: WhatsAppTemplatesData }>(
      "/whatsapp/templates"
    );
    if (!response.success || !response.data) {
      throw new Error("Failed to fetch WhatsApp templates");
    }
    return response.data;
  }

  async updateWebsiteTemplate(message: string, name?: string): Promise<TemplateUpdateResponse> {
    const response = await apiClient.put<TemplateUpdateResponse>(
      "/whatsapp/templates/website",
      { message, name }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update website template");
    }
    return response;
  }

  async updateNoWebsiteTemplate(message: string, name?: string): Promise<TemplateUpdateResponse> {
    const response = await apiClient.put<TemplateUpdateResponse>(
      "/whatsapp/templates/no-website",
      { message, name }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update no-website template");
    }
    return response;
  }

  async previewTemplate(type: 'website' | 'no_website', message: string): Promise<string> {
    const response = await apiClient.post<{ success: boolean; message?: string; data: { rendered: string } }>(
      "/whatsapp/templates/preview",
      { type, message }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to preview template");
    }
    return response.data.rendered;
  }

  async resetTemplates(): Promise<WhatsAppTemplatesData> {
    const response = await apiClient.post<{ success: boolean; message: string; data: WhatsAppTemplatesData }>(
      "/whatsapp/templates/reset"
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to reset templates");
    }
    return response.data;
  }
}

export const whatsAppTemplateService = new WhatsAppTemplateService();
