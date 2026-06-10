import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '@/hooks/useMatch';
import { useSocket } from '@/hooks/useSocket';
import { useMatchStore } from '@/store/matchStore';
import socketService from '@/services/socket';
import { raceApi } from '@/services/api';
import ScoreBoard from '@/components/match/ScoreBoard';
import TeamComparison from '@/components/match/TeamComparison';
import TeamStatsChart from '@/components/match/TeamStatsChart';
import PlayerStatsTable from '@/components/match/PlayerStats';
import MatchTimeline from '@/components/match/MatchTimeline';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConnectionStatus from '@/components/common/ConnectionStatus';
import { matchApi } from '@/services/api';
import { getSportRule, getPeriodLabel } from '@/config/sportRules';
import type { MatchParticipant, Quarter } from '@/types';

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, isLoading } = useMatch(matchId);
  const { status: connStatus, joinMatch, leaveMatch } = useSocket();
  const handleScoreUpdate = useMatchStore((s) => s.handleScoreUpdate);
  const addEvent = useMatchStore((s) => s.addEvent);
  const handleStatusChange = useMatchStore((s) => s.handleStatusChange);
  const updateParticipants = useMatchStore((s) => s.updateParticipants);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // 加入比赛 Socket 房间
  useEffect(() => {
    if (matchId) {
      joinMatch(matchId);
    }
    return () => leaveMatch();
  }, [matchId, joinMatch, leaveMatch]);

  // 获取竞速赛选手数据
  useEffect(() => {
    if (!matchId || !match || match.category !== 'race') return;

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const data = await raceApi.getParticipants(matchId);
        const participants: MatchParticipant[] = data.map((p: Record<string, unknown>) => ({
          ...p,
          splitTimes: typeof p.splitTimes === 'string' ? JSON.parse(p.splitTimes as string) : (p.splitTimes ?? []),
        }));
        setParticipants(participants);
        updateParticipants(participants);
      } catch {
        // 静默处理 — 选手数据加载失败不阻塞主界面
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, [matchId, match, updateParticipants]);

  // 监听 WebSocket 事件
  useEffect(() => {
    const unsubScore = socketService.onScoreUpdate((data) => handleScoreUpdate(data));
    const unsubEvent = socketService.onMatchEvent((data) => addEvent(data.event));
    const unsubStatus = socketService.onStatusChange((data) => handleStatusChange(data));
    const unsubClock = socketService.onMatchClock((data) => {
      if (data.matchId === matchId) {
        useMatchStore.getState().updateCurrentMatch({
          gameClock: data.gameClock,
          currentQuarter: data.currentPeriod as Quarter,
          status: data.status as 'upcoming' | 'live' | 'paused' | 'finished',
        });
      }
    });
    const unsubParticipant = socketService.onParticipantUpdate((data) => {
      if (!data.matchId || !data.participantId) return;
      if (data.matchId === matchId) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === data.participantId
              ? {
                  ...p,
                  finalTime: data.finalTime ?? p.finalTime,
                  rank: data.rank ?? p.rank,
                  status: (data.status as 'pending' | 'running' | 'finished' | 'dq') ?? p.status,
                }
              : p
          )
        );
      }
    });

    return () => {
      unsubScore();
      unsubEvent();
      unsubStatus?.();
      unsubClock();
      unsubParticipant();
    };
  }, [matchId, handleScoreUpdate, addEvent, handleStatusChange]);

  const handleFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.();
  }, []);

  const handleExport = useCallback(async () => {
    if (!matchId) return;
    try {
      const blob = await matchApi.exportMatch(matchId, 'json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match-${matchId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // 导出失败 — 用户可通过 UI 重试
    }
  }, [matchId]);

  if (isLoading || !match) {
    return (
      <div className="flex h-screen items-center justify-center bg-panel-bg">
        <LoadingSpinner size="lg" text="加载比赛数据…" />
      </div>
    );
  }

  // 验证比赛数据完整性
  if (!match.homeTeam || !match.awayTeam || !match.homeTeam.name || !match.awayTeam.name) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-panel-bg">
        <div className="mb-4 text-6xl">⚠️</div>
        <h2 className="text-xl font-semibold text-white">比赛数据不完整</h2>
        <p className="mt-2 text-sm text-slate-400">该比赛缺少必要的队伍信息</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/80"
        >
          返回比赛列表
        </button>
      </div>
    );
  }

  const rule = getSportRule(match.sportType);
  const isRaceMode = match.category === 'race';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-panel-bg to-panel-surface">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between border-b border-panel-border bg-panel-surface/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            ← 返回
          </button>
          <div className="flex items-center gap-2">
            {isRaceMode ? (
              <span className="text-xl">{rule.emoji}</span>
            ) : (
              <>
                <span className="rounded-md bg-panel-border/50 px-2.5 py-1 text-sm font-medium text-slate-300">
                  {getPeriodLabel(match.sportType, match.currentQuarter)}
                </span>
              </>
            )}
            <span className="font-mono text-xl font-bold text-white">{match.gameClock}</span>
            {match.status === 'live' && (
              <span className="rounded-md bg-red-500/20 px-2.5 py-1 text-sm font-semibold text-red-400">
                ● 实时
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus status={connStatus} />
          <button
            onClick={handleFullscreen}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            全屏
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            导出
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            设置
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {isRaceMode ? (
            // ═══════════════════════════════════════
            // 竞速赛视图
            // ═══════════════════════════════════════
            <>
              {/* 竞速赛记分板 */}
              <ScoreBoard
                sportType={match.sportType}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeStats={match.homeStats}
                awayStats={match.awayStats}
                quarter={match.currentQuarter}
                gameClock={match.gameClock}
                status={match.status}
              />

              {/* 选手排名表 */}
              <div className="rounded-2xl border border-panel-border bg-panel-surface/80 p-6 backdrop-blur-lg">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {rule.emoji} {rule.displayName} - 选手排名
                  </h3>
                  <span className="text-sm text-slate-400">
                    {rule.raceConfig?.lanes ?? 8}条泳道/跑道
                  </span>
                </div>

                {loadingParticipants ? (
                  <div className="flex h-48 items-center justify-center">
                    <LoadingSpinner text="加载选手数据…" />
                  </div>
                ) : participants.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-slate-400">
                    暂无选手数据
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-panel-border text-left text-sm text-slate-400">
                          <th className="pb-3 pr-4 font-medium">排名</th>
                          <th className="pb-3 pr-4 font-medium">泳道</th>
                          <th className="pb-3 pr-4 font-medium">选手</th>
                          <th className="pb-3 pr-4 font-medium">队伍</th>
                          <th className="pb-3 pr-4 font-medium">用时</th>
                          <th className="pb-3 font-medium">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants
                          .slice()
                          .sort((a, b) => {
                            // 按排名排序，未完成排在后面
                            if (a.rank && b.rank) return a.rank - b.rank;
                            if (a.rank) return -1;
                            if (b.rank) return 1;
                            if (a.status === 'finished' && b.status !== 'finished') return -1;
                            if (b.status === 'finished' && a.status !== 'finished') return 1;
                            return a.laneNumber - b.laneNumber;
                          })
                          .map((p, index) => (
                            <tr
                              key={p.id}
                              className="border-b border-panel-border/50 py-3 text-white transition-colors hover:bg-white/5"
                            >
                              <td className="py-3 pr-4">
                                {p.rank ? (
                                  <span className={`font-mono font-bold ${
                                    p.rank === 1 ? 'text-yellow-400' :
                                    p.rank === 2 ? 'text-slate-300' :
                                    p.rank === 3 ? 'text-amber-600' : ''
                                  }`}>
                                    {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `${p.rank}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 text-sm font-medium text-accent">
                                  {p.laneNumber}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-medium">{p.athleteName}</td>
                              <td className="py-3 pr-4 text-slate-400">{p.teamName ?? '-'}</td>
                              <td className="py-3 pr-4">
                                <span className="font-mono">
                                  {p.finalTime ?? '-'}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                  p.status === 'finished' ? 'bg-green-500/20 text-green-400' :
                                  p.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                                  p.status === 'dq' ? 'bg-red-500/20 text-red-400' :
                                  'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {p.status === 'finished' ? '完赛' :
                                   p.status === 'running' ? '进行中' :
                                   p.status === 'dq' ? 'DQ' : '待发'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 事件时间线 */}
              <MatchTimeline
                events={match.events}
                homeTeamId={match.homeTeam?.id}
              />
            </>
          ) : (
            // ═══════════════════════════════════════
            // 对战赛视图（原有逻辑）
            // ═══════════════════════════════════════
            <>
              {/* 记分板 */}
              <ScoreBoard
                sportType={match.sportType}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeStats={match.homeStats}
                awayStats={match.awayStats}
                quarter={match.currentQuarter}
                gameClock={match.gameClock}
                status={match.status}
              />

              {/* 得分走势 + 球员数据 */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2 space-y-6">
                  <TeamComparison
                    data={match.scoreTrend}
                    homeTeamName={match.homeTeam?.name || '主队'}
                    awayTeamName={match.awayTeam?.name || '客队'}
                  />
                  <TeamStatsChart
                    homeStats={match.homeStats}
                    awayStats={match.awayStats}
                    homeTeamName={match.homeTeam?.name || '主队'}
                    awayTeamName={match.awayTeam?.name || '客队'}
                  />
                </div>
                <div className="lg:col-span-3">
                  <PlayerStatsTable
                    homePlayers={match.homePlayers}
                    awayPlayers={match.awayPlayers}
                    homeTeamName={match.homeTeam?.name || '主队'}
                    awayTeamName={match.awayTeam?.name || '客队'}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                  />
                </div>
              </div>

              {/* 事件时间线 */}
              <MatchTimeline
                events={match.events}
                homeTeamId={match.homeTeam.id}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
