import axios from 'axios';

const normalizeBaseURL = (url) => {
  const value = url || '/api/v1';
  return value.endsWith('/') ? value : `${value}/`;
};

const baseURL = normalizeBaseURL(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${baseURL}auth/refresh/`, {
          refresh_token: refreshToken,
        });

        const access = response.data.access_token || response.data.access;
        const refresh = response.data.refresh_token || response.data.refresh;

        localStorage.setItem('access_token', access);
        localStorage.setItem('token', access);
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const unwrap = (response) => response.data;

export const authApi = {
  login: (credentials) => api.post('auth/login/', credentials).then(unwrap),
  logout: (refresh_token) => api.post('auth/logout/', { refresh_token }).then(unwrap),
  me: () => api.get('auth/me/').then(unwrap),
  refresh: (refresh_token) => api.post('auth/refresh/', { refresh_token }).then(unwrap),
};

export const callsApi = {
  list: (params) => api.get('calls/', { params }).then(unwrap),
  detail: (id) => api.get(`calls/${id}/`).then(unwrap),
  status: (id) => api.get(`calls/${id}/status/`).then(unwrap),
  upload: (formData, onUploadProgress) => api.post('calls/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }).then(unwrap),
  update: (id, payload) => api.patch(`calls/${id}/`, payload).then(unwrap),
};

export const analysisApi = {
  detail: (callId) => api.get(`calls/${callId}/analysis/`).then(unwrap),
  trigger: (callId) => api.post(`calls/${callId}/analyze/`).then(unwrap),
};

export const dashboardApi = {
  kpi: (params) => api.get('dashboard/kpi/', { params }).then(unwrap),
  volume: (params) => api.get('dashboard/calls/volume/', { params }).then(unwrap),
  scores: (params) => api.get('dashboard/scores/', { params }).then(unwrap),
  sentiment: (params) => api.get('dashboard/sentiment/', { params }).then(unwrap),
  leaderboard: (params) => api.get('dashboard/agents/leaderboard/', { params }).then(unwrap),
  breakdown: (params) => api.get('dashboard/calls/breakdown/', { params }).then(unwrap),
  topics: (params) => api.get('dashboard/topics/', { params }).then(unwrap),
};

export const agentsApi = {
  list: (params) => api.get('agents/', { params }).then(unwrap),
  detail: (id) => api.get(`agents/${id}/`).then(unwrap),
  update: (id, payload) => api.patch(`agents/${id}/`, payload).then(unwrap),
};

export const reportsApi = {
  list: (params) => api.get('reports/', { params }).then(unwrap),
  generate: (payload) => api.post('reports/', payload).then(unwrap),
  download: (endpoint, params) => api.get(endpoint, { params, responseType: 'blob' }),
};

export default api;
