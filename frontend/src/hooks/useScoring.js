import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useScoringConfig = (companyId) => {
  return useQuery({
    queryKey: ['scoring-config', companyId],
    queryFn: async () => {
      const response = await api.get(`companies/${companyId}/scoring/`);
      return response.data;
    },
    enabled: !!companyId,
  });
};

export const useUpdateScoring = (companyId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scoringData) => {
      const response = await api.put(`companies/${companyId}/scoring/`, scoringData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-config', companyId] });
    },
  });
};

export const useResetScoring = (companyId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`companies/${companyId}/scoring/reset/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-config', companyId] });
    },
  });
};
