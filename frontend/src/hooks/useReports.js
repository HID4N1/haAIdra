import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { mockReports } from '../lib/mockData';

export const useReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      try {
        const response = await api.get('reports/', { params });
        const data = response.data;
        return Array.isArray(data) ? data : data?.results || data?.items || [];
      } catch (error) {
        console.error('Using mock reports because reports endpoint is unavailable:', error?.message);
        return mockReports;
      }
    },
  });
};

const reportPaths = {
  company: 'company/',
  agent: 'agent/',
  quality: 'call-quality/',
  'call-quality': 'call-quality/',
  sentiment: 'sentiment/',
  qa: 'qa/',
  scores: 'scores/',
  flagged: 'flagged/',
  topics: 'topics/',
  comparative: 'comparative/',
};

const normalizeReportParams = (params = {}) => {
  const normalized = { ...params };

  if (normalized.start_date) {
    normalized.from = normalized.start_date;
    delete normalized.start_date;
  }

  if (normalized.end_date) {
    normalized.to = normalized.end_date;
    delete normalized.end_date;
  }

  return normalized;
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async ({ type, format, params = {} }) => {
      const path = reportPaths[type] || `${type}/`;
      const agentId = params.agent_id;
      const endpoint = path === 'agent/' && agentId
        ? `reports/agent/${agentId}/`
        : `reports/${path}`;

      const response = await api.get(endpoint, {
        params: { ...normalizeReportParams(params), format },
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `report-${type}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
  });
};

export const useDownloadCompanyReport = () => {
  return useMutation({
    mutationFn: async ({ companyId, format, params = {} }) => {
      const response = await api.get('reports/company/', {
        params: { ...normalizeReportParams(params), format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `company-report-${companyId || 'current'}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
  });
};

export const useDownloadAgentReport = () => {
  return useMutation({
    mutationFn: async ({ agentId, format, params = {} }) => {
      const response = await api.get(`reports/agent/${agentId}/`, {
        params: { ...params, format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `agent-report-${agentId}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
  });
};
