import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useKPI = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'kpi', days],
    queryFn: async () => {
      const response = await api.get('dashboard/kpi/', { params: { days } });
      return response.data;
    },
  });
};

export const useCallsVolume = (days = 30, period = 'daily') => {
  return useQuery({
    queryKey: ['dashboard', 'volume', days, period],
    queryFn: async () => {
      const response = await api.get('dashboard/calls-volume/', { 
        params: { days, period } 
      });
      return response.data;
    },
  });
};

export const useSentimentBreakdown = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'sentiment', days],
    queryFn: async () => {
      const response = await api.get('dashboard/sentiment/', { params: { days } });
      return response.data;
    },
  });
};

export const useScoreTrend = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'score-trend', days],
    queryFn: async () => {
      const response = await api.get('dashboard/score-trend/', { params: { days } });
      return response.data;
    },
  });
};

export const useLeaderboard = (limit = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'leaderboard', limit],
    queryFn: async () => {
      const response = await api.get('dashboard/leaderboard/', { params: { limit } });
      return response.data;
    },
  });
};

export const useChannelDistribution = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'channels', days],
    queryFn: async () => {
      const response = await api.get('dashboard/channels/', { params: { days } });
      return response.data;
    },
  });
};

export const useLanguageDistribution = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'languages', days],
    queryFn: async () => {
      const response = await api.get('dashboard/languages/', { params: { days } });
      return response.data;
    },
  });
};