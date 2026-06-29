import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { parseApiError } from './api';

let runtimeBaseUrl: string | null = null;

export function getApiBaseUrl(): string {
  if (runtimeBaseUrl) return runtimeBaseUrl;

  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  return '/api/v1';
}

export function setApiBaseUrl(url: string): void {
  runtimeBaseUrl = url.replace(/\/$/, '');
}

export async function discoverApiUrl(): Promise<string | null> {
  const bootstrapUrl = '/api/v1';

  const candidates = [
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, ''),
    bootstrapUrl,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const resp = await axios.get(`${candidate}/debug/network`, {
        timeout: 5000,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });

      if (resp.data?.success && resp.data?.data?.ngrokUrl) {
        const discoveredUrl = resp.data.data.ngrokUrl.replace(/\/$/, '');
        const apiUrl = `${discoveredUrl}/api/v1`;
        setApiBaseUrl(apiUrl);
        if (typeof window !== 'undefined') {
          console.info(`[discoverApiUrl] Discovered ngrok URL: ${discoveredUrl}`);
        }
        return apiUrl;
      }

      if (resp.data?.success && resp.data?.data) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  const fallback = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '/api/v1';
  console.warn(`[discoverApiUrl] Could not discover API URL, using fallback: ${fallback}`);
  return fallback;
}

class APIClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = getApiBaseUrl();

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      withCredentials: false,
    });

    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          const base = getApiBaseUrl();
          if (config.baseURL !== base) {
            config.baseURL = base;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            localStorage.removeItem('authToken');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const base = getApiBaseUrl();
    const finalConfig = {
      ...config,
      baseURL: base,
      timeout: config.timeout || 30000,
    };

    try {
      const response = await this.client.request(finalConfig);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      throw parseApiError(error);
    }
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  public async getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const base = getApiBaseUrl();
    const response = await this.client.get(url, {
      ...config,
      baseURL: base,
      responseType: 'blob',
      timeout: 30000,
    });
    return response.data;
  }
}

export const apiClient = new APIClient();
