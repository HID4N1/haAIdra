import React from 'react';
import { Badge } from '../ui/Badge';

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
