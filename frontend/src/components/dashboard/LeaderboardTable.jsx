import React from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Skeleton } from '../ui/Skeleton';
import { formatNumber } from '../../lib/utils';

export const LeaderboardTable = ({ data, loading }) => {
  if (loading) {
    return <TableSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No leaderboard data available</p>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">3</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-gray-600 text-sm font-bold">{rank}</span>
      </div>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-secondary-600';
    if (score >= 0.6) return 'text-primary-600';
    return 'text-danger-600';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Total Calls</TableHead>
            <TableHead>Avg Score</TableHead>
            <TableHead>Resolution Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((agent, index) => (
            <motion.tr
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                'hover:bg-gray-50',
                index < 3 && 'bg-gradient-to-r from-transparent via-gray-50 to-transparent'
              )}
            >
              <TableCell>
                <div className="flex items-center">
                  {getRankIcon(index + 1)}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">
                    {agent.first_name} {agent.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{agent.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{agent.total_calls || 0}</span>
              </TableCell>
              <TableCell>
                <span className={cn('font-bold', getScoreColor(agent.average_score))}>
                  {formatNumber(agent.average_score || 0, 2)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span className="font-medium">
                    {formatNumber((agent.resolution_rate || 0) * 100, 1)}%
                  </span>
                  <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-secondary-500 h-2 rounded-full"
                      style={{ width: `${(agent.resolution_rate || 0) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Total Calls</TableHead>
          <TableHead>Avg Score</TableHead>
          <TableHead>Resolution Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <TableCell>
              <Skeleton className="w-8 h-8 rounded-full" />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-2 w-16" />
              </div>
            </TableCell>
          </tr>
        ))}
      </TableBody>
    </Table>
  </div>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');
