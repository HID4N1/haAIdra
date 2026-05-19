import { Card } from './Card';

export const StatCard = ({ title, value, subtitle, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <Card shadow="sm" className="min-h-[132px]">
      <div className="flex h-full flex-col justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div>
          <div className={`inline-flex rounded-lg px-3 py-1 text-2xl font-bold ${tones[tone] || tones.blue}`}>
            {value}
          </div>
          {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
};
