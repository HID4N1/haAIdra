import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const statusVariants = {
  pending: 'bg-warning-100 text-warning-800 border-warning-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  analyzed: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  failed: 'bg-danger-100 text-danger-800 border-danger-200',
  flagged: 'bg-danger-100 text-danger-800 border-danger-200',
  active: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  approved: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  rejected: 'bg-danger-100 text-danger-800 border-danger-200',
};

export const Badge = ({ children, variant = 'pending', className, ...props }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CallStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'pending' },
    processing: { label: 'Processing', variant: 'processing' },
    analyzed: { label: 'Analyzed', variant: 'analyzed' },
    failed: { label: 'Failed', variant: 'failed' },
  };

  const config = statusConfig[status] || { label: status, variant: 'pending' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const FlagBadge = ({ isFlagged }) => {
  if (!isFlagged) return null;

  return <Badge variant="flagged">Flagged</Badge>;
};
