import { useState } from 'react';
import type { MatchEvent } from '@/types';
import config from '@/config';

interface Props {
  events: MatchEvent[];
  homeTeamId?: string;
}

type EventFilter = 'all' | 'scoring' | 'foul' | 'timeout' | 'other';

const scoringEventTypes = ['two_point_made', 'three_point_made', 'free_throw_made', 'score'];
const foulEventTypes = ['foul', 'yellow_card', 'red_card'];
const timeoutEventTypes = ['timeout'];

function getEventFilterTypes(filter: EventFilter): string[] {
  switch (filter) {
    case 'scoring': return scoringEventTypes;
    case 'foul': return foulEventTypes;
    case 'timeout': return timeoutEventTypes;
    case 'other': return ['substitution', 'turnover', 'steal', 'block', 'injury', 'period_start', 'period_end', 'match_start', 'match_end', 'finish', 'dq', 'withdraw'];
    default: return [];
  }
}

function getEventColor(type: string, teamId?: string, homeTeamId?: string): string {
  if (scoringEventTypes.includes(type)) {
    if (!teamId || !homeTeamId) return 'border-l-accent bg-accent/10';
    return teamId === homeTeamId ? 'border-l-blue-400 bg-blue-500/10' : 'border-l-red-400 bg-red-500/10';
  }
  if (foulEventTypes.includes(type)) return 'border-l-orange-400 bg-orange-500/10';
  if (timeoutEventTypes.includes(type)) return 'border-l-yellow-400 bg-yellow-500/10';
  switch (type) {
    case 'turnover': return 'border-l-red-400 bg-red-500/10';
    case 'finish': return 'border-l-green-400 bg-green-500/10';
    case 'dq': return 'border-l-red-400 bg-red-500/10';
    case 'withdraw': return 'border-l-slate-400 bg-slate-500/10';
    default: return 'border-l-slate-500 bg-slate-500/10';
  }
}

function getEventIcon(type: string): string {
  if (scoringEventTypes.includes(type)) return '🏀';
  if (foulEventTypes.includes(type)) return '⛔';
  switch (type) {
    case 'assist': return '🎯';
    case 'steal': return '🤏';
    case 'block': return '🚫';
    case 'turnover': return '❌';
    case 'timeout': return '⏸️';
    case 'substitution': return '🔄';
    case 'finish': return '🏁';
    case 'dq': return '❌';
    case 'period_start': return '▶️';
    case 'period_end': return '⏹️';
    case 'match_start': return '🚀';
    case 'match_end': return '🏆';
    case 'yellow_card': return '🟨';
    case 'red_card': return '🟥';
    default: return '📌';
  }
}

const filterConfig: { key: EventFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'scoring', label: '得分' },
  { key: 'foul', label: '犯规' },
  { key: 'timeout', label: '暂停' },
  { key: 'other', label: '其他' },
];

export default function MatchTimeline({ events, homeTeamId }: Props) {
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');
  
  const filteredEvents = activeFilter === 'all' 
    ? events 
    : events.filter(e => getEventFilterTypes(activeFilter).includes(e.eventType));
  
  const displayEvents = filteredEvents.slice(0, config.maxTimelineEvents);

  return (
    <div className="rounded-2xl border border-panel-border bg-panel-surface/60 p-6 backdrop-blur-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">事件时间线</h3>
        <span className="text-xs text-slate-400">{filteredEvents.length} 个事件</span>
      </div>
      
      {/* 过滤器 */}
      <div className="mb-4 flex gap-1 flex-wrap">
        {filterConfig.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-accent text-white'
                : 'bg-panel-bg/60 text-slate-400 hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      <div className="relative max-h-80 space-y-2 overflow-y-auto pr-2">
        {displayEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">暂无事件</p>
        ) : (
          displayEvents.map((event, i) => (
            <div
              key={event.id}
              className={`flex items-start gap-3 rounded-lg border-l-2 p-3 transition-all duration-300 ${
                getEventColor(event.eventType, event.teamId, homeTeamId)
              } ${i === 0 ? 'ring-1 ring-accent/30' : ''}`}
            >
              <span className="mt-0.5 text-base">{getEventIcon(event.eventType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  {event.playerName
                    ? `${event.teamId === homeTeamId ? '主队' : '客队'}#${event.playerNumber} ${event.playerName}`
                    : event.description || event.eventType}
                </p>
                <p className="text-xs text-slate-400">
                  {event.eventType}
                  {event.points ? ` (+${event.points})` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono text-sm font-medium text-slate-300">
                  {event.gameClock}
                </span>
                <p className="text-xs text-slate-500">
                  {event.quarter}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
