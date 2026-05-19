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
      const response = await api.put(`companies/${companyId}/scoring/`, {
        accueil_weight: '0.20',
        empathie_weight: '0.20',
        resolution_weight: '0.25',
        langage_weight: '0.15',
        conformite_weight: '0.10',
        cloture_weight: '0.10',
        is_active: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-config', companyId] });
    },
  });
};
