const API_BASE = '/api';

export const comparisonsAPI = {
  async getAll() {
    const response = await fetch(`${API_BASE}/comparisons`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comparisons');
    }
    return response.json();
  },

  async getById(id: string) {
    const response = await fetch(`${API_BASE}/comparisons/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comparison');
    }
    return response.json();
  },

  async create(data: any) {
    const response = await fetch(`${API_BASE}/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comparison');
    }
    return response.json();
  },

  async update(id: string, data: any) {
    const response = await fetch(`${API_BASE}/comparisons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update comparison');
    }
    return response.json();
  },

  async submit(id: string) {
    const response = await fetch(`${API_BASE}/comparisons/${id}/submit`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit comparison');
    }
    return response.json();
  },

  async approve(id: string) {
    const response = await fetch(`${API_BASE}/comparisons/${id}/approve`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve comparison');
    }
    return response.json();
  },

  async reject(id: string, rejectionReason: string) {
    const response = await fetch(`${API_BASE}/comparisons/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rejectionReason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject comparison');
    }
    return response.json();
  },

  async delete(id: string) {
    const response = await fetch(`${API_BASE}/comparisons/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete comparison');
    }
    return response.json();
  },
};
