import { Badge } from './Badge';

const variants = {
  analyzed: 'success',
  completed: 'success',
  done: 'success',
  processing: 'warning',
  pending: 'warning',
  queued: 'warning',
  running: 'warning',
  failed: 'danger',
  ready: 'success',
  generating: 'warning',
};

export const StatusBadge = ({ status }) => {
  const value = status || 'pending';
  return <Badge variant={variants[value] || 'default'}>{value.replace('_', ' ')}</Badge>;
};

export const SentimentBadge = ({ sentiment }) => {
  const value = sentiment || 'neutral';
  const variant = value === 'positive' ? 'success' : value === 'negative' ? 'danger' : 'warning';
  return <Badge variant={variant}>{value}</Badge>;
};
