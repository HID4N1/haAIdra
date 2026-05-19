import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '../lib/api';
import { mockCalls } from '../lib/mockData';

const ACTIVE_STATUSES = new Set(['pending', 'queued', 'processing', 'running']);

const mockAnalysisFor = (callId) => {
  const call = mockCalls.find((item) => String(item.id) === String(callId)) || mockCalls[0];
  return {
    status: call.status,
    transcript: call.transcript,
    sentiment: call.sentiment,
    topics: call.topics,
    score: call.quality_score,
    scores: call.scores,
    summary: call.summary,
    coaching_notes: call.coaching_notes,
  };
};

const segmentsToText = (segments) => {
  if (!Array.isArray(segments)) return '';
  return segments.map((segment) => {
    if (typeof segment === 'string') return segment;
    const speaker = segment.speaker ? `${segment.speaker}: ` : '';
    return `${speaker}${segment.text || segment.transcript || segment.content || ''}`;
  }).filter(Boolean).join('\n');
};

const normalizeAnalysis = (data = {}) => {
  const score = data.score || {};
  const summary = data.summary || {};
  const sentiment = data.sentiment || {};
  const topic = data.topic || {};
  const transcript = data.transcript || {};

  return {
    ...data,
    status: data.status || data.call_status || 'pending',
    job_status: data.job_status,
    current_step: data.current_step,
    progress: data.progress ?? 0,
    display_status: data.display_status,
    error: data.error || data.error_message || null,
    retry_count: data.retry_count || 0,
    transcript_segments: transcript.segments || data.transcript_segments || [],
    transcript: data.transcript_text || transcript.text || segmentsToText(transcript.segments) || (typeof data.transcript === 'string' ? data.transcript : ''),
    sentiment: sentiment.overall_label || data.sentiment_label || (typeof data.sentiment === 'string' ? data.sentiment : '') || 'neutral',
    sentiment_score: sentiment.overall_score,
    topics: topic.topics || data.topics || [],
    score: score.total ?? score.ai_total ?? data.score ?? null,
    scores: {
      accueil: score.accueil,
      empathie: score.empathie,
      resolution: score.resolution,
      langage: score.langage,
      conformite: score.conformite,
      cloture: score.cloture,
    },
    summary_details: {
      motif: summary.motif || '',
      actions: summary.actions || '',
      outcome: summary.outcome || '',
      recommendations: summary.recommendations || '',
    },
    summary: summary.outcome || summary.motif || (typeof data.summary === 'string' ? data.summary : '') || '',
    coaching_notes: summary.recommendations || summary.actions || data.coaching_notes || '',
    raw: data,
  };
};

export const useAnalysis = (callId) => {
  return useQuery({
    queryKey: ['analysis', callId],
    queryFn: async () => {
      try {
        return normalizeAnalysis(await analysisApi.detail(callId));
      } catch (error) {
        console.error('Using mock analysis because analysis endpoint is unavailable:', error?.message);
        return normalizeAnalysis(mockAnalysisFor(callId));
      }
    },
    enabled: !!callId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && (ACTIVE_STATUSES.has(data.status) || ACTIVE_STATUSES.has(data.job_status)) ? 4000 : false;
    },
  });
};

export const useTriggerAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId) => {
      return analysisApi.trigger(callId);
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
      return normalizeAnalysis(await analysisApi.detail(callId)).transcript;
    },
    enabled: !!callId,
  });
};

export const useSentiment = (callId) => {
  return useQuery({
    queryKey: ['sentiment', callId],
    queryFn: async () => {
      return normalizeAnalysis(await analysisApi.detail(callId)).sentiment;
    },
    enabled: !!callId,
  });
};

export const useScore = (callId) => {
  return useQuery({
    queryKey: ['score', callId],
    queryFn: async () => {
      return normalizeAnalysis(await analysisApi.detail(callId)).score;
    },
    enabled: !!callId,
  });
};

export const useSummary = (callId) => {
  return useQuery({
    queryKey: ['summary', callId],
    queryFn: async () => {
      return normalizeAnalysis(await analysisApi.detail(callId)).summary;
    },
    enabled: !!callId,
  });
};
