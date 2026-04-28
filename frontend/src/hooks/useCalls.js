import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useCalls = (params = {}) => {
  return useQuery({
    queryKey: ['calls', params],
    queryFn: async () => {
      const response = await api.get('calls/', { params });
      return response.data;
    },
  });
};

export const useCall = (id) => {
  return useQuery({
    queryKey: ['call', id],
    queryFn: async () => {
      const response = await api.get(`calls/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUploadCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('calls/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });
};

export const usePatchCall = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(`calls/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call', id] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });
};

export const useDeleteCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`calls/${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });
};