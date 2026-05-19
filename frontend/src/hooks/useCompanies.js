import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/Toast';

const normalizePlan = (plan) => {
  const plans = {
    starter: 'free',
    professional: 'pro',
    enterprise: 'enterprise',
  };
  return plans[plan] || plan || 'free';
};

const decorateCompany = (company) => ({
  ...company,
  domain: company.domain || '',
  plan: company.plan === 'free' ? 'starter' : company.plan === 'pro' ? 'professional' : company.plan,
  status: company.status || (company.is_active ? 'active' : 'suspended'),
  user_count: company.user_count || 0,
  call_count: company.call_count || 0,
});

const decorateCompanyPage = (data) => ({
  ...data,
  results: (data.results || []).map(decorateCompany),
});

export const useCompanies = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['companies', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get('/companies/', { params: { page, page_size: pageSize } });
      return decorateCompanyPage(data);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCompany = (companyId) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/`);
      return decorateCompany(data);
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
      const payload = {
        name: companyData.name,
        plan: normalizePlan(companyData.plan),
      };
      const { data } = await api.post('/companies/', payload);
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
      const payload = { ...updateData };
      if (payload.plan) {
        payload.plan = normalizePlan(payload.plan);
      }
      if (payload.status) {
        payload.is_active = payload.status === 'active';
        delete payload.status;
      }
      delete payload.domain;
      const { data } = await api.patch(`/companies/${companyId}/`, payload);
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
      const { data: company } = await api.get(`/companies/${companyId}/`);
      const { data } = await api.patch(`/companies/${companyId}/`, {
        is_active: !company.is_active,
      });
      return decorateCompany(data);
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
      const { data } = await api.get('/companies/', { params: { page_size: 1000 } });
      const companies = data.results || [];

      return {
        total_companies: data.count || companies.length,
        total_users: companies.reduce((sum, company) => sum + (company.user_count || 0), 0),
        total_calls: companies.reduce((sum, company) => sum + (company.call_count || 0), 0),
        trial_companies: companies.filter((company) => company.plan === 'free').length,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
