import { apiClient } from './client';

export interface Settings {
  id: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultVat: string;
  checkerSignature: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

class SettingsAPI {
  async get(): Promise<Settings> {
    return apiClient.get<Settings>('/settings');
  }

  async update(data: Partial<Omit<Settings, 'id' | 'updatedAt' | 'updatedBy'>>): Promise<Settings> {
    return apiClient.put<Settings>('/settings', data);
  }
}

export const settingsAPI = new SettingsAPI();
