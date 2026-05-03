import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { PlayerStats as PlayerStatsType, Team } from '@/types';

interface Props {
  homePlayers: PlayerStatsType[];
  awayPlayers: PlayerStatsType[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeam?: Team;
  awayTeam?: Team;
}

type Tab = 'home' | 'away' | 'comparison';

const radarStats = [
  { key: 'points', label: '得分' },
  { key: 'totalRebounds', label: '篮板' },
  { key: 'assists', label: '助攻' },
  { key: 'steals', label: '抢断' },
  { key: 'blocks', label: '盖帽' },
  { key: 'efficiency', label: '效率' },
];

const barStats = [
  { key: 'points', label: '得分' },
  { key: 'totalRebounds', label: '篮板' },
  { key: 'assists', label: '助攻' },
  { key: 'steals', label: '抢断' },
  { key: 'blocks', label: '盖帽' },
  { key: 'turnovers', label: '失误' },
  { key: 'fouls', label: '犯规' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-border bg-panel-surface/95 p-3 shadow-xl backdrop-blur">
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

function PlayerRadarChart({ players, teamName, color }: { players: PlayerStatsType[], teamName: string, color: string }) {
  if (players.length === 0) return <p className="text-center text-slate-400 py-8">暂无球员数据</p>;
  
  const topPlayer = [...players].sort((a, b) => b.efficiency - a.efficiency)[0];
  const data = radarStats.map(stat => ({
    stat: stat.label,
    value: (topPlayer[stat.key as keyof PlayerStatsType] as number) || 0,
  }));

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-400 mb-2">最佳球员: {topPlayer.player.name} (#{topPlayer.player.number})</h4>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="stat" tick={{ fill: '#94A3B8', fontSize: 12 }} />
          <PolarRadiusAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
          <Radar
            name={teamName}
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlayerComparisonChart({ homePlayers, awayPlayers, homeTeamName, awayTeamName }: {
  homePlayers: PlayerStatsType[];
  awayPlayers: PlayerStatsType[];
  homeTeamName: string;
  awayTeamName: string;
}) {
  const getTopPlayers = (players: PlayerStatsType[], count: number) => {
    return [...players].sort((a, b) => b.points - a.points).slice(0, count);
  };

  const homeTop = getTopPlayers(homePlayers, 3);
  const awayTop = getTopPlayers(awayPlayers, 3);

  const allPlayers = [...homeTop, ...awayTop];
  
  const data = barStats.map(stat => {
    const entry: any = { stat: stat.label };
    allPlayers.forEach((player, idx) => {
      entry[`${player.player.name} (#${player.player.number})`] = (player[stat.key as keyof PlayerStatsType] as number) || 0;
    });
    return entry;
  });

  const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#EF4444', '#F87171', '#FCA5A5'];

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-400 mb-4">球员数据对比 (各队前3名得分手)</h4>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} />
          <YAxis type="category" dataKey="stat" tick={{ fontSize: 12, fill: '#94A3B8' }} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          {allPlayers.map((player, idx) => (
            <Bar
              key={player.playerId}
              dataKey={`${player.player.name} (#${player.player.number})`}
              fill={colors[idx % colors.length]}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PlayerStatsTable({ homePlayers, awayPlayers, homeTeamName, awayTeamName, homeTeam, awayTeam }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  const renderPlayerTable = (players: PlayerStatsType[], teamColor: string) => {
    const sorted = [...players].sort((a, b) => b.points - a.points);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel-border text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">球员</th>
              <th className="pb-3 text-center">得分</th>
              <th className="pb-3 text-center">篮板</th>
              <th className="pb-3 text-center">助攻</th>
              <th className="pb-3 text-center">抢断</th>
              <th className="pb-3 text-center">盖帽</th>
              <th className="pb-3 text-center">失误</th>
              <th className="pb-3 text-center">犯规</th>
              <th className="pb-3 text-right">效率</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.playerId}
                className="border-b border-panel-border/50 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2.5 pr-4 font-mono text-slate-400">{p.player.number}</td>
                <td className="py-2.5 pr-4 font-medium text-white">{p.player.name}</td>
                <td className="py-2.5 text-center font-bold text-white">{p.points}</td>
                <td className="py-2.5 text-center text-slate-300">{p.totalRebounds}</td>
                <td className="py-2.5 text-center text-slate-300">{p.assists}</td>
                <td className="py-2.5 text-center text-slate-300">{p.steals}</td>
                <td className="py-2.5 text-center text-slate-300">{p.blocks}</td>
                <td className="py-2.5 text-center text-slate-300">{p.turnovers}</td>
                <td className="py-2.5 text-center text-slate-300">{p.fouls}</td>
                <td className={`py-2.5 text-right font-mono font-semibold ${
                  p.efficiency >= 10 ? 'text-emerald-400' : p.efficiency < 0 ? 'text-red-400' : 'text-slate-300'
                }`}>
                  {p.efficiency > 0 ? '+' : ''}{p.efficiency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-panel-border bg-panel-surface/60 p-6 backdrop-blur-lg">
      <h3 className="mb-4 text-lg font-semibold text-white">球员数据统计</h3>

      {/* Tab 切换 */}
      <div className="mb-4 flex gap-1 rounded-lg bg-panel-bg/60 p-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'home'
              ? 'bg-blue-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {homeTeamName} (表格)
        </button>
        <button
          onClick={() => setActiveTab('away')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'away'
              ? 'bg-red-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {awayTeamName} (表格)
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'bg-accent text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          数据对比
        </button>
      </div>

      {/* 内容区域 */}
      {activeTab === 'home' ? (
        <>
          {renderPlayerTable(homePlayers, '#3B82F6')}
          <div className="mt-6">
            <PlayerRadarChart players={homePlayers} teamName={homeTeamName} color="#3B82F6" />
          </div>
        </>
      ) : activeTab === 'away' ? (
        <>
          {renderPlayerTable(awayPlayers, '#EF4444')}
          <div className="mt-6">
            <PlayerRadarChart players={awayPlayers} teamName={awayTeamName} color="#EF4444" />
          </div>
        </>
      ) : (
        <PlayerComparisonChart 
          homePlayers={homePlayers} 
          awayPlayers={awayPlayers}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
        />
      )}
      
      {(activeTab === 'home' && homePlayers.length === 0) || (activeTab === 'away' && awayPlayers.length === 0) ? (
        <p className="py-6 text-center text-sm text-slate-500">暂无球员数据</p>
      ) : null}
    </div>
  );
}
