import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { useSummary } from '../../hooks/useAnalysis';

export const SummaryCard = ({ callId }) => {
  const { data: summary, isLoading, error } = useSummary(callId);

  if (isLoading) {
    return <SummarySkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-500">Failed to load summary</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-500">No summary available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Motif */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Call Motif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Primary Reason</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {summary.motif || 'No specific motif identified'}
            </p>
            
            {summary.motif_confidence && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Confidence</span>
                  <span>{(summary.motif_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full"
                    style={{ width: `${summary.motif_confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions Taken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.actions && summary.actions.length > 0 ? (
              <ul className="space-y-2">
                {summary.actions.map((action, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No specific actions recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outcome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Call Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              summary.outcome === 'resolved' ? 'bg-secondary-100 text-secondary-800' :
              summary.outcome === 'escalated' ? 'bg-warning-100 text-warning-800' :
              summary.outcome === 'failed' ? 'bg-danger-100 text-danger-800' :
              'bg-gray-100 text-gray-800'
            )}>
              {summary.outcome ? summary.outcome.charAt(0).toUpperCase() + summary.outcome.slice(1) : 'Unknown'}
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              {summary.outcome_description || 'No outcome description available'}
            </p>

            {summary.resolution_time && (
              <div className="text-sm text-gray-500">
                Resolution time: {summary.resolution_time}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.recommendations && summary.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {summary.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-warning-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No recommendations available</p>
            )}

            {summary.improvement_areas && summary.improvement_areas.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Areas for Improvement:</p>
                <div className="flex flex-wrap gap-1">
                  {summary.improvement_areas.map((area, index) => (
                    <span
                      key={index}
                      className="text-xs bg-warning-50 text-warning-800 px-2 py-1 rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SummarySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <Card key={index}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');