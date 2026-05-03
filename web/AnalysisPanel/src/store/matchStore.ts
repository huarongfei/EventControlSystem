// ============================================================
// ECS 赛况分析面板 - Zustand 状态管理
// ============================================================

import { create } from 'zustand';
import type {
  Match,
  MatchListItem,
  MatchEvent,
  MatchParticipant,
  ScoreUpdatePayload,
  MatchEventPayload,
  MatchStatusPayload,
  ConnectionStatus,
  ScoreTrendPoint,
} from '@/types';

interface MatchState {
  // 比赛列表
  matches: MatchListItem[];
  setMatches: (matches: MatchListItem[]) => void;

  // 当前比赛
  currentMatch: Match | null;
  setCurrentMatch: (match: Match | null) => void;
  updateCurrentMatch: (match: Partial<Match>) => void;

  // 竞速赛选手
  updateParticipants: (participants: MatchParticipant[]) => void;

  // 比分更新
  handleScoreUpdate: (payload: ScoreUpdatePayload) => void;

  // 事件
  addEvent: (event: MatchEvent) => void;

  // 状态变更
  handleStatusChange: (payload: MatchStatusPayload) => void;

  // 得分走势
  addScoreTrendPoint: (point: ScoreTrendPoint) => void;

  // 连接状态
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // 加载状态
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  setMatches: (matches) => set({ matches }),

  currentMatch: null,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  updateCurrentMatch: (partial) =>
    set((state) => ({
      currentMatch: state.currentMatch
        ? { ...state.currentMatch, ...partial }
        : null,
    })),

  updateParticipants: (participants) => {
    const { currentMatch } = get();
    if (!currentMatch) return;
    set({
      currentMatch: { ...currentMatch, participants },
    });
  },

  handleScoreUpdate: (payload) => {
    const { currentMatch } = get();
    if (!currentMatch || currentMatch.id !== payload.matchId) return;

    set({
      currentMatch: {
        ...currentMatch,
        homeStats: { ...currentMatch.homeStats, score: payload.homeScore },
        awayStats: { ...currentMatch.awayStats, score: payload.awayScore },
        gameClock: payload.gameClock,
        currentQuarter: payload.quarter,
      },
    });
  },

  addEvent: (event) => {
    const { currentMatch } = get();
    if (!currentMatch || currentMatch.id !== event.matchId) return;

    set({
      currentMatch: {
        ...currentMatch,
        events: [event, ...currentMatch.events],
      },
    });
  },

  handleStatusChange: (payload) => {
    const { currentMatch, matches } = get();

    if (currentMatch && currentMatch.id === payload.matchId) {
      set({ currentMatch: { ...currentMatch, status: payload.status } });
    }

    set({
      matches: matches.map((m) =>
        m.id === payload.matchId ? { ...m, status: payload.status } : m,
      ),
    });
  },

  addScoreTrendPoint: (point) => {
    const { currentMatch } = get();
    if (!currentMatch) return;

    set({
      currentMatch: {
        ...currentMatch,
        scoreTrend: [...currentMatch.scoreTrend, point],
      },
    });
  },

  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
