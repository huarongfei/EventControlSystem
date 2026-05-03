import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '@/store/matchStore';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/hooks/useSocket';
import ConnectionStatus from '@/components/common/ConnectionStatus';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getSportRule, getPeriodLabel } from '@/config/sportRules';
import type { MatchStatus, MatchListItem } from '@/types';

const statusConfig: Record<MatchStatus, { label: string; dotClass: string }> = {
  upcoming: { label: '未开始', dotClass: 'bg-slate-400' },
  live: { label: '进行中', dotClass: 'bg-emerald-400 animate-pulse' },
  paused: { label: '暂停', dotClass: 'bg-yellow-400' },
  finished: { label: '已结束', dotClass: 'bg-slate-500' },
};

/** 按运动类型分组的比赛卡片 */
function TeamMatchCard({ match }: { match: MatchListItem }) {
  const navigate = useNavigate();
  const cfg = statusConfig[match.status];
  const rule = getSportRule(match.sportType);

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="group rounded-2xl border border-panel-border bg-gradient-to-br from-panel-surface/80 to-panel-bg/80 p-5 text-left backdrop-blur-lg transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      {/* 运动类型 + 状态 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{rule.emoji}</span>
          <span className="text-xs text-slate-400">{rule.displayName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
          <span className="text-xs text-slate-400">{cfg.label}</span>
        </div>
      </div>

      {/* 比分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {match.homeTeam?.logo ? (
            <img src={match.homeTeam.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-sm font-bold text-blue-400">
              {match.homeTeam?.name?.charAt(0) ?? '?'}
            </div>
          )}
          <span className="truncate text-sm font-medium text-white">{match.homeTeam?.name}</span>
        </div>

        <div className="mx-3 flex items-center gap-2 font-mono">
          <span className="text-2xl font-bold text-white">{match.homeScore}</span>
          <span className="text-lg text-slate-500">:</span>
          <span className="text-2xl font-bold text-white">{match.awayScore}</span>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
          <span className="truncate text-sm font-medium text-white">{match.awayTeam?.name}</span>
          {match.awayTeam?.logo ? (
            <img src={match.awayTeam.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-sm font-bold text-red-400">
              {match.awayTeam?.name?.charAt(0) ?? '?'}
            </div>
          )}
        </div>
      </div>

      {/* 当前节次 */}
      {match.status !== 'upcoming' && (
        <div className="mt-3 border-t border-panel-border/50 pt-3 text-center text-xs text-slate-500">
          {getPeriodLabel(match.sportType, match.currentQuarter)}
          &nbsp;·&nbsp; {match.gameClock}
        </div>
      )}

      {/* hover 提示 */}
      <div className="mt-3 text-center text-xs text-accent/0 transition-colors group-hover:text-accent">
        点击查看详情 →
      </div>
    </button>
  );
}

/** 竞速赛卡片（B类运动） */
function RaceMatchCard({ match }: { match: MatchListItem }) {
  const navigate = useNavigate();
  const cfg = statusConfig[match.status];
  const rule = getSportRule(match.sportType);

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="group rounded-2xl border border-panel-border bg-gradient-to-br from-panel-surface/80 to-panel-bg/80 p-5 text-left backdrop-blur-lg transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      {/* 运动类型 + 状态 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{rule.emoji}</span>
          <span className="text-xs font-medium text-white">{rule.displayName}</span>
          <span className="text-xs text-slate-500">
            {rule.raceConfig ? `${rule.raceConfig.lanes}道` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
          <span className="text-xs text-slate-400">{cfg.label}</span>
        </div>
      </div>

      {/* 比赛名称 */}
      <div className="mb-3 text-center">
        <span className="text-lg font-semibold text-white">{match.name || rule.periodNames[0]}</span>
      </div>

      {/* 用时显示 */}
      <div className="border-t border-panel-border/50 pt-3 text-center">
        <div className="font-mono text-2xl font-bold text-white">
          {match.gameClock}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {match.status === 'upcoming' ? '等待开始' : '进行中'}
        </div>
      </div>

      {/* hover 提示 */}
      <div className="mt-4 text-center text-xs text-accent/0 transition-colors group-hover:text-accent">
        点击查看选手排名 →
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { matches, isLoading } = useMatchStore();
  const { fetchMatches } = useApi();
  const { status: connStatus } = useSocket();
  const [filter, setFilter] = useState<'all' | 'team' | 'race'>('all');

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 15000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // 验证比赛数据完整性
  const isValidMatch = (m: MatchListItem): boolean => {
    if (!m.id) return false;
    // 对战赛必须有主客队
    if (m.category !== 'race' && (!m.homeTeam || !m.awayTeam || !m.homeTeam.name || !m.awayTeam.name)) {
      return false;
    }
    return true;
  };

  const validMatches = matches.filter(isValidMatch);
  const invalidMatches = matches.filter((m) => !isValidMatch(m));

  const filteredMatches = validMatches.filter((m) => {
    if (filter === 'all') return true;
    return m.category === filter;
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-panel-border px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-white">比赛列表</h1>
          <p className="mt-1 text-sm text-slate-400">选择一场比赛查看实时赛况分析</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-panel-surface/50 p-1">
            {(['all', 'team', 'race'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-accent text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? '全部' : f === 'team' ? '对战赛' : '竞速赛'}
              </button>
            ))}
          </div>
          <ConnectionStatus status={connStatus} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {/* 无效比赛警告 */}
        {invalidMatches.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm text-yellow-400">
                发现 {invalidMatches.length} 场数据不完整的比赛，已自动过滤
              </span>
            </div>
          </div>
        )}

        {isLoading && matches.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner text="加载中…" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-5xl">🏀</div>
            <h2 className="text-lg font-semibold text-white">暂无比赛</h2>
            <p className="mt-2 text-sm text-slate-400">等待后端推送比赛数据…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMatches.map((match) =>
              match.category === 'race' ? (
                <RaceMatchCard key={match.id} match={match} />
              ) : (
                <TeamMatchCard key={match.id} match={match} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
