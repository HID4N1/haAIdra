import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input, Select } from '../../components/ui/FormControls';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge, SentimentBadge } from '../../components/ui/StatusBadge';
import { UploadCallModal } from '../../components/calls/UploadCallModal';
import { useCalls } from '../../hooks/useCalls';
import { useTriggerAnalysis } from '../../hooks/useAnalysis';
import { formatDate, formatDuration } from '../../lib/utils';

export const CallsPage = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: '', sentiment: '', agent: '', date_from: '', date_to: '' });
  const { data, isLoading, isError } = useCalls(filters);
  const triggerAnalysis = useTriggerAnalysis();
  const calls = useMemo(() => data?.results || [], [data?.results]);

  const agentOptions = useMemo(() => [...new Set(calls.map((call) => call.agent_name).filter(Boolean))], [calls]);
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Calls</h1>
          <p className="mt-1 text-slate-500">Upload, filter, and inspect every recorded customer conversation.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>Upload call</Button>
      </div>

      <Card shadow="sm">
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Input label="Search" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Call, customer, agent" />
          <Select label="Status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="running">Running</option>
            <option value="analyzed">Analyzed</option>
            <option value="failed">Failed</option>
          </Select>
          <Select label="Sentiment" value={filters.sentiment} onChange={(event) => setFilter('sentiment', event.target.value)}>
            <option value="">All sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </Select>
          <Select label="Agent" value={filters.agent} onChange={(event) => setFilter('agent', event.target.value)}>
            <option value="">All agents</option>
            {agentOptions.map((agent) => <option key={agent} value={agent}>{agent}</option>)}
          </Select>
          <Input label="From" type="date" value={filters.date_from} onChange={(event) => setFilter('date_from', event.target.value)} />
          <Input label="To" type="date" value={filters.date_to} onChange={(event) => setFilter('date_to', event.target.value)} />
        </CardContent>
      </Card>

      <Card shadow="sm" padding="p-0">
        {isLoading && <div className="p-6"><Skeleton className="h-80 w-full" /></div>}
        {isError && <div className="p-6 text-sm text-red-600">Unable to load calls from the API.</div>}
        {!isLoading && !isError && calls.length === 0 && (
          <div className="p-10">
            <EmptyState title="No calls found" description="Upload a call or adjust filters to review conversations." />
          </div>
        )}
        {!isLoading && calls.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Call ID/name</th>
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Sentiment</th>
                  <th className="px-5 py-3">Quality</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-950">{call.title}<div className="text-xs text-slate-500">{call.id}</div></td>
                    <td className="px-5 py-4 text-slate-700">{call.agent_name}</td>
                    <td className="px-5 py-4 text-slate-700">{call.customer_name}</td>
                    <td className="px-5 py-4 text-slate-700">{formatDuration(call.duration || 0)}</td>
                    <td className="px-5 py-4"><StatusBadge status={call.job_status || call.status} /></td>
                    <td className="px-5 py-4"><SentimentBadge sentiment={call.sentiment} /></td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{call.quality_score ?? '-'}</td>
                    <td className="px-5 py-4 text-slate-500">{call.created_at ? formatDate(call.created_at) : '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link className="font-medium text-cyan-700 hover:text-cyan-900" to={`/calls/${call.id}`}>View</Link>
                        <button
                          type="button"
                          className="font-medium text-slate-600 hover:text-slate-950"
                          disabled={triggerAnalysis.isPending}
                          onClick={() => triggerAnalysis.mutate(call.id)}
                        >
                          Re-analyze
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <UploadCallModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};
