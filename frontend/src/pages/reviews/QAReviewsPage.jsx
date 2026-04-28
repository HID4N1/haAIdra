import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { useReviews, useApproveReview, useRejectReview } from '../../hooks/useReviews';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatNumber } from '../../lib/utils';

export const QAReviewsPage = () => {
  const { success, error } = useToast();
  const { data: reviews, isLoading } = useReviews();
  const approveReviewMutation = useApproveReview();
  const rejectReviewMutation = useRejectReview();

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    override_score: '',
    reason: '',
    comment: '',
  });

  const handleApprove = async (reviewId) => {
    try {
      await approveReviewMutation.mutateAsync({
        reviewId,
        comment: reviewForm.comment || 'Approved without comment',
      });
      success('Review approved successfully');
      setReviewModalOpen(false);
      setSelectedReview(null);
      setReviewForm({ override_score: '', reason: '', comment: '' });
    } catch (err) {
      error('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    if (!reviewForm.reason) {
      error('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectReviewMutation.mutateAsync({
        reviewId,
        reason: reviewForm.reason,
        comment: reviewForm.comment,
      });
      success('Review rejected successfully');
      setReviewModalOpen(false);
      setSelectedReview(null);
      setReviewForm({ override_score: '', reason: '', comment: '' });
    } catch (err) {
      error('Failed to reject review');
    }
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setReviewForm({
      override_score: review.override_score || review.ai_score || '',
      reason: '',
      comment: review.comment || '',
    });
    setReviewModalOpen(true);
  };

  const filteredReviews = reviews?.results?.filter(review => 
    !statusFilter || review.status === statusFilter
  ) || [];

  if (isLoading) {
    return <TableSkeleton />;
  }

  const totalPages = Math.ceil((reviews?.count || 0) / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA Reviews</h1>
          <p className="text-gray-500">Review and approve AI-generated quality assessments</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Call ID</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Override Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Reviewed At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.map((review, index) => (
              <TableRow key={review.id} delay={index}>
                <TableCell>
                  <span className="font-medium text-gray-900">#{review.call_id}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.agent?.first_name} {review.agent?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{review.agent?.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-primary-600">
                    {formatNumber(review.ai_score || 0, 2)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-900">
                    {review.override_score !== null 
                      ? formatNumber(review.override_score, 2)
                      : '-'
                    }
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={review.status}>
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900">
                    {review.reviewer ? `${review.reviewer.first_name} ${review.reviewer.last_name}` : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {review.reviewed_at ? formatDate(review.reviewed_at) : '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openReviewModal(review)}
                    disabled={review.status !== 'pending'}
                  >
                    {review.status === 'pending' ? 'Review' : 'View'}
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

      {/* Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} size="lg">
        <ModalHeader onClose={() => setReviewModalOpen(false)}>
          <h3 className="text-lg font-semibold text-gray-900">
            QA Review - Call #{selectedReview?.call_id}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Agent: {selectedReview?.agent?.first_name} {selectedReview?.agent?.last_name}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Score Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">AI Score</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatNumber(selectedReview?.ai_score || 0, 2)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Override Score</p>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={reviewForm.override_score}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, override_score: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Reason (for rejection) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={reviewForm.reason}
                onChange={(e) => setReviewForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain why this review is being rejected..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                rows={4}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Add any additional comments or feedback..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Call Details */}
            {selectedReview?.call_details && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Call Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 text-gray-900">{selectedReview.call_details.duration}s</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Channel:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedReview.call_details.channel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Language:</span>
                    <span className="ml-2 text-gray-900 capitalize">{selectedReview.call_details.language}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(selectedReview.call_details.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setReviewModalOpen(false)}
            disabled={approveReviewMutation.isPending || rejectReviewMutation.isPending}
          >
            Cancel
          </Button>
          
          {selectedReview?.status === 'pending' && (
            <>
              <Button
                variant="danger"
                onClick={() => handleReject(selectedReview.id)}
                loading={rejectReviewMutation.isPending}
                disabled={!reviewForm.reason}
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleApprove(selectedReview.id)}
                loading={approveReviewMutation.isPending}
              >
                Approve
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
};

const TableSkeleton = () => {
  const { TableSkeleton } = require('../../components/ui/Skeleton');
  return <TableSkeleton rows={10} columns={8} />;
};
