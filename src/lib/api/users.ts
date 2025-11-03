import { apiClient } from './client';
import type { User } from '../types';

export interface CreateUserRequest {
  username: string;
  password: string;
  role: string;
  name: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: string;
  name?: string;
  isActive?: boolean;
}

class UsersAPI {
  async getAll(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  }

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  async create(data: CreateUserRequest): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }
}

export const usersAPI = new UsersAPI();
