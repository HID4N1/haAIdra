import React from 'react';
import { useTranscript } from '../../hooks/useAnalysis';
import { Skeleton } from '../ui/Skeleton';
import { formatDuration } from '../../lib/utils';

export const TranscriptViewer = ({ callId }) => {
  const { data: transcript, isLoading, error } = useTranscript(callId);

  if (isLoading) {
    return <TranscriptSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load transcript</p>
      </div>
    );
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {transcript.map((segment, index) => (
        <div
          key={index}
          className={cn(
            'flex space-x-3 p-3 rounded-lg',
            segment.speaker === 'agent' ? 'bg-blue-50' : 'bg-gray-50'
          )}
        >
          <div className="flex-shrink-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                segment.speaker === 'agent'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500 text-white'
              )}
            >
              {segment.speaker === 'agent' ? 'A' : 'C'}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900 capitalize">
                {segment.speaker}
              </span>
              <span className="text-xs text-gray-500">
                {formatDuration(segment.start_time)} - {formatDuration(segment.end_time)}
              </span>
            </div>
            <p className="text-sm text-gray-700">{segment.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TranscriptSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex space-x-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    ))}
  </div>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');
