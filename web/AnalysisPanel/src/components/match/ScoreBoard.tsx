import { useEffect, useState, useRef } from 'react';
import type { TeamStats, Team, Quarter, SportType } from '@/types';
import { getSportRule, getPeriodLabel } from '@/config/sportRules';

interface Props {
  sportType?: SportType;
  homeTeam?: Team;
  awayTeam?: Team;
  homeStats?: TeamStats;
  awayStats?: TeamStats;
  quarter: Quarter;
  gameClock: string;
  status: string;
}

function AnimatedScore({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(score);
  const [animating, setAnimating] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    // 仅当 score 真正变化时触发动画（避免依赖 displayScore 导致的双重执行）
    if (score === prevScoreRef.current) return;
    prevScoreRef.current = score;

    setAnimating(true);
    const timer = setTimeout(() => {
      setDisplayScore(score);
      setAnimating(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <span
      className={`text-[6rem] font-black leading-none tabular-nums transition-all duration-300 ${
        animating ? 'scale-110 text-accent-light' : 'text-white'
      }`}
    >
      {displayScore}
    </span>
  );
}

const statusLabel: Record<string, string> = {
  upcoming: '未开始',
  live: '● 实时',
  paused: '暂停中',
  finished: '已结束',
};

export default function ScoreBoard({
  sportType = 'basketball',
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  quarter,
  gameClock,
  status,
}: Props) {
  const isLive = status === 'live';
  const isRaceMode = !homeTeam || !awayTeam || !homeTeam.name || !awayTeam.name;
  const rule = getSportRule(sportType);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-panel-border bg-gradient-to-b from-panel-surface/90 to-panel-bg/90 p-8 backdrop-blur-lg">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {isRaceMode ? (
        // ═══════════════════════════════════════
        // 竞速赛模式：中央大时钟
        // ═══════════════════════════════════════
        <div className="relative flex flex-col items-center justify-center py-8">
          {/* 运动图标 + 名称 */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-4xl">{rule.emoji}</span>
            <h2 className="text-2xl font-bold text-white">{rule.displayName}</h2>
          </div>

          {/* 计时器 */}
          <div className="text-center">
            <div
              className={`font-mono text-8xl font-black tabular-nums tracking-wider ${
                isLive ? 'text-accent' : 'text-white'
              }`}
            >
              {gameClock}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="rounded-md bg-panel-border/50 px-4 py-2 text-lg font-semibold text-slate-300">
                {rule.periodNames[0]}
              </span>
              <span
                className={`rounded-md px-4 py-2 text-lg font-semibold ${
                  isLive
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-panel-border/50 text-slate-300'
                }`}
              >
                {statusLabel[status] || status}
              </span>
            </div>
          </div>
        </div>
      ) : (
        // ═══════════════════════════════════════
        // 对战赛模式：传统双队记分板
        // ═══════════════════════════════════════
        <>
          {/* 主队 */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              {homeTeam.logo ? (
                <img
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
                  style={{ backgroundColor: homeTeam.primaryColor || '#3B82F6' }}
                >
                  {homeTeam.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{homeTeam.name}</h2>
                <p className="text-sm text-slate-400">
                  投篮 {homeStats?.fieldGoalPercentage ?? 0}%
                  &nbsp;|&nbsp; 三分 {homeStats?.threePointPercentage ?? 0}%
                </p>
              </div>
            </div>

            <AnimatedScore score={homeStats?.score ?? 0} />
          </div>

          {/* 比赛信息 */}
          <div className="relative my-4 flex items-center justify-center gap-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-panel-border to-transparent" />
            <div className="text-center">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-panel-border/50 px-3 py-1 text-sm font-semibold text-slate-300">
                  {getPeriodLabel(sportType, quarter)}
                </span>
                <span className={`font-mono text-3xl font-bold ${isLive ? 'text-accent' : 'text-white'}`}>
                  {gameClock}
                </span>
                <span
                  className={`rounded-md px-3 py-1 text-sm font-semibold ${
                    isLive
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-panel-border/50 text-slate-300'
                  }`}
                >
                  {statusLabel[status] || status}
                </span>
              </div>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-panel-border to-transparent" />
          </div>

          {/* 客队 */}
          <div className="relative flex items-center justify-between">
            <AnimatedScore score={awayStats?.score ?? 0} />

            <div className="flex items-center gap-4">
              <div className="text-right">
                <h2 className="text-xl font-bold text-white">{awayTeam.name}</h2>
                <p className="text-sm text-slate-400">
                  投篮 {awayStats?.fieldGoalPercentage ?? 0}%
                  &nbsp;|&nbsp; 三分 {awayStats?.threePointPercentage ?? 0}%
                </p>
              </div>
              {awayTeam.logo ? (
                <img
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
                  style={{ backgroundColor: awayTeam.primaryColor || '#EF4444' }}
                >
                  {awayTeam.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
