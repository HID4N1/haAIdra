import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';

export const VolumeChart = ({ data, loading, onPeriodChange, currentPeriod = 'daily' }) => {
  const [chartType, setChartType] = useState('bar');

  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No volume data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatXAxis = (value) => {
    if (currentPeriod === 'daily') {
      return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (currentPeriod === 'weekly') {
      return `Week ${value}`;
    } else {
      return new Date(value).toLocaleDateString([], { month: 'short' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Call Volume</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {['daily', 'weekly', 'monthly'].map((period) => (
                <Button
                  key={period}
                  variant={currentPeriod === period ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onPeriodChange(period)}
                  className="capitalize"
                >
                  {period}
                </Button>
              ))}
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={chartType === 'bar' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Button>
              <Button
                variant={chartType === 'line' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatXAxis}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'total_calls' ? 'Total Calls' :
                    name === 'analyzed_calls' ? 'Analyzed Calls' :
                    name === 'flagged_calls' ? 'Flagged Calls' : name
                  ]}
                  labelFormatter={(label) => formatXAxis(label)}
                />
                <Legend
                  formatter={(value) => 
                    value === 'total_calls' ? 'Total Calls' :
                    value === 'analyzed_calls' ? 'Analyzed Calls' :
                    value === 'flagged_calls' ? 'Flagged Calls' : value
                  }
                />
                <Bar dataKey="total_calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="analyzed_calls" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged_calls" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatXAxis}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'total_calls' ? 'Total Calls' :
                    name === 'analyzed_calls' ? 'Analyzed Calls' :
                    name === 'flagged_calls' ? 'Flagged Calls' : name
                  ]}
                  labelFormatter={(label) => formatXAxis(label)}
                />
                <Legend
                  formatter={(value) => 
                    value === 'total_calls' ? 'Total Calls' :
                    value === 'analyzed_calls' ? 'Analyzed Calls' :
                    value === 'flagged_calls' ? 'Flagged Calls' : value
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total_calls"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="analyzed_calls"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="flagged_calls"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
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
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-80 w-full" />
    </CardContent>
  </Card>
);
