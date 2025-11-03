import { authAPI, usersAPI } from './api';
import type { User } from './types';

/**
 * Authentication Service - API-based
 * Replaces localStorage-based auth with backend API calls
 */
class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    this.loadSession();
  }

  /**
   * Load existing session from backend
   */
  private async loadSession() {
    try {
      const user = await authAPI.getCurrentUser();
      this.currentUser = user;
      this.notifyListeners();
    } catch (error) {
      this.currentUser = null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (user: User | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<User> {
    const user = await authAPI.login(username, password);
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await authAPI.logout();
    this.currentUser = null;
    this.notifyListeners();
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    return usersAPI.getAll();
  }

  /**
   * Create new user
   */
  async createUser(username: string, password: string, role: string, name: string): Promise<User> {
    return usersAPI.create({ username, password, role, name });
  }

  /**
   * Update existing user
   */
  async updateUser(
    id: string,
    updates: {
      username?: string;
      password?: string;
      role?: string;
      name?: string;
      isActive?: boolean;
    }
  ): Promise<User> {
    const updatedUser = await usersAPI.update(id, updates);
    
    // If updating current user, refresh session
    if (id === this.currentUser?.id) {
      this.currentUser = updatedUser;
      this.notifyListeners();
    }
    
    return updatedUser;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await usersAPI.delete(id);
  }

  /**
   * Verify current session
   */
  async verifySession(): Promise<boolean> {
    return authAPI.verifyToken();
  }
}

export const authService = new AuthService();
