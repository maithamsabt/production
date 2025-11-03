import { apiClient } from './client';

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
}

class ItemsAPI {
  async getAll(): Promise<Item[]> {
    return apiClient.get<Item[]>('/items');
  }

  async getById(id: string): Promise<Item> {
    return apiClient.get<Item>(`/items/${id}`);
  }

  async create(data: Omit<Item, 'id'>): Promise<Item> {
    return apiClient.post<Item>('/items', data);
  }

  async update(id: string, data: Partial<Omit<Item, 'id'>>): Promise<Item> {
    return apiClient.put<Item>(`/items/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/items/${id}`);
  }
}

export const itemsAPI = new ItemsAPI();
