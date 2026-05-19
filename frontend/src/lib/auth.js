import { authApi, clearAuthStorage } from './api';

const normalizeUser = (data, email) => {
  const user = data?.user || data?.profile || data;
  return {
    id: user?.id || 'local-user',
    email: user?.email || email,
    first_name: user?.first_name || user?.firstName || user?.name?.split(' ')?.[0] || 'haAIdra',
    last_name: user?.last_name || user?.lastName || user?.name?.split(' ')?.slice(1).join(' ') || 'User',
    role: user?.role || user?.user_role || 'manager',
    ...user,
  };
};

export const login = async (email, password) => {
  try {
    const data = await authApi.login({ email, password });
    const user = normalizeUser(data, email);
    const access = data.access_token || data.access || data.token;
    const refresh = data.refresh_token || data.refresh;
    
    if (access) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('token', access);
    }
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message || 'Login failed';
    return { success: false, error: message };
  }
};

export const logout = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Local logout should still complete even if the token is already invalid.
    }
  }

  clearAuthStorage();
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

export const getCurrentUser = async () => {
  if (!getToken()) return null;

  try {
    const user = normalizeUser(await authApi.me());
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch {
    return getUser();
  }
};

export const getToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token');
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
