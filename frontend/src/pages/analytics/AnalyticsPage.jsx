import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../../components/ui/ChartCard';
import { StatCard } from '../../components/ui/StatCard';
import { useCallsVolume, useScoreTrend, useSentimentBreakdown, useLeaderboard } from '../../hooks/useDashboard';
import { mockDashboard } from '../../lib/mockData';

const colors = ['#10b981', '#f59e0b', '#ef4444', '#0891b2', '#6366f1'];

export const AnalyticsPage = () => {
  const { data: scoreTrend = [] } = useScoreTrend(90);
  const { data: volume = [] } = useCallsVolume(90, 'daily');
  const { data: sentiment } = useSentimentBreakdown(90);
  const { data: agents = [] } = useLeaderboard(8);
  const sentimentData = sentiment?.sentiment_distribution
    ? Object.entries(sentiment.sentiment_distribution).map(([name, value]) => ({ name, value }))
    : mockDashboard.sentimentDistribution;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Analytics</h1>
        <p className="mt-1 text-slate-500">Trend views for quality, sentiment, topics, agent load, and compliance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Score evolution" value="+5.1%" subtitle="90 day quality movement" tone="green" />
        <StatCard title="Positive sentiment" value={`${sentimentData.find((item) => item.name.toLowerCase() === 'positive')?.value || 0}%`} subtitle="Current distribution" tone="cyan" />
        <StatCard title="Top topic" value="Billing" subtitle="Most frequent driver" tone="blue" />
        <StatCard title="Compliance rate" value="94%" subtitle="Script and policy adherence" tone="green" />
        <StatCard title="Avg calls/agent" value="39" subtitle="Weekly throughput" tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Score Evolution">
          <ChartWrap>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="average_score" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartWrap>
        </ChartCard>

        <ChartCard title="Sentiment Distribution">
          <ChartWrap>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={105}>
                {sentimentData.map((entry, index) => <Cell key={entry.name} fill={colors[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartWrap>
        </ChartCard>

        <ChartCard title="Topic Frequency">
          <ChartWrap>
            <BarChart data={mockDashboard.topicFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="topic" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartWrap>
        </ChartCard>

        <ChartCard title="Calls By Agent">
          <ChartWrap>
            <BarChart data={agents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="total_calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartWrap>
        </ChartCard>

        <ChartCard title="Compliance Rate" className="xl:col-span-2">
          <ChartWrap>
            <LineChart data={mockDashboard.complianceRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis domain={[80, 100]} stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#0f766e" strokeWidth={3} />
            </LineChart>
          </ChartWrap>
        </ChartCard>
      </div>
    </div>
  );
};

const ChartWrap = ({ children }) => (
  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
  </div>
);
