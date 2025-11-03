import { apiClient } from './client';
import type { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface SessionResponse {
  user: User;
}

class AuthAPI {
  async login(username: string, password: string): Promise<User> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    
    // Store token
    apiClient.setToken(response.token);
    
    return response.user;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    apiClient.setToken(null);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<SessionResponse>('/auth/me');
      return response.user;
    } catch (error) {
      apiClient.setToken(null);
      return null;
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/verify');
      return true;
    } catch (error) {
      apiClient.setToken(null);
      return false;
    }
  }
}

export const authAPI = new AuthAPI();
