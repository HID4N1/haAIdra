import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../../components/ui/ChartCard';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge, SentimentBadge } from '../../components/ui/StatusBadge';
import { useKPI, useCallsVolume, useSentimentBreakdown, useScoreTrend, useLeaderboard, useTopics } from '../../hooks/useDashboard';
import { useCalls } from '../../hooks/useCalls';
import { formatDate } from '../../lib/utils';

const sentimentColors = ['#10b981', '#f59e0b', '#ef4444'];

export const DashboardPage = () => {
  const { data: kpi } = useKPI(30);
  const { data: volume = [] } = useCallsVolume(30, 'daily');
  const { data: scores = [] } = useScoreTrend(30);
  const { data: sentiment } = useSentimentBreakdown(30);
  const { data: agents = [] } = useLeaderboard(5);
  const { data: topics = [] } = useTopics(30, 8);
  const { data: calls } = useCalls({ page_size: 5 });

  const sentimentData = sentiment?.sentiment_distribution
    ? Object.entries(sentiment.sentiment_distribution).map(([name, value]) => ({ name, value }))
    : [];
  const recentCalls = calls?.results || [];
  const weakAgents = [...agents].sort((a, b) => (a.avg_score || 0) - (b.avg_score || 0)).slice(0, 3);
  const dominantSentiment = sentimentData.length
    ? sentimentData.reduce((best, item) => (item.value > best.value ? item : best), sentimentData[0]).name
    : 'neutral';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-slate-500">Live quality, sentiment, and coaching signals across the call center.</p>
        </div>
        <Link to="/calls" className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
          Review calls
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total calls" value={kpi?.total_calls ?? 0} subtitle={`${kpi?.analyzed_calls ?? 0} analyzed`} tone="blue" />
        <StatCard title="Average quality score" value={`${Math.round(kpi?.average_score || 0)}%`} subtitle="Team benchmark" tone="green" />
        <StatCard title="Average sentiment" value={dominantSentiment} subtitle="Dominant signal" tone="cyan" />
        <StatCard title="Failed calls" value={kpi?.failed_calls ?? 0} subtitle="Need retry or review" tone="slate" />
        <StatCard title="Pending analysis" value={kpi?.pending_calls || 0} subtitle="Queued in AI pipeline" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Call Volume Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="total_calls" name="Calls" stroke="#0284c7" fill="#bae6fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Quality Score Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="average_score" name="Score" stroke="#10b981" fill="#bbf7d0" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Sentiment Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={3}>
                  {sentimentData.map((entry, index) => <Cell key={entry.name} fill={sentimentColors[index % sentimentColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card shadow="sm">
          <CardHeader><CardTitle>Top Performing Agents</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.slice(0, 5).map((agent) => (
                <div key={agent.id || agent.email} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{agent.name || agent.email}</p>
                    <p className="text-sm text-slate-500">{agent.total_calls || agent.calls || 0} calls</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{Math.round(agent.avg_score || agent.average_score || 0)}%</p>
                    <p className="text-xs text-slate-500">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card shadow="sm">
          <CardHeader><CardTitle>Coaching Priority</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weakAgents.map((agent) => (
                <div key={agent.id || agent.email} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{agent.name || agent.email}</p>
                    <p className="text-sm text-slate-500">{agent.total_calls || agent.calls || 0} calls reviewed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-600">{Math.round(agent.avg_score || agent.average_score || 0)}%</p>
                    <p className="text-xs text-slate-500">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Recent Call Scores">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentCalls}>
                <XAxis dataKey="id" stroke="#64748b" fontSize={12} tickFormatter={(value) => String(value).slice(0, 6)} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="quality_score" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card shadow="sm" className="xl:col-span-2">
          <CardHeader><CardTitle>Common Topics</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topics.map((topic) => {
                const label = topic.label || topic.topic || topic.name;
                return (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="font-medium text-slate-800">{label}</span>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">{topic.count || topic.total || 0} calls</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card shadow="sm">
        <CardHeader><CardTitle>Recent Calls</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Call</th>
                  <th className="py-3 pr-4">Agent</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Sentiment</th>
                  <th className="py-3 pr-4">Score</th>
                  <th className="py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCalls.map((call) => (
                  <tr key={call.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900"><Link to={`/calls/${call.id}`}>{call.title}</Link></td>
                    <td className="py-3 pr-4 text-slate-600">{call.agent_name}</td>
                    <td className="py-3 pr-4"><StatusBadge status={call.status} /></td>
                    <td className="py-3 pr-4"><SentimentBadge sentiment={call.sentiment} /></td>
                    <td className="py-3 pr-4 text-slate-900">{call.quality_score ?? '-'}</td>
                    <td className="py-3 text-slate-500">{call.created_at ? formatDate(call.created_at) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
