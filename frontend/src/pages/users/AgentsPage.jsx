import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { SentimentBadge } from '../../components/ui/StatusBadge';
import { useAgents } from '../../hooks/useUsers';

const performanceTone = (score) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700';
  if (score >= 80) return 'bg-blue-50 text-blue-700';
  if (score >= 70) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
};

export const AgentsPage = () => {
  const { data, isLoading } = useAgents();
  const agents = data?.results || [];

  if (isLoading) return <Skeleton className="h-[520px] w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Agents</h1>
        <p className="mt-1 text-slate-500">Monitor agent volume, quality, sentiment, and coaching priority.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <Card key={agent.id || agent.email} shadow="sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{agent.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{agent.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${performanceTone(agent.average_score)}`}>
                {agent.performance}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Role" value={agent.role} />
              <Metric label="Calls" value={agent.calls} />
              <Metric label="Avg score" value={`${Math.round(agent.average_score || 0)}%`} />
              <div>
                <p className="text-slate-500">Sentiment</p>
                <div className="mt-1"><SentimentBadge sentiment={agent.average_sentiment} /></div>
              </div>
            </div>
            <button className="mt-6 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              View details
            </button>
          </Card>
        ))}
      </div>

      <Card shadow="sm" padding="p-0">
        <CardHeader className="p-6 pb-4"><CardTitle>Agent Performance Table</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Calls</th>
                  <th className="px-5 py-3">Avg score</th>
                  <th className="px-5 py-3">Avg sentiment</th>
                  <th className="px-5 py-3">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id || agent.email}>
                    <td className="px-5 py-4 font-medium text-slate-900">{agent.name}</td>
                    <td className="px-5 py-4 text-slate-600">{agent.email}</td>
                    <td className="px-5 py-4 capitalize text-slate-600">{agent.role}</td>
                    <td className="px-5 py-4 text-slate-600">{agent.calls}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{Math.round(agent.average_score || 0)}%</td>
                    <td className="px-5 py-4"><SentimentBadge sentiment={agent.average_sentiment} /></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${performanceTone(agent.average_score)}`}>{agent.performance}</span></td>
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

const Metric = ({ label, value }) => (
  <div>
    <p className="text-slate-500">{label}</p>
    <p className="mt-1 font-semibold capitalize text-slate-900">{value}</p>
  </div>
);
