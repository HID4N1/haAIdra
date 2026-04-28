import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CallsTable } from '../../components/calls/CallsTable';
import { UploadCallModal } from '../../components/calls/UploadCallModal';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatDate } from '../../lib/utils';

export const CallsPage = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    channel: '',
    language: '',
    is_flagged: '',
    date_from: '',
    date_to: '',
    score_min: '',
    score_max: '',
    search: '',
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      channel: '',
      language: '',
      is_flagged: '',
      date_from: '',
      date_to: '',
      score_min: '',
      score_max: '',
      search: '',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== null && value !== undefined
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
          <p className="text-gray-500">Manage and analyze call recordings</p>
        </div>
        
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Call</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                Clear {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search calls..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="analyzed">Analyzed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel
              </label>
              <select
                value={filters.channel}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Channels</option>
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="chat">Chat</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Languages</option>
                <option value="english">English</option>
                <option value="french">French</option>
                <option value="spanish">Spanish</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
              </select>
            </div>

            {/* Flagged */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flagged
              </label>
              <select
                value={filters.is_flagged}
                onChange={(e) => handleFilterChange('is_flagged', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All</option>
                <option value="true">Flagged</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Score Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Score
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={filters.score_min}
                onChange={(e) => handleFilterChange('score_min', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Score
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={filters.score_max}
                onChange={(e) => handleFilterChange('score_max', e.target.value)}
                placeholder="1.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <CallsTable filters={filters} />
      </motion.div>

      {/* Upload Modal */}
      <UploadCallModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
