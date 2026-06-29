import { apiClient } from "@utils/api-client";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUser;
    accessToken: string;
    expiresIn?: number;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: AdminUser;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  data: null;
}

class AuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    return response;
  }

  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>("/auth/logout");
    return response;
  }

  async getCurrentUser(): Promise<MeResponse> {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; data: null }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: null }>(
      "/auth/change-password",
      { currentPassword, newPassword }
    );
    return response;
  }
}

export const authService = new AuthService();
