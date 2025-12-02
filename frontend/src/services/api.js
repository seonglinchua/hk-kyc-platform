import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// Case API
export const caseAPI = {
  getCases: async (params = {}) => {
    const response = await api.get('/cases', { params });
    return response.data;
  },

  getCaseById: async (id) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },

  createCase: async (caseData) => {
    const response = await api.post('/cases', caseData);
    return response.data;
  },

  updateCase: async (id, caseData) => {
    const response = await api.put(`/cases/${id}`, caseData);
    return response.data;
  },

  deleteCase: async (id) => {
    const response = await api.delete(`/cases/${id}`);
    return response.data;
  },

  updateCaseStatus: async (id, status) => {
    const response = await api.patch(`/cases/${id}/status`, { status });
    return response.data;
  },

  getCaseSummary: async (id) => {
    const response = await api.get(`/cases/${id}/summary`);
    return response.data;
  },

  triggerAnalysis: async (id) => {
    const response = await api.post(`/cases/${id}/trigger-analysis`);
    return response.data;
  }
};

// Document API
export const documentAPI = {
  uploadDocument: async (caseId, file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await api.post(`/documents/cases/${caseId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getCaseDocuments: async (caseId) => {
    const response = await api.get(`/documents/cases/${caseId}/documents`);
    return response.data;
  },

  getDocumentUrl: (documentId) => {
    return `${API_URL}/documents/documents/${documentId}`;
  },

  downloadDocument: (documentId) => {
    return `${API_URL}/documents/documents/${documentId}/download`;
  },

  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/documents/${documentId}`);
    return response.data;
  }
};

export default api;
