import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '../ui/Table';
import { CallStatusBadge, FlagBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDuration, formatDate, formatNumber } from '../../lib/utils';
import { useCalls, usePatchCall } from '../../hooks/useCalls';
import { useToast } from '../ui/Toast';

export const CallsTable = ({ filters = {} }) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error: fetchError } = useCalls({
    ...filters,
    ordering: sortDirection === 'asc' ? sortField : `-${sortField}`,
    page: currentPage,
  });

  const patchCallMutation = usePatchCall();

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFlagToggle = async (callId, currentFlag) => {
    try {
      await patchCallMutation.mutateAsync(callId, { is_flagged: !currentFlag });
      success(`Call ${!currentFlag ? 'flagged' : 'unflagged'} successfully`);
    } catch (err) {
      error('Failed to update flag status');
    }
  };

  const handleRowClick = (callId) => {
    navigate(`/calls/${callId}`);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load calls. Please try again.</p>
      </div>
    );
  }

  const calls = data?.results || [];
  const totalPages = Math.ceil((data?.count || 0) / 20);

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No calls found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable onSort={() => handleSort('agent__email')}>
              Agent
            </TableHead>
            <TableHead sortable onSort={() => handleSort('language')}>
              Language
            </TableHead>
            <TableHead sortable onSort={() => handleSort('channel')}>
              Channel
            </TableHead>
            <TableHead sortable onSort={() => handleSort('duration')}>
              Duration
            </TableHead>
            <TableHead sortable onSort={() => handleSort('status')}>
              Status
            </TableHead>
            <TableHead sortable onSort={() => handleSort('score')}>
              Score
            </TableHead>
            <TableHead>Flagged</TableHead>
            <TableHead sortable onSort={() => handleSort('created_at')}>
              Uploaded At
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call, index) => (
            <TableRow
              key={call.id}
              delay={index}
              className="cursor-pointer"
              onClick={() => handleRowClick(call.id)}
            >
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">
                    {call.agent?.first_name} {call.agent?.last_name}
                  </div>
                  <div className="text-gray-500 text-sm">{call.agent?.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize">{call.language}</span>
              </TableCell>
              <TableCell>
                <span className="capitalize">{call.channel}</span>
              </TableCell>
              <TableCell>{formatDuration(call.duration)}</TableCell>
              <TableCell>
                <CallStatusBadge status={call.status} />
              </TableCell>
              <TableCell>
                {call.score !== null ? (
                  <span className="font-medium">{formatNumber(call.score, 2)}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFlagToggle(call.id, call.is_flagged)}
                  className={call.is_flagged ? 'text-danger-600' : 'text-gray-400'}
                >
                  <svg
                    className="w-4 h-4"
                    fill={call.is_flagged ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                </Button>
              </TableCell>
              <TableCell>{formatDate(call.created_at)}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRowClick(call.id)}
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
  );
};

const TableSkeleton = () => {
  const { TableSkeleton } = require('../ui/Skeleton');
  return <TableSkeleton rows={10} columns={9} />;
};
