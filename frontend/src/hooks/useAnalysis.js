import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useAnalysis = (callId) => {
  return useQuery({
    queryKey: ['analysis', callId],
    queryFn: async () => {
      const response = await api.get(`analysis/${callId}/`);
      return response.data;
    },
    enabled: !!callId,
    refetchInterval: (data) => {
      // Poll every 4 seconds if analysis is not complete
      return data?.status === 'pending' ? 4000 : false;
    },
  });
};

export const useTriggerAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId) => {
      const response = await api.post(`analysis/${callId}/trigger/`);
      return response.data;
    },
    onSuccess: (_, callId) => {
      queryClient.invalidateQueries({ queryKey: ['analysis', callId] });
      queryClient.invalidateQueries({ queryKey: ['call', callId] });
    },
  });
};

export const useTranscript = (callId) => {
  return useQuery({
    queryKey: ['transcript', callId],
    queryFn: async () => {
      const response = await api.get(`analysis/${callId}/transcript/`);
      return response.data;
    },
    enabled: !!callId,
  });
};

export const useSentiment = (callId) => {
  return useQuery({
    queryKey: ['sentiment', callId],
    queryFn: async () => {
      const response = await api.get(`analysis/${callId}/sentiment/`);
      return response.data;
    },
    enabled: !!callId,
  });
};

export const useScore = (callId) => {
  return useQuery({
    queryKey: ['score', callId],
    queryFn: async () => {
      const response = await api.get(`analysis/${callId}/score/`);
      return response.data;
    },
    enabled: !!callId,
  });
};

export const useSummary = (callId) => {
  return useQuery({
    queryKey: ['summary', callId],
    queryFn: async () => {
      const response = await api.get(`analysis/${callId}/summary/`);
      return response.data;
    },
    enabled: !!callId,
  });
};