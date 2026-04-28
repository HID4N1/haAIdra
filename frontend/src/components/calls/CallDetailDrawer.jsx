import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { CallStatusBadge, FlagBadge } from '../ui/Badge';
import { formatDuration, formatDate, formatNumber } from '../../lib/utils';
import { useCall } from '../../hooks/useCalls';

export const CallDetailDrawer = ({ callId, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: call, isLoading } = useCall(callId);

  if (isLoading) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} size="lg">
        <DrawerBody>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </DrawerBody>
      </Drawer>
    );
  }

  if (!call) return null;

  const pipelineSteps = [
    { key: 'uploaded', label: 'Uploaded', completed: true },
    { key: 'processing', label: 'Processing', completed: call.status !== 'pending' },
    { key: 'analyzing', label: 'Analyzing', completed: call.status === 'analyzed' },
    { key: 'completed', label: 'Completed', completed: call.status === 'analyzed' },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="lg">
      <DrawerHeader onClose={onClose}>
        <h2 className="text-xl font-semibold text-gray-900">Call Details</h2>
      </DrawerHeader>

      <DrawerBody>
        <div className="space-y-6">
          {/* Call Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Call Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Agent:</span>
                <p className="font-medium">
                  {call.agent?.first_name} {call.agent?.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Language:</span>
                <p className="font-medium capitalize">{call.language}</p>
              </div>
              <div>
                <span className="text-gray-500">Channel:</span>
                <p className="font-medium capitalize">{call.channel}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <p className="font-medium">{formatDuration(call.duration)}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="mt-1">
                  <CallStatusBadge status={call.status} />
                </div>
              </div>
              <div>
                <span className="text-gray-500">Score:</span>
                <p className="font-medium">
                  {call.score !== null ? formatNumber(call.score, 2) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <p className="font-medium">{formatDate(call.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-500">Flagged:</span>
                <div className="mt-1">
                  <FlagBadge isFlagged={call.is_flagged} />
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Pipeline Status</h3>
            <div className="space-y-3">
              {pipelineSteps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                      step.completed
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      step.completed ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {step.label}
                    </p>
                  </div>
                  {call.status === 'processing' && step.key === 'processing' && (
                    <div className="ml-2">
                      <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Audio File Info */}
          {call.audio_file && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Audio File</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{call.audio_file}</p>
              </div>
            </div>
          )}

          {/* Analysis Results Preview */}
          {call.status === 'analyzed' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Analysis Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Overall Score</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatNumber(call.score || 0, 2)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                  <p className="text-2xl font-bold text-secondary-600">Positive</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button
          variant="primary"
          onClick={() => navigate(`/calls/${callId}`)}
          className="w-full"
        >
          View Full Analysis
        </Button>
      </DrawerFooter>
    </Drawer>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');
