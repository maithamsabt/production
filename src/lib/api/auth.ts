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
    
    // Cookie is automatically set by the server
    return response.user;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    // Cookie is automatically cleared by the server
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<SessionResponse>('/auth/me');
      return response.user;
    } catch (error) {
      return null;
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/verify');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authAPI = new AuthAPI();
