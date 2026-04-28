import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useAnalytics = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/?period=${period}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePerformanceTrends = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'performance-trends', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/performance-trends/?period=${period}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAgentPerformance = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'agent-performance', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/agent-performance/?period=${period}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useChannelDistribution = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'channel-distribution', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/channel-distribution/?period=${period}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSentimentAnalysis = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'sentiment-analysis', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/sentiment-analysis/?period=${period}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useQualityMetrics = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'quality-metrics', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/quality-metrics/?period=${period}`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
