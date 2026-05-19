import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { callsApi } from '../lib/api';
import { mockCalls } from '../lib/mockData';

const listOf = (data) => Array.isArray(data) ? data : data?.results || data?.items || [];
const ACTIVE_STATUSES = new Set(['pending', 'queued', 'processing', 'running']);

const compactParams = (params = {}) => {
  const callStatus = ['pending', 'processing', 'analyzed', 'failed'].includes(params.status) ? params.status : undefined;
  const backendParams = {
    status: callStatus,
    agent: params.agent_id || undefined,
    language: params.language || undefined,
    channel: params.channel || undefined,
    is_flagged: params.is_flagged || undefined,
    resolution_status: params.resolution_status || undefined,
    uploaded_at_from: params.uploaded_at_from || params.date_from || undefined,
    uploaded_at_to: params.uploaded_at_to || params.date_to || undefined,
    score_min: params.score_min || undefined,
    score_max: params.score_max || undefined,
    search: params.search || undefined,
    ordering: params.ordering || undefined,
    page: params.page || undefined,
    page_size: params.page_size || undefined,
  };

  return Object.fromEntries(Object.entries(backendParams).filter(([, value]) => value !== '' && value != null));
};

const agentDisplay = (agent) => {
  if (!agent) return 'Unassigned';
  if (typeof agent === 'string') return agent;
  const user = agent.user || agent;
  return user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || `Agent ${agent.id}`;
};

const normalizeCall = (call) => ({
  ...call,
  title: call.title || call.name || call.call_name || call.client_phone || `Call ${String(call.id).slice(0, 8)}`,
  agent_name: call.agent_name || agentDisplay(call.agent),
  agent_id: call.agent_id || call.agent?.id,
  customer_name: call.customer_name || call.customer || call.customer_full_name || call.client_phone || 'Unknown customer',
  quality_score: call.quality_score ?? call.score ?? call.overall_score ?? null,
  sentiment: call.sentiment || call.sentiment_label || 'neutral',
  status: call.status || 'pending',
  job_status: call.job_status || call.pipeline?.status || call.pipeline_job?.status,
  current_step: call.current_step || call.pipeline?.current_step || call.pipeline_job?.current_step,
  progress: call.progress ?? call.pipeline?.progress ?? call.pipeline_job?.progress ?? 0,
  display_status: call.display_status || call.pipeline?.display_status || call.pipeline_job?.display_status,
  error_message: call.error_message || call.pipeline?.error_message || call.pipeline_job?.error_message || '',
  duration: call.duration || call.duration_seconds || 0,
  topics: call.topics || call.topic_tags || [],
  scores: call.scores || call.score_breakdown || {},
  audio_url: call.audio_url || call.audio_file?.s3_url || '',
  created_at: call.created_at || call.uploaded_at,
});

const applyClientFilters = (calls, params) => calls.filter((call) => {
  const search = params.search?.toLowerCase();
  if (search && !`${call.title} ${call.agent_name} ${call.customer_name} ${call.id}`.toLowerCase().includes(search)) return false;
  if (params.status && call.status !== params.status && call.job_status !== params.status) return false;
  if (params.sentiment && call.sentiment !== params.sentiment) return false;
  if (params.agent && !call.agent_name.toLowerCase().includes(params.agent.toLowerCase())) return false;
  return true;
});

export const useCalls = (params = {}) => {
  return useQuery({
    queryKey: ['calls', params],
    queryFn: async () => {
      try {
        const data = await callsApi.list(compactParams(params));
        const normalized = listOf(data).map(normalizeCall);
        const filtered = applyClientFilters(normalized, {
          sentiment: params.sentiment,
          agent: params.agent,
          search: params.search,
        });
        return {
          ...(Array.isArray(data) ? {} : data),
          results: filtered,
        };
      } catch (error) {
        console.error('Using mock calls because calls endpoint is unavailable:', error?.message);
        const results = applyClientFilters(mockCalls.map(normalizeCall), params);
        return { results, count: results.length, isMock: true };
      }
    },
    refetchInterval: (query) => {
      const results = query.state.data?.results || [];
      return results.some((call) => ACTIVE_STATUSES.has(call.status) || ACTIVE_STATUSES.has(call.job_status)) ? 4000 : false;
    },
  });
};

export const useCallDetail = (id) => {
  return useQuery({
    queryKey: ['call', id],
    queryFn: async () => {
      try {
        return normalizeCall(await callsApi.detail(id));
      } catch (error) {
        console.error('Using mock call detail because call endpoint is unavailable:', error?.message);
        return mockCalls.map(normalizeCall).find((call) => String(call.id) === String(id)) || null;
      }
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const call = query.state.data;
      return call && (ACTIVE_STATUSES.has(call.status) || ACTIVE_STATUSES.has(call.job_status)) ? 4000 : false;
    },
  });
};

export const useCall = useCallDetail;

export const useUploadCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      if (formData?.formData) {
        return callsApi.upload(formData.formData, formData.onUploadProgress);
      }
      return callsApi.upload(formData);
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
      return callsApi.update(id, data);
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
