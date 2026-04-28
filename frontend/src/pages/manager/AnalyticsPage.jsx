import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { 
  useAnalytics, 
  usePerformanceTrends, 
  useAgentPerformance, 
  useChannelDistribution, 
  useSentimentAnalysis, 
  useQualityMetrics 
} from '../../hooks/useAnalytics';
import { formatNumber, formatDate } from '../../lib/utils';
import { PageSpinner } from '../../components/ui/Spinner';

const COLORS = {
  primary: '#6366f1',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
};

export const ManagerAnalyticsPage = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('score');

  // Use real API calls instead of mock data
  const { data: qualityMetrics, isLoading: qualityLoading } = useQualityMetrics(selectedPeriod);
  const { data: performanceTrends, isLoading: trendsLoading } = usePerformanceTrends(selectedPeriod);
  const { data: agentPerformance, isLoading: agentLoading } = useAgentPerformance(selectedPeriod);
  const { data: channelDistribution, isLoading: channelLoading } = useChannelDistribution(selectedPeriod);
  const { data: sentimentAnalysis, isLoading: sentimentLoading } = useSentimentAnalysis(selectedPeriod);

  // Combine loading states
  const isLoading = qualityLoading || trendsLoading || agentLoading || channelLoading || sentimentLoading;

  // Handle loading state
  if (isLoading) {
    return <PageSpinner />;
  }

  // Handle error state - data will be undefined if API fails
  const data = {
    performanceTrends: performanceTrends || [],
    agentPerformance: agentPerformance || [],
    channelDistribution: channelDistribution || [],
    sentimentAnalysis: sentimentAnalysis || [],
    qualityMetrics: qualityMetrics || {
      overallScore: 0,
      resolutionRate: 0,
      customerSatisfaction: 0,
      firstCallResolution: 0,
      averageHandlingTime: 0,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">
            Deep dive into team performance metrics and trends
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Score</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatNumber(data.qualityMetrics.overallScore, 2)}
                  </p>
                  <p className="text-xs text-secondary-600 mt-1">+3.2% vs last period</p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-2xl font-bold text-secondary-600">
                    {formatNumber(data.qualityMetrics.resolutionRate * 100, 1)}%
                  </p>
                  <p className="text-xs text-secondary-600 mt-1">+1.8% vs last period</p>
                </div>
                <div className="w-12 h-12 bg-secondary-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                  <p className="text-2xl font-bold text-warning-600">
                    {formatNumber(data.qualityMetrics.customerSatisfaction * 100, 1)}%
                  </p>
                  <p className="text-xs text-secondary-600 mt-1">+2.1% vs last period</p>
                </div>
                <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">First Call Resolution</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(data.qualityMetrics.firstCallResolution * 100, 1)}%
                  </p>
                  <p className="text-xs text-secondary-600 mt-1">+4.5% vs last period</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Handling Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.qualityMetrics.averageHandlingTime, 1)}m
                  </p>
                  <p className="text-xs text-warning-600 mt-1">-0.3m vs last period</p>
                </div>
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Call Volume vs Flagged Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="totalCalls" fill={COLORS.primary} />
                    <Bar dataKey="flaggedRate" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Agent Performance and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agent Performance</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={selectedMetric === 'score' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMetric('score')}
                  >
                    Score
                  </Button>
                  <Button
                    variant={selectedMetric === 'calls' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMetric('calls')}
                  >
                    Calls
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.agentPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                    <Tooltip />
                    <Bar 
                      dataKey={selectedMetric === 'score' ? 'score' : 'calls'} 
                      fill={COLORS.primary}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Channel Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.channelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="calls"
                    >
                      {data.channelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sentiment Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Sentiment Distribution</h4>
                <div className="space-y-3">
                  {data.sentimentAnalysis.map((item) => (
                    <div key={item.sentiment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          item.sentiment === 'Positive' ? 'bg-secondary-500' :
                          item.sentiment === 'Neutral' ? 'bg-warning-500' :
                          'bg-danger-500'
                        )}></div>
                        <span className="text-sm font-medium text-gray-900">{item.sentiment}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{item.count}</span>
                        <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Key Insights</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <p className="text-sm font-medium text-secondary-800">Positive Trend</p>
                    <p className="text-sm text-gray-600">
                      58% of interactions are positive, showing strong customer satisfaction.
                    </p>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-lg">
                    <p className="text-sm font-medium text-warning-800">Improvement Area</p>
                    <p className="text-sm text-gray-600">
                      Focus on reducing negative interactions from 7% to below 5%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');