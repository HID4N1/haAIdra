import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import { mockAgents, mockCalls, mockDashboard } from '../lib/mockData';

const decorateKPI = (data) => ({
  ...data,
  average_score: data.average_score ?? data.avg_score ?? 0,
  average_duration: data.average_duration ?? data.avg_duration ?? 0,
  pending_calls: data.pending_calls ?? 0,
});

const decorateVolumePoint = (item) => ({
  ...item,
  date: item.date || item.week || item.month,
  total_calls: item.total_calls ?? item.count ?? 0,
  analyzed_calls: item.analyzed_calls ?? 0,
  flagged_calls: item.flagged_calls ?? 0,
});

const decorateSentiment = (data) => ({
  ...data,
  sentiment_distribution: data.sentiment_distribution || data.breakdown || {
    positive: data.positive || 0,
    neutral: data.neutral || 0,
    negative: data.negative || 0,
  },
});

const decorateScoreTrend = (item) => ({
  ...item,
  average_score: item.average_score ?? item.avg_score ?? item.score ?? 0,
});

const decorateAgent = (agent) => ({
  ...agent,
  name: agent.name || agent.email || `Agent ${String(agent.id).slice(0, 8)}`,
  average_score: agent.average_score ?? agent.period_avg_score ?? agent.avg_score ?? 0,
  avg_score: agent.avg_score ?? agent.period_avg_score ?? agent.average_score ?? 0,
  calls: agent.calls ?? agent.calls_in_period ?? agent.total_calls ?? 0,
  total_calls: agent.total_calls ?? agent.calls_in_period ?? agent.calls ?? 0,
});

export const useKPI = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'kpi', days],
    queryFn: async () => {
      try {
        return decorateKPI(await dashboardApi.kpi({ days }));
      } catch (error) {
        console.error('Using mock KPI data because dashboard endpoint is unavailable:', error?.message);
        return decorateKPI(mockDashboard.kpis);
      }
    },
  });
};

export const useCallsVolume = (days = 30, period = 'daily') => {
  return useQuery({
    queryKey: ['dashboard', 'volume', days, period],
    queryFn: async () => {
      try {
        const data = await dashboardApi.volume({ days, period });
        return data.map(decorateVolumePoint);
      } catch {
        return mockDashboard.volumeTrend.map((item) => ({ ...item, total_calls: item.calls, analyzed_calls: item.analyzed }));
      }
    },
  });
};

export const useSentimentBreakdown = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'sentiment', days],
    queryFn: async () => {
      try {
        return decorateSentiment(await dashboardApi.sentiment({ days }));
      } catch {
        return {
          sentiment_distribution: {
            positive: 58,
            neutral: 29,
            negative: 13,
          },
        };
      }
    },
  });
};

export const useScoreTrend = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'score-trend', days],
    queryFn: async () => {
      try {
        const data = await dashboardApi.scores({ days });
        return (data.trend || data || []).map(decorateScoreTrend);
      } catch {
        return mockDashboard.scoreTrend.map((item) => ({ ...item, average_score: item.score }));
      }
    },
  });
};

export const useLeaderboard = (limit = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'leaderboard', limit],
    queryFn: async () => {
      try {
        const data = await dashboardApi.leaderboard({ limit });
        return (data || []).map(decorateAgent);
      } catch {
        return mockAgents.slice(0, limit).map((agent) => decorateAgent({
          ...agent,
          avg_score: agent.average_score,
          total_calls: agent.calls,
        }));
      }
    },
  });
};

export const useTopics = (days = 30, limit = 8) => {
  return useQuery({
    queryKey: ['dashboard', 'topics', days, limit],
    queryFn: async () => {
      try {
        return await dashboardApi.topics({ days, limit });
      } catch {
        return [
          { label: 'Billing', topic: 'Billing', count: 24 },
          { label: 'Technical Support', topic: 'Technical Support', count: 18 },
          { label: 'Refund', topic: 'Refund', count: 14 },
          { label: 'Retention', topic: 'Retention', count: 12 },
        ];
      }
    },
  });
};

export const useChannelDistribution = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'channels', days],
    queryFn: async () => {
      try {
        return await dashboardApi.breakdown({ days, by: 'channel' });
      } catch {
        return [{ channel: 'phone', count: mockCalls.length }];
      }
    },
  });
};

export const useLanguageDistribution = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'languages', days],
    queryFn: async () => {
      try {
        return await dashboardApi.breakdown({ days, by: 'language' });
      } catch {
        return [{ language: 'english', count: mockCalls.length }];
      }
    },
  });
};
