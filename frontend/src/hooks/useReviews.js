import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useReviews = (params = {}) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: async () => {
      const response = await api.get('qa-reviews/', { params });
      return response.data;
    },
  });
};

export const useReview = (reviewId) => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      const response = await api.get(`qa-reviews/${reviewId}/`);
      return response.data;
    },
    enabled: !!reviewId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData) => {
      const response = await api.post('qa-reviews/', reviewData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const usePatchReview = (reviewId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.patch(`qa-reviews/${reviewId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useApproveReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, comment }) => {
      const response = await api.post(`qa-reviews/${reviewId}/approve/`, { comment });
      return response.data;
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useRejectReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, reason, comment }) => {
      const response = await api.post(`qa-reviews/${reviewId}/reject/`, { reason, comment });
      return response.data;
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useCallReviews = (callId) => {
  return useQuery({
    queryKey: ['call-reviews', callId],
    queryFn: async () => {
      const response = await api.get(`calls/${callId}/reviews/`);
      return response.data;
    },
    enabled: !!callId,
  });
};
