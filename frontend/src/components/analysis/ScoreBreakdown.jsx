import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';
import { useScore } from '../../hooks/useAnalysis';
import { Skeleton } from '../ui/Skeleton';
import { formatNumber } from '../../lib/utils';

export const ScoreBreakdown = ({ callId, chartType = 'bar' }) => {
  const { data: score, isLoading, error } = useScore(callId);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load score data</p>
      </div>
    );
  }

  if (!score || !score.dimensions) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No score data available</p>
      </div>
    );
  }

  const dimensions = [
    { name: 'Accueil', score: score.dimensions.accueil || 0, max: 1 },
    { name: 'Empathie', score: score.dimensions.empathie || 0, max: 1 },
    { name: 'Resolution', score: score.dimensions.resolution || 0, max: 1 },
    { name: 'Langage', score: score.dimensions.langage || 0, max: 1 },
    { name: 'Conformité', score: score.dimensions.conformite || 0, max: 1 },
    { name: 'Clôture', score: score.dimensions.cloture || 0, max: 1 },
  ];

  const radarData = dimensions.map(dim => ({
    dimension: dim.name,
    score: dim.score,
    fullMark: 1,
  }));

  const barData = dimensions.map(dim => ({
    dimension: dim.name,
    score: dim.score,
    percentage: (dim.score / dim.max) * 100,
  }));

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981'; // good
    if (score >= 0.6) return '#f59e0b'; // average
    return '#ef4444'; // poor
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Overall Score</h3>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 text-primary-600"
        >
          <span className="text-2xl font-bold">
            {formatNumber(score.overall_score || 0, 2)}
          </span>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'radar' ? (
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dimension" stroke="#6b7280" fontSize={12} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 1]}
                stroke="#6b7280"
                fontSize={10}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value) => [value.toFixed(2), 'Score']}
              />
            </RadarChart>
          ) : (
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dimension"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                domain={[0, 1]}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                formatter={(value) => [value.toFixed(2), 'Score']}
              />
              <Bar
                dataKey="score"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={800}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Dimension Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {dimensions.map((dimension, index) => (
          <motion.div
            key={dimension.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {dimension.name}
              </span>
              <span className="text-sm font-bold" style={{ color: getScoreColor(dimension.score) }}>
                {formatNumber(dimension.score, 2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dimension.percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-2 rounded-full"
                style={{ backgroundColor: getScoreColor(dimension.score) }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ChartSkeleton = () => (
  <div className="space-y-6">
    <div className="text-center">
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-20 w-20 rounded-full mx-auto" />
    </div>
    <Skeleton className="h-80 w-full" />
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  </div>
);
