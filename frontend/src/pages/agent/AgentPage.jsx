import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../../components/ui/Table';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useCalls } from '../../hooks/useCalls';
import { formatDate, formatDuration, formatNumber } from '../../lib/utils';

export const AgentPage = () => {
  const { user } = useAuth();
  const { data: calls, isLoading } = useCalls({
    agent_id: user?.id,
    limit: 10
  });

  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) {
    return <PageSpinner />;
  }

  const callsList = calls?.results || [];
  const totalPages = Math.ceil((calls?.count || 0) / 10);

  // Calculate agent stats
  const stats = {
    totalCalls: callsList.length,
    avgScore: callsList.length > 0 
      ? callsList.reduce((sum, call) => sum + (call.score || 0), 0) / callsList.length 
      : 0,
    flaggedCalls: callsList.filter(call => call.is_flagged).length,
    avgDuration: callsList.length > 0
      ? callsList.reduce((sum, call) => sum + (call.duration || 0), 0) / callsList.length
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {user?.first_name}! Here's your performance overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.avgScore, 2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flagged Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.flaggedCalls}</p>
                </div>
                <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
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
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(Math.round(stats.avgDuration))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Calls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Calls</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callsList.map((call, index) => (
                    <TableRow key={call.id} delay={index}>
                      <TableCell>
                        <span className="font-medium text-gray-900">#{call.id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(call.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {formatDuration(call.duration)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {call.score ? (
                          <span className="font-medium text-secondary-600">
                            {formatNumber(call.score, 2)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.status}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/calls/${call.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Improve Greeting</p>
                  <p className="text-sm text-gray-500">
                    Start calls with a warm, professional greeting to set the right tone.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Active Listening</p>
                  <p className="text-sm text-gray-500">
                    Show empathy by acknowledging customer concerns before offering solutions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Clear Communication</p>
                  <p className="text-sm text-gray-500">
                    Use simple language and avoid jargon when explaining solutions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <p className="text-sm font-medium text-secondary-800 mb-1">Great Resolution!</p>
                <p className="text-sm text-gray-600">
                  "Excellent problem-solving skills on call #1234. Customer was very satisfied."
                </p>
                <p className="text-xs text-gray-500 mt-2">2 days ago</p>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg">
                <p className="text-sm font-medium text-warning-800 mb-1">Area for Improvement</p>
                <p className="text-sm text-gray-600">
                  "Consider being more patient when explaining complex issues."
                </p>
                <p className="text-xs text-gray-500 mt-2">5 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
