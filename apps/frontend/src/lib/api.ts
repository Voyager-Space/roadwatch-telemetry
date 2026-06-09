import { useAuthStore } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Helper function to safely extract the token from Zustand's state
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return useAuthStore.getState().accessToken;
};

export const authApi = {
  login: async (credentials: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!res.ok) {
      const errDetails = await res.text();
      console.error('Backend rejected login:', res.status, errDetails);
      throw new Error('Invalid email or password');
    }
    
    const json = await res.json();
    return json.data ? json.data : json;
  },

  register: async (userData: any) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!res.ok) {
      const errDetails = await res.text();
      console.error('Backend rejected registration:', res.status, errDetails);
      let errorMessage = 'Registration failed. Please check your inputs.';
      try {
        const errJson = JSON.parse(errDetails);
        if (errJson.message) errorMessage = errJson.message;
      } catch (e) {}
      
      throw new Error(errorMessage);
    }
    
    const json = await res.json();
    return json.data ? json.data : json;
  }
};

export const potholesApi = {
  query: async (filters: any = {}) => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/potholes/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(filters),
    });
    
    if (!res.ok) {
      console.error('Failed to fetch potholes:', res.statusText);
      return { data: [], total: 0 }; 
    }
    
    const json = await res.json();
    return json.data ? json.data : json; 
  },

  getMapMarkers: async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/potholes/map-markers`, { 
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    const json = await res.json();
    return json.data ? json.data : json;
  },

  getById: async (id: string) => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/potholes/${id}`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    if (!res.ok) throw new Error('Failed to fetch pothole details');
    
    const json = await res.json();
    return json.data ? json.data : json;
  },

  updateStatus: async (id: string, payload: { newStatus: string; reason?: string }) => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/potholes/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) throw new Error('Failed to update status');
    const json = await res.json();
    return json.data ? json.data : json;
  }
};

export const aiApi = {
  generateSummary: async (potholeId: string) => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/ai/summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ potholeId }), 
    });
    
    if (!res.ok) throw new Error('Failed to generate AI summary');
    
    const json = await res.json();
    return json.data ? json.data : json;
  }
};