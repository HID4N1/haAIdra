import React from 'react';
import { motion } from 'framer-motion';
import { ReportDownloadCard, reportConfigs } from '../../components/reports/ReportDownloadCard';

export const ReportsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Generate and download comprehensive reports</p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportConfigs.map((config, index) => (
          <motion.div
            key={config.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <ReportDownloadCard
              reportType={config.type}
              title={config.title}
              description={config.description}
              formats={config.formats}
              requiresAgent={config.requiresAgent}
              requiresDateRange={config.requiresDateRange}
              icon={config.icon}
            />
          </motion.div>
        ))}
      </div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-blue-50 rounded-lg p-6"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800">About Reports</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                Reports are generated based on the selected date range and filters. 
                Available formats include PDF for presentation-ready documents and Excel for data analysis.
              </p>
              <p>
                Large reports may take a few minutes to generate. You'll be notified when your report is ready for download.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
