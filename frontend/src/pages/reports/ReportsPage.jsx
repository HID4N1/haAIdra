import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useDownloadReport, useReports } from '../../hooks/useReports';
import { formatDate } from '../../lib/utils';

const reportCards = [
  ['call-quality', 'Quality Summary', 'Score trends, rubric breakdown, and coaching priorities.'],
  ['company', 'Company Performance', 'Company-level volume, sentiment, and quality score exports.'],
  ['sentiment', 'Sentiment Review', 'Negative call clusters, drivers, and follow-up queues.'],
  ['qa', 'Compliance Audit', 'Required phrase coverage and policy adherence.'],
];

export const ReportsPage = () => {
  const { data: reports = [] } = useReports();
  const downloadReport = useDownloadReport();

  const generateReport = (type) => {
    downloadReport.mutate({ type, format: 'pdf', params: { days: 30 } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Reports</h1>
          <p className="mt-1 text-slate-500">Generate executive-ready call intelligence exports.</p>
        </div>
        <Button onClick={() => generateReport('company')} loading={downloadReport.isPending}>Generate report</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportCards.map(([type, title, description]) => (
          <Card key={title} shadow="sm">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 min-h-[64px] text-sm leading-6 text-slate-500">{description}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => generateReport(type)} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Generate</button>
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Schedule</button>
            </div>
          </Card>
        ))}
      </div>

      <Card shadow="sm" padding="p-0">
        <CardHeader className="p-6 pb-4"><CardTitle>Recent Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Report</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">{report.name}</td>
                    <td className="px-5 py-4 text-slate-600">{report.type}</td>
                    <td className="px-5 py-4"><StatusBadge status={report.status} /></td>
                    <td className="px-5 py-4 text-slate-500">{report.created_at ? formatDate(report.created_at) : '-'}</td>
                    <td className="px-5 py-4"><button className="font-medium text-cyan-700 hover:text-cyan-900">Download</button></td>
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
