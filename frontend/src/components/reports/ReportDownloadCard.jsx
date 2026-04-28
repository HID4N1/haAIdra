import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useDownloadReport } from '../../hooks/useReports';
import { useToast } from '../ui/Toast';
import { useAgents } from '../../hooks/useUsers';

export const ReportDownloadCard = ({ 
  reportType, 
  title, 
  description, 
  formats = ['pdf', 'excel'],
  requiresAgent = false,
  requiresDateRange = true,
  icon 
}) => {
  const { success, error } = useToast();
  const downloadMutation = useDownloadReport();
  const { data: agents } = useAgents({ limit: 100 });
  
  const [selectedFormat, setSelectedFormat] = useState(formats[0]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const handleDownload = async () => {
    try {
      const params = {};
      
      if (requiresAgent && selectedAgent) {
        params.agent_id = selectedAgent;
      }
      
      if (requiresDateRange) {
        if (dateRange.start) params.start_date = dateRange.start;
        if (dateRange.end) params.end_date = dateRange.end;
      }

      await downloadMutation.mutateAsync({
        type: reportType,
        format: selectedFormat,
        params,
      });
      
      success(`${title} report generated successfully`);
    } catch (err) {
      error('Failed to generate report');
    }
  };

  const isDisabled = downloadMutation.isPending || 
    (requiresAgent && !selectedAgent) ||
    (requiresDateRange && (!dateRange.start || !dateRange.end));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <div className="w-6 h-6 text-primary-500">
                {icon}
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="flex space-x-2">
              {formats.map((format) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                  className="capitalize"
                >
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Agent Selection */}
          {requiresAgent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select an agent</option>
                {agents?.results?.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          {requiresDateRange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={isDisabled}
            loading={downloadMutation.isPending}
            className="w-full"
          >
            {downloadMutation.isPending ? 'Generating...' : `Download ${title}`}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Report type configurations
export const reportConfigs = [
  {
    type: 'company',
    title: 'Company Report',
    description: 'Overall company performance and metrics',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    type: 'agent',
    title: 'Agent Performance',
    description: 'Individual agent performance reports',
    formats: ['pdf', 'excel'],
    requiresAgent: true,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    type: 'quality',
    title: 'Quality Metrics',
    description: 'Call quality and scoring analysis',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    type: 'sentiment',
    title: 'Sentiment Analysis',
    description: 'Customer sentiment trends and insights',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'qa',
    title: 'QA Reviews',
    description: 'Quality assurance review reports',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'scores',
    title: 'Score Distribution',
    description: 'Detailed scoring breakdown and distribution',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    type: 'flagged',
    title: 'Flagged Calls',
    description: 'Reports on flagged and problematic calls',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
  {
    type: 'topics',
    title: 'Topic Analysis',
    description: 'Call topics and conversation themes',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    type: 'comparative',
    title: 'Comparative Analysis',
    description: 'Compare performance across periods and agents',
    formats: ['pdf', 'excel'],
    requiresAgent: false,
    requiresDateRange: true,
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];
