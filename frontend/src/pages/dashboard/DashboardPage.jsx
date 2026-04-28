import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KPICard } from '../../components/dashboard/KPICard';
import { VolumeChart } from '../../components/dashboard/VolumeChart';
import { SentimentBreakdown } from '../../components/dashboard/SentimentBreakdown';
import { ScoreTrend } from '../../components/dashboard/ScoreTrend';
import { LeaderboardTable } from '../../components/dashboard/LeaderboardTable';
import { useKPI, useCallsVolume, useSentimentBreakdown, useScoreTrend, useLeaderboard } from '../../hooks/useDashboard';
import { PageSpinner } from '../../components/ui/Spinner';

// Icons
const PhoneIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FlagIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const ChartBarIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrophyIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

export const DashboardPage = () => {
  const [days, setDays] = useState(30);
  const [volumePeriod, setVolumePeriod] = useState('daily');

  const { data: kpi, isLoading: kpiLoading } = useKPI(days);
  const { data: volumeData, isLoading: volumeLoading } = useCallsVolume(days, volumePeriod);
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentBreakdown(days);
  const { data: scoreTrendData, isLoading: scoreTrendLoading } = useScoreTrend(days);
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();

  const isLoading = kpiLoading || volumeLoading || sentimentLoading || scoreTrendLoading || leaderboardLoading;

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of call center performance</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Calls"
          value={kpi?.total_calls || 0}
          subtitle="In selected period"
          trend={kpi?.total_calls_trend}
          icon={<PhoneIcon />}
          loading={kpiLoading}
        />
        <KPICard
          title="Analyzed"
          value={kpi?.analyzed_calls || 0}
          subtitle="Successfully processed"
          trend={kpi?.analyzed_calls_trend}
          icon={<CheckCircleIcon />}
          loading={kpiLoading}
          color="secondary"
        />
        <KPICard
          title="Flagged"
          value={kpi?.flagged_calls || 0}
          subtitle="Require attention"
          trend={kpi?.flagged_calls_trend}
          icon={<FlagIcon />}
          loading={kpiLoading}
          color="danger"
        />
        <KPICard
          title="Avg Score"
          value={kpi?.average_score || 0}
          subtitle="Quality rating"
          trend={kpi?.average_score_trend}
          icon={<ChartBarIcon />}
          loading={kpiLoading}
          color="primary"
        />
        <KPICard
          title="Resolution Rate"
          value={((kpi?.resolution_rate || 0) * 100)}
          subtitle="Customer satisfaction"
          trend={kpi?.resolution_rate_trend}
          icon={<TrophyIcon />}
          loading={kpiLoading}
          color="secondary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VolumeChart
          data={volumeData}
          loading={volumeLoading}
          onPeriodChange={setVolumePeriod}
          currentPeriod={volumePeriod}
        />
        <SentimentBreakdown
          data={sentimentData}
          loading={sentimentLoading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreTrend
          data={scoreTrendData}
          loading={scoreTrendLoading}
        />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
          <LeaderboardTable
            data={leaderboardData}
            loading={leaderboardLoading}
          />
        </div>
      </div>
    </div>
  );
};
