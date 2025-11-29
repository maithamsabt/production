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

    // Save token so we can fall back to Authorization header if cookie isn't available
    try {
      if (response.token) {
        localStorage.setItem('api_token', response.token);
      }
    } catch (e) {
      // ignore storage errors
    }

    // Cookie is automatically set by the server; return user data
    return response.user;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    // Clear stored token and cookie
    try { localStorage.removeItem('api_token'); } catch (e) {}
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
