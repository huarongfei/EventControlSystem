import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TeamStats } from '@/types';

interface Props {
  homeStats: TeamStats;
  awayStats: TeamStats;
  homeTeamName: string;
  awayTeamName: string;
}

const statsConfig = [
  { key: 'twoPointMade', label: '二分命中', color: '#3B82F6' },
  { key: 'threePointMade', label: '三分命中', color: '#3B82F6', secondary: '#EF4444' },
  { key: 'freeThrowMade', label: '罚球命中', color: '#3B82F6' },
  { key: 'offensiveRebounds', label: '进攻篮板', color: '#3B82F6' },
  { key: 'defensiveRebounds', label: '防守篮板', color: '#3B82F6' },
  { key: 'assists', label: '助攻', color: '#3B82F6' },
  { key: 'steals', label: '抢断', color: '#3B82F6' },
  { key: 'blocks', label: '盖帽', color: '#3B82F6' },
  { key: 'turnovers', label: '失误', color: '#EF4444' },
  { key: 'fouls', label: '犯规', color: '#EF4444' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface/95 p-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function TeamStatsChart({ homeStats, awayStats, homeTeamName, awayTeamName }: Props) {
  const chartData = statsConfig.map((stat) => ({
    name: stat.label,
    [homeTeamName]: stat.key === 'turnovers' || stat.key === 'fouls' 
      ? -(homeStats[stat.key as keyof TeamStats] as number) 
      : (homeStats[stat.key as keyof TeamStats] as number),
    [awayTeamName]: stat.key === 'turnovers' || stat.key === 'fouls'
      ? -(awayStats[stat.key as keyof TeamStats] as number)
      : (awayStats[stat.key as keyof TeamStats] as number),
    isNegative: stat.key === 'turnovers' || stat.key === 'fouls',
  }));

  return (
    <div className="rounded-2xl border border-panel-border bg-panel-surface/60 p-6 backdrop-blur-lg">
      <h3 className="mb-4 text-lg font-semibold text-white">球队数据统计</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
          />
          <Bar 
            dataKey={homeTeamName} 
            fill="#3B82F6" 
            radius={[0, 4, 4, 0]}
            name={homeTeamName}
          />
          <Bar 
            dataKey={awayTeamName} 
            fill="#EF4444" 
            radius={[0, 4, 4, 0]}
            name={awayTeamName}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
