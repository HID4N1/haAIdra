import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useReviews = (params = {}) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: async () => {
      const response = await api.get('reviews/', { params });
      return response.data;
    },
  });
};

export const useReview = (reviewId) => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      const response = await api.get(`reviews/${reviewId}/`);
      return response.data;
    },
    enabled: !!reviewId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData) => {
      const response = await api.post('reviews/', reviewData);
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
      const response = await api.patch(`reviews/${reviewId}/`, data);
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
      const response = await api.patch(`reviews/${reviewId}/`, { status: 'approved', comment });
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
      const response = await api.patch(`reviews/${reviewId}/`, { status: 'rejected', override_reason: reason, comment });
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
      const response = await api.get('reviews/', { params: { call: callId } });
      return response.data;
    },
    enabled: !!callId,
  });
};
