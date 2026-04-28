import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatNumber } from '../../lib/utils';

export const ScoreTrend = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No score trend data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatXAxis = (value) => {
    return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
          <p className="text-sm font-medium mb-2">{formatXAxis(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value, 2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate trend
  const latestScore = data[data.length - 1]?.average_score || 0;
  const previousScore = data[data.length - 2]?.average_score || 0;
  const trend = latestScore - previousScore;
  const trendPercentage = previousScore > 0 ? (trend / previousScore) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Score Trend</CardTitle>
          <div className="flex items-center">
            <div className={cn(
              'flex items-center text-sm font-medium',
              trend > 0 ? 'text-secondary-600' : trend < 0 ? 'text-danger-600' : 'text-gray-500'
            )}>
              {trend > 0 ? (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : trend < 0 ? (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : null}
              {trend !== 0 && `${Math.abs(trendPercentage).toFixed(1)}%`}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={formatXAxis}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                domain={[0, 1]}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="average_score"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-xs text-gray-500">Current</p>
            <p className="text-lg font-semibold text-primary-600">
              {formatNumber(latestScore, 2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Period High</p>
            <p className="text-lg font-semibold text-secondary-600">
              {formatNumber(Math.max(...data.map(d => d.average_score || 0)), 2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Period Low</p>
            <p className="text-lg font-semibold text-danger-600">
              {formatNumber(Math.min(...data.map(d => d.average_score || 0)), 2)}
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
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-80 w-full" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center">
            <Skeleton className="h-3 w-12 mx-auto mb-1" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');
