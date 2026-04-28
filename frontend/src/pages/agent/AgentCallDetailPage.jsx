import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../hooks/useCalls';
import { useAnalysis, useTranscript, useSentiment, useScore, useSummary } from '../../hooks/useAnalysis';
import { useAuth } from '../../hooks/useAuth';
import { CallStatusBadge, FlagBadge } from '../../components/calls/CallStatusBadge';
import { TranscriptViewer } from '../../components/analysis/TranscriptViewer';
import { SentimentChart } from '../../components/analysis/SentimentChart';
import { ScoreBreakdown } from '../../components/analysis/ScoreBreakdown';
import { TopicTags } from '../../components/analysis/TopicTags';
import { SummaryCard } from '../../components/analysis/SummaryCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageSpinner } from '../../components/ui/Spinner';

const tabs = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'sentiment', label: 'Sentiment' },
  { id: 'score', label: 'Score' },
  { id: 'summary', label: 'Summary' },
  { id: 'topics', label: 'Topics' },
];

export const AgentCallDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transcript');

  const { data: call, isLoading: callLoading } = useCall(id);
  const { data: analysis, isLoading: analysisLoading } = useAnalysis(id);
  const { data: transcript, isLoading: transcriptLoading } = useTranscript(id);
  const { data: sentiment, isLoading: sentimentLoading } = useSentiment(id);
  const { data: score, isLoading: scoreLoading } = useScore(id);
  const { data: summary, isLoading: summaryLoading } = useSummary(id);

  // Check if this call belongs to the current agent
  const canAccess = call && call.agent_id === user?.id;

  const isLoading = callLoading || analysisLoading;

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Call not found</p>
        <Button onClick={() => navigate('/agent')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to view this call</p>
        <Button onClick={() => navigate('/agent')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isAnalyzed = call.status === 'analyzed';
  const isProcessing = call.status === 'processing' || call.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/agent')}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Analysis</h1>
            <p className="text-gray-500">
              Call ID: {call.id} • Uploaded {formatDate(call.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <CallStatusBadge status={call.status} />
          <FlagBadge isFlagged={call.is_flagged} />
        </div>
      </div>

      {/* Call Metadata */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Call Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{formatDuration(call.duration)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Channel</p>
            <p className="font-medium capitalize">{call.channel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Language</p>
            <p className="font-medium capitalize">{call.language}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Score</p>
            <p className="font-medium">
              {call.score ? formatNumber(call.score, 2) : 'Pending'}
            </p>
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {call.status === 'pending' ? 'Call is queued for analysis' : 'Analysis in progress'}
                </p>
                <p className="text-xs text-blue-600">
                  This may take a few minutes. The page will update automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Complete */}
        {isAnalyzed && call.score !== null && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Analysis Complete</p>
                <p className="text-xs text-green-600">
                  Overall Score: {formatNumber(call.score, 2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      {isAnalyzed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 h-0.5 bg-primary-500"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'transcript' && <TranscriptViewer callId={id} />}
                {activeTab === 'sentiment' && <SentimentChart callId={id} />}
                {activeTab === 'score' && <ScoreBreakdown callId={id} />}
                {activeTab === 'summary' && <SummaryCard callId={id} />}
                {activeTab === 'topics' && <TopicTags topics={sentiment?.topics} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Not Analyzed Yet */}
      {!isAnalyzed && !isProcessing && (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Not Available</h3>
            <p className="text-gray-500 mb-6">
              This call hasn't been analyzed yet or the analysis failed.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {isAnalyzed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {call.score >= 0.8 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Excellent Performance</p>
                      <p className="text-sm text-gray-500">
                        Your score of {formatNumber(call.score, 2)} is in the top percentile.
                      </p>
                    </div>
                  </div>
                )}
                
                {call.score >= 0.6 && call.score < 0.8 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-warning-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Good Performance</p>
                      <p className="text-sm text-gray-500">
                        Solid performance with room for improvement.
                      </p>
                    </div>
                  </div>
                )}

                {call.score < 0.6 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-danger-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Needs Improvement</p>
                      <p className="text-sm text-gray-500">
                        Focus on the areas highlighted in your score breakdown.
                      </p>
                    </div>
                  </div>
                )}

                {call.is_flagged && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-warning-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Call Flagged</p>
                      <p className="text-sm text-gray-500">
                        This call requires attention from your supervisor.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Review Feedback</p>
                    <p className="text-sm text-gray-500">
                      Check your coaching notes for personalized feedback.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Training Resources</p>
                    <p className="text-sm text-gray-500">
                      Access training materials in the knowledge base.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Practice Scenarios</p>
                    <p className="text-sm text-gray-500">
                      Try role-playing exercises to improve weak areas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};


const cn = (...classes) => classes.filter(Boolean).join(' ');