import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await api.get('admin/users/', { params });
      return response.data;
    },
  });
};

export const useAgents = (params = {}) => {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: async () => {
      const response = await api.get('agents/', { params });
      return response.data;
    },
  });
};

export const usePatchUser = (userId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(`admin/users/${userId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const usePatchAgent = (agentId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(`agents/${agentId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

export const useUpdateAgentCoaching = (agentId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coachingNotes) => {
      const response = await api.patch(`agents/${agentId}/coaching/`, {
        coaching_notes: coachingNotes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      await api.delete(`admin/users/${userId}/`);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('admin/users/', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
