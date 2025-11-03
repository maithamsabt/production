import { apiClient } from './client';
import type { Vendor } from '../types';

class VendorsAPI {
  async getAll(): Promise<Vendor[]> {
    return apiClient.get<Vendor[]>('/vendors');
  }

  async getById(id: string): Promise<Vendor> {
    return apiClient.get<Vendor>(`/vendors/${id}`);
  }

  async create(data: Omit<Vendor, 'id' | 'createdAt'>): Promise<Vendor> {
    return apiClient.post<Vendor>('/vendors', data);
  }

  async update(id: string, data: Partial<Omit<Vendor, 'id' | 'createdAt'>>): Promise<Vendor> {
    return apiClient.put<Vendor>(`/vendors/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vendors/${id}`);
  }
}

export const vendorsAPI = new VendorsAPI();

