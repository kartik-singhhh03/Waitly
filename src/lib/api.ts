const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  signup: async (email: string, password: string, displayName?: string) => {
    const response = await apiRequest<{ success: boolean; token: string; user: any }>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      }
    );
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  signin: async (email: string, password: string) => {
    const response = await apiRequest<{ success: boolean; token: string; user: any }>(
      '/api/auth/signin',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  signout: () => {
    localStorage.removeItem('token');
  },

  getMe: async () => {
    return apiRequest<{ success: boolean; user: any }>('/api/auth/me');
  },

  sendMagicLink: async (email: string) => {
    return apiRequest<{ success: boolean; message: string; magicLink?: string }>(
      '/api/auth/magic-link/send',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  verifyMagicLink: async (token: string) => {
    const response = await apiRequest<{ success: boolean; token: string; user: any }>(
      '/api/auth/magic-link/verify',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      }
    );
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    const response = await apiRequest<{ success: boolean; projects: any[] }>('/api/projects');
    return response.projects;
  },

  getById: async (id: string) => {
    const response = await apiRequest<{ success: boolean; project: any }>(`/api/projects/${id}`);
    return response.project;
  },

  create: async (name: string, slug: string) => {
    const response = await apiRequest<{ success: boolean; project: any }>(
      '/api/projects',
      {
        method: 'POST',
        body: JSON.stringify({ name, slug }),
      }
    );
    return response.project;
  },

  update: async (id: string, updates: any) => {
    const response = await apiRequest<{ success: boolean; project: any }>(
      `/api/projects/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    return response.project;
  },

  rotateApiKey: async (id: string) => {
    const response = await apiRequest<{ success: boolean; project: any }>(
      `/api/projects/${id}/rotate-key`,
      {
        method: 'POST',
      }
    );
    return response.project;
  },

  delete: async (id: string) => {
    await apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Entries API
export const entriesApi = {
  getByProject: async (projectId: string) => {
    const response = await apiRequest<{ success: boolean; entries: any[] }>(
      `/api/entries/${projectId}`
    );
    return response.entries;
  },

  delete: async (entryId: string, projectId: string) => {
    await apiRequest(`/api/entries/${entryId}?projectId=${projectId}`, {
      method: 'DELETE',
    });
  },

  purge: async (projectId: string) => {
    await apiRequest(`/api/entries/purge/${projectId}`, {
      method: 'DELETE',
    });
  },
};

// Stats API
export const statsApi = {
  getByProject: async (projectId: string) => {
    const response = await apiRequest<{ success: boolean; stats: { total: number; today: number } }>(
      `/api/stats/${projectId}`
    );
    return response.stats;
  },
};

// Subscribe API (public, no auth)
export const subscribeApi = {
  subscribe: async (apiKey: string, email: string, ref?: string) => {
    const response = await fetch(`${API_URL}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, email, ref }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Subscription failed');
    }

    return data;
  },
};

