import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async ({ type, format, params = {} }) => {
      const response = await api.get(`reports/${type}/`, {
        params: { ...params, format },
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
      const response = await api.get(`reports/company/${companyId}/`, {
        params: { ...params, format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `company-report-${companyId}.${format}`;
      
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
