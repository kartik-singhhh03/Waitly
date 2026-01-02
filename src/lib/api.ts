// ✅ CRITICAL FIX: Use relative paths for Vercel deployment
// In production (Vercel), API routes are at /api/* (same origin)
// In development, use VITE_API_URL or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3001');

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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // ✅ CRITICAL FIX: Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Expected JSON but got:', contentType, '\nResponse:', text.substring(0, 200));
      throw new Error(
        `API returned ${contentType || 'non-JSON'} instead of JSON. ` +
        `This usually means the API route doesn't exist or failed. ` +
        `Endpoint: ${endpoint}`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error calling ${endpoint}: ${error}`);
  }
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
// ✅ Uses same defensive JSON parsing as apiRequest
export const subscribeApi = {
  subscribe: async (apiKey: string, email: string, ref?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, email, ref }),
      });

      // ✅ Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Expected JSON but got:', contentType, '\nResponse:', text.substring(0, 200));
        throw new Error(
          `API returned ${contentType || 'non-JSON'} instead of JSON. ` +
          `This usually means the API route doesn't exist or failed.`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error during subscription: ${error}`);
    }
  },
};

