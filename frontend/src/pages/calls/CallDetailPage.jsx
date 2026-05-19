import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge, SentimentBadge } from '../../components/ui/StatusBadge';
import { useCallDetail } from '../../hooks/useCalls';
import { useAnalysis, useTriggerAnalysis } from '../../hooks/useAnalysis';
import { formatDate, formatDuration } from '../../lib/utils';

const scoreLabels = {
  accueil: 'Accueil',
  empathie: 'Empathie',
  resolution: 'Resolution',
  langage: 'Langage',
  conformite: 'Conformite',
  cloture: 'Cloture',
};

const scoreValue = (value) => {
  if (value == null) return 0;
  return Number(value) <= 1 ? Math.round(Number(value) * 100) : Math.round(Number(value));
};

export const CallDetailPage = () => {
  const { id } = useParams();
  const { data: call, isLoading } = useCallDetail(id);
  const { data: analysis } = useAnalysis(id);
  const triggerAnalysis = useTriggerAnalysis();

  if (isLoading) return <Skeleton className="h-[640px] w-full" />;
  if (!call) {
    return (
      <Card shadow="sm">
        <CardContent className="py-14 text-center">
          <h1 className="text-xl font-semibold text-slate-950">Call not found</h1>
          <Link className="mt-4 inline-flex text-cyan-700" to="/calls">Back to calls</Link>
        </CardContent>
      </Card>
    );
  }

  const scores = { ...call.scores, ...analysis?.scores };
  const topics = analysis?.topics || call.topics || [];
  const progress = analysis?.progress ?? call.progress ?? 0;
  const displayStatus = analysis?.display_status || call.display_status || call.status;
  const isFailed = analysis?.status === 'failed' || analysis?.job_status === 'failed' || call.status === 'failed';
  const isRunning = ['pending', 'queued', 'processing', 'running'].includes(analysis?.status)
    || ['queued', 'running'].includes(analysis?.job_status);
  const summary = analysis?.summary_details || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link to="/calls" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">Back to calls</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{call.title}</h1>
          <p className="mt-1 text-slate-500">{call.id} · {call.created_at ? formatDate(call.created_at) : 'Unknown date'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={analysis?.job_status || call.status} />
          <SentimentBadge sentiment={analysis?.sentiment || call.sentiment} />
          <Button
            type="button"
            variant={isFailed ? 'primary' : 'secondary'}
            loading={triggerAnalysis.isPending}
            onClick={() => triggerAnalysis.mutate(call.id)}
          >
            {isFailed ? 'Retry analysis' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      <Card shadow="sm">
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">{displayStatus}</p>
              <p className="mt-1 text-sm text-slate-500">
                {isRunning ? 'The AI pipeline is updating this page automatically.' : 'Latest analysis results are shown below.'}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
          </div>
          {analysis?.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {analysis.error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {call.audio_url && (
            <Card shadow="sm">
              <CardHeader><CardTitle>Recording</CardTitle></CardHeader>
              <CardContent><audio className="w-full" controls src={call.audio_url} /></CardContent>
            </Card>
          )}

          <Card shadow="sm">
            <CardHeader><CardTitle>Transcript</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-3 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs leading-5 text-cyan-900">
                MVP speaker assumption: <strong>SPEAKER_00 is treated as the agent</strong> and SPEAKER_01 as the customer unless diarization metadata is corrected later.
              </div>
              <div className="max-h-[460px] space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {analysis?.transcript_segments?.length ? analysis.transcript_segments.map((segment, index) => (
                  <div key={`${segment.start}-${index}`} className="rounded-lg bg-white p-3 shadow-sm">
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                      <span>{segment.speaker || 'Speaker'}</span>
                      <span>{formatDuration(segment.start || 0)} - {formatDuration(segment.end || 0)}</span>
                    </div>
                    <p>{segment.text}</p>
                  </div>
                )) : (analysis?.transcript || call.transcript || 'Transcript is not available yet.')}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card shadow="sm">
              <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SummaryLine label="Motif" value={summary.motif || analysis?.summary || call.summary} />
                <SummaryLine label="Actions" value={summary.actions} />
                <SummaryLine label="Outcome" value={summary.outcome} />
              </CardContent>
            </Card>
            <Card shadow="sm">
              <CardHeader><CardTitle>Recommended Coaching Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-6 text-slate-700">{summary.recommendations || analysis?.coaching_notes || call.coaching_notes || 'No coaching notes yet.'}</p></CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card shadow="sm">
            <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Meta label="Agent" value={call.agent_name} />
              <Meta label="Customer" value={call.customer_name} />
              <Meta label="Duration" value={formatDuration(call.duration || 0)} />
              <Meta label="Quality score" value={call.quality_score == null ? '-' : `${scoreValue(call.quality_score)}%`} />
              <Meta label="Created" value={call.created_at ? formatDate(call.created_at) : '-'} />
            </CardContent>
          </Card>

          <Card shadow="sm">
            <CardHeader><CardTitle>Topic Detection</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topics.length ? topics.map((topic) => {
                  const label = typeof topic === 'string' ? topic : topic.label;
                  const score = typeof topic === 'object' && topic.score ? ` ${Math.round(topic.score * 100)}%` : '';
                  return <span key={label} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">{label}{score}</span>;
                }) : <span className="text-sm text-slate-500">No topics detected.</span>}
              </div>
            </CardContent>
          </Card>

          <Card shadow="sm">
            <CardHeader><CardTitle>Quality Scoring Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(scoreLabels).map(([key, label]) => {
                const value = scoreValue(scores[key]);
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-slate-500">{value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.min(value, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SummaryLine = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-sm leading-6 text-slate-700">{value || 'Not available yet.'}</p>
  </div>
);

const Meta = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-900">{value}</span>
  </div>
);
