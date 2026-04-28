import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatNumber, formatPercentage } from '../../lib/utils';

export const SentimentBreakdown = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || !data.sentiment_distribution) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No sentiment data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Positive',
      value: data.sentiment_distribution.positive || 0,
      color: '#10b981',
    },
    {
      name: 'Neutral',
      value: data.sentiment_distribution.neutral || 0,
      color: '#f59e0b',
    },
    {
      name: 'Negative',
      value: data.sentiment_distribution.negative || 0,
      color: '#ef4444',
    },
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} calls ({formatPercentage(data.value / total)})
          </p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value} ({formatPercentage(entry.payload.value / total)})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-secondary-100 rounded-full mx-auto mb-1">
              <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-500">Positive</p>
            <p className="text-lg font-semibold text-secondary-600">
              {formatNumber(data.sentiment_distribution.positive || 0)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-warning-100 rounded-full mx-auto mb-1">
              <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-500">Neutral</p>
            <p className="text-lg font-semibold text-warning-600">
              {formatNumber(data.sentiment_distribution.neutral || 0)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-danger-100 rounded-full mx-auto mb-1">
              <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-500">Negative</p>
            <p className="text-lg font-semibold text-danger-600">
              {formatNumber(data.sentiment_distribution.negative || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-80 w-full" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center">
            <Skeleton className="w-8 h-8 rounded-full mx-auto mb-1" />
            <Skeleton className="h-3 w-12 mx-auto mb-1" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
