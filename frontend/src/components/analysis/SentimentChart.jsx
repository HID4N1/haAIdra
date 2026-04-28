import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSentiment } from '../../hooks/useAnalysis';
import { Skeleton } from '../ui/Skeleton';

export const SentimentChart = ({ callId }) => {
  const { data: sentiment, isLoading, error } = useSentiment(callId);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load sentiment data</p>
      </div>
    );
  }

  if (!sentiment || !sentiment.timeline || sentiment.timeline.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No sentiment data available</p>
      </div>
    );
  }

  const chartData = sentiment.timeline.map(point => ({
    time: point.timestamp,
    sentiment: point.sentiment_score,
    label: new Date(point.timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  const getSentimentColor = (value) => {
    if (value > 0.3) return '#10b981'; // positive
    if (value < -0.3) return '#ef4444'; // negative
    return '#f59e0b'; // neutral
  };

  const overallSentiment = sentiment.overall_sentiment;
  const sentimentColor = getSentimentColor(overallSentiment);
  const sentimentLabel = overallSentiment > 0.3 ? 'Positive' : 
                        overallSentiment < -0.3 ? 'Negative' : 'Neutral';

  return (
    <div className="space-y-4">
      {/* Overall Sentiment Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Sentiment Analysis</h3>
        <div
          className="px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: sentimentColor }}
        >
          {sentimentLabel}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip
              formatter={(value) => [value.toFixed(2), 'Sentiment']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke={sentimentColor}
              fill={sentimentColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">Positive</p>
          <p className="text-lg font-semibold text-secondary-600">
            {sentiment.positive_percentage?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Neutral</p>
          <p className="text-lg font-semibold text-warning-600">
            {sentiment.neutral_percentage?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Negative</p>
          <p className="text-lg font-semibold text-danger-600">
            {sentiment.negative_percentage?.toFixed(1) || 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

const ChartSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <Skeleton className="h-4 w-16 mx-auto mb-1" />
        <Skeleton className="h-6 w-12 mx-auto" />
      </div>
      <div className="text-center">
        <Skeleton className="h-4 w-16 mx-auto mb-1" />
        <Skeleton className="h-6 w-12 mx-auto" />
      </div>
      <div className="text-center">
        <Skeleton className="h-4 w-16 mx-auto mb-1" />
        <Skeleton className="h-6 w-12 mx-auto" />
      </div>
    </div>
  </div>
);