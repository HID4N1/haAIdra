import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { agentsApi } from '../lib/api';
import { mockAgents } from '../lib/mockData';

const normalizeAgent = (agent) => ({
  ...agent,
  name: agent.name || [agent.first_name, agent.last_name].filter(Boolean).join(' ') || agent.user?.email || agent.email || 'Agent',
  email: agent.email || agent.user?.email || '',
  role: agent.role || agent.user?.role || 'agent',
  calls: agent.calls ?? agent.total_calls ?? agent.call_count ?? 0,
  average_score: agent.average_score ?? agent.avg_score ?? agent.period_avg_score ?? 0,
  average_sentiment: agent.average_sentiment || agent.sentiment || agent.period_avg_sentiment || 'neutral',
  performance: agent.performance || (Number(agent.average_score ?? agent.avg_score ?? 0) >= 85 ? 'Strong' : 'Coaching'),
});

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
      try {
        const data = await agentsApi.list(params);
        const results = Array.isArray(data) ? data : data?.results || data?.items || [];
        return { ...(Array.isArray(data) ? {} : data), results: results.map(normalizeAgent) };
      } catch (error) {
        console.error('Using mock agents because agents endpoint is unavailable:', error?.message);
        return { results: mockAgents.map(normalizeAgent), count: mockAgents.length, isMock: true };
      }
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
