import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const useCompanies = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['companies', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get(`/companies/?page=${page}&page_size=${pageSize}`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCompany = (companyId) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/`);
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (companyData) => {
      const { data } = await api.post('/companies/', companyData);
      return data;
    },
    onSuccess: (data) => {
      success('Company created successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      return data;
    },
    onError: (err) => {
      error('Failed to create company');
      throw err;
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ companyId, ...updateData }) => {
      const { data } = await api.patch(`/companies/${companyId}/`, updateData);
      return data;
    },
    onSuccess: (data, variables) => {
      success('Company updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.companyId] });
      return data;
    },
    onError: (err) => {
      error('Failed to update company');
      throw err;
    },
  });
};

export const useToggleCompanyStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (companyId) => {
      const { data } = await api.post(`/companies/${companyId}/toggle-status/`);
      return data;
    },
    onSuccess: (data, companyId) => {
      const newStatus = data.status;
      success(`Company ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      return data;
    },
    onError: (err) => {
      error('Failed to update company status');
      throw err;
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (companyId) => {
      await api.delete(`/companies/${companyId}/`);
      return companyId;
    },
    onSuccess: (companyId) => {
      success('Company deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      return companyId;
    },
    onError: (err) => {
      error('Failed to delete company');
      throw err;
    },
  });
};

export const useCompanyStats = () => {
  return useQuery({
    queryKey: ['company-stats'],
    queryFn: async () => {
      const { data } = await api.get('/companies/stats/');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
