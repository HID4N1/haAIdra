import api from './api';

export const login = async (email, password) => {
  try {
    const response = await api.post('auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message || 'Login failed';
    return { success: false, error: message };
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('access_token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const hasRole = (userRole, requiredRole) => {
  const roleHierarchy = {
    admin: 4,
    manager: 3,
    qa_supervisor: 2,
    agent: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canAccess = (user, requiredRole) => {
  if (!user) return false;
  return hasRole(user.role, requiredRole);
};