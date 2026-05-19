import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const periodToDays = (period) => {
  if (typeof period === 'number') return period;
  const value = String(period || '30d').toLowerCase();
  if (value.endsWith('y')) return Number(value.replace('y', '')) * 365;
  if (value.endsWith('d')) return Number(value.replace('d', ''));
  return Number(value) || 30;
};

const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

export const useAnalytics = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const { data } = await api.get('dashboard/kpi/', { params: { days: periodToDays(period) } });
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
      const days = periodToDays(period);
      const [{ data: volume }, { data: scores }] = await Promise.all([
        api.get('dashboard/calls/volume/', { params: { days, period: days > 120 ? 'monthly' : 'daily' } }),
        api.get('dashboard/scores/', { params: { days } }),
      ]);

      return (volume || []).map((item, index) => {
        const scorePoint = scores?.trend?.[index] || {};
        const totalCalls = item.total_calls || item.count || 0;
        const flaggedCalls = item.flagged_calls || 0;

        return {
          ...item,
          month: item.month || item.week || item.date,
          totalCalls,
          flaggedRate: percent(flaggedCalls, totalCalls),
          avgScore: scorePoint.avg_score || item.avg_score || 0,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAgentPerformance = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'agent-performance', period],
    queryFn: async () => {
      const { data } = await api.get('dashboard/agents/leaderboard/', {
        params: { days: periodToDays(period), limit: 10 },
      });

      return (data || []).map((agent) => ({
        ...agent,
        name: agent.email || agent.name || 'Agent',
        score: agent.period_avg_score || agent.avg_score || 0,
        calls: agent.calls_in_period || agent.total_calls || 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useChannelDistribution = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'channel-distribution', period],
    queryFn: async () => {
      const { data } = await api.get('dashboard/calls/breakdown/', {
        params: { days: periodToDays(period), by: 'channel' },
      });
      const total = (data || []).reduce((sum, item) => sum + (item.count || item.calls || 0), 0);

      return (data || []).map((item) => {
        const calls = item.count || item.calls || 0;
        return {
          ...item,
          channel: item.channel || item.label || item.name,
          calls,
          percentage: item.percentage ?? percent(calls, total),
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSentimentAnalysis = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'sentiment-analysis', period],
    queryFn: async () => {
      const { data } = await api.get('dashboard/sentiment/', {
        params: { days: periodToDays(period) },
      });
      const breakdown = data?.breakdown || {};
      const items = [
        ['Positive', breakdown.positive || breakdown.positive_count || 0],
        ['Neutral', breakdown.neutral || breakdown.neutral_count || 0],
        ['Negative', breakdown.negative || breakdown.negative_count || 0],
      ];
      const total = items.reduce((sum, [, count]) => sum + count, 0);

      return items.map(([sentiment, count]) => ({
        sentiment,
        count,
        percentage: percent(count, total),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useQualityMetrics = (period = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'quality-metrics', period],
    queryFn: async () => {
      const { data } = await api.get('dashboard/kpi/', {
        params: { days: periodToDays(period) },
      });

      return {
        overallScore: data.average_score || data.avg_score || 0,
        resolutionRate: data.resolution_rate || 0,
        customerSatisfaction: data.customer_satisfaction || data.resolution_rate || 0,
        firstCallResolution: data.first_call_resolution || data.resolution_rate || 0,
        averageHandlingTime: data.average_handling_time || data.average_duration || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
