import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ScoreTrendPoint } from '@/types';

interface Props {
  data: ScoreTrendPoint[];
  homeTeamName: string;
  awayTeamName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface/95 p-3 shadow-xl backdrop-blur">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function TeamComparison({ data, homeTeamName, awayTeamName }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-panel-border bg-panel-surface/60 backdrop-blur-lg">
        <p className="text-sm text-slate-500">暂无走势数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-panel-border bg-panel-surface/60 p-6 backdrop-blur-lg">
      <h3 className="mb-4 text-lg font-semibold text-white">得分走势</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="gameClock"
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
          />
          <Line
            type="monotone"
            dataKey="homeScore"
            name={homeTeamName}
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="awayScore"
            name={awayTeamName}
            stroke="#EF4444"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
