// ============================================================
// ECS 赛况分析面板 - HTTP API 服务
// ============================================================

import axios from 'axios';
import type { Match, MatchListItem, SportRule } from '@/types';
import config from '@/config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (axiosConfig) => axiosConfig,
  (error) => Promise.reject(error),
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    if (import.meta.env.DEV) {
      console.error('[API Error]', message);
    }
    return Promise.reject(error);
  },
);

/** 比赛相关 API */
export const matchApi = {
  /** 获取比赛列表 */
  getMatches: async (): Promise<MatchListItem[]> => {
    const { data } = await api.get('/api/matches');
    return data;
  },

  /** 获取比赛详情（含球员统计、走势） */
  getMatchById: async (matchId: string): Promise<Match> => {
    const { data } = await api.get(`/api/matches/${matchId}/detail`);
    return data;
  },

  /** 获取比赛的球员统计数据 */
  getPlayerStats: async (matchId: string): Promise<Match['homePlayers'] & Match['awayPlayers']> => {
    const { data } = await api.get(`/api/matches/${matchId}/statistics`);
    // statistics 端点返回 { matchId, category, teamStats, currentScore }
    // 球员统计需要从详情接口获取（已包含 homePlayers/awayPlayers）
    return data;
  },

  /** 获取比赛的得分走势（从详情数据中提取，此方法保留为兼容层） */
  getScoreTrend: async (matchId: string): Promise<Match['scoreTrend']> => {
    // scoreTrend 已嵌入在 /detail 响应中，此处直接调用详情端点提取
    const { data } = await api.get(`/api/matches/${matchId}/detail`);
    return data.scoreTrend ?? [];
  },

  /** 导出比赛数据 */
  exportMatch: async (matchId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    const { data } = await api.get(`/api/matches/${matchId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return data;
  },
};

/** 运动类型 API */
export const sportApi = {
  /** 获取所有运动类型及规则 */
  getSports: async (): Promise<SportRule[]> => {
    const { data } = await api.get('/api/sports');
    return data;
  },
};

/** 竞速赛 API */
export const raceApi = {
  /** 获取比赛选手列表 */
  getParticipants: async (matchId: string) => {
    const { data } = await api.get(`/api/matches/${matchId}/participants`);
    return data;
  },

  /** 获取比赛排名结果 */
  getRaceResults: async (matchId: string) => {
    const { data } = await api.get(`/api/matches/${matchId}/race-results`);
    return data;
  },
};

/** 犯规类型 API */
export const foulTypeApi = {
  /** 获取所有犯规类型 */
  getFoulTypes: async () => {
    const { data } = await api.get('/api/foul-types');
    return data;
  },
};

/** 队伍管理 API */
export const teamApi = {
  /** 获取所有队伍 */
  getTeams: async () => {
    const { data } = await api.get('/api/teams');
    return data;
  },

  /** 获取指定队伍 */
  getTeamById: async (teamId: string) => {
    const { data } = await api.get(`/api/teams/${teamId}`);
    return data;
  },

  /** 创建队伍 */
  createTeam: async (teamData: { name: string; shortName?: string; logoUrl?: string }) => {
    const { data } = await api.post('/api/teams', teamData);
    return data;
  },

  /** 更新队伍 */
  updateTeam: async (teamId: string, teamData: { name?: string; shortName?: string; logoUrl?: string }) => {
    const { data } = await api.put(`/api/teams/${teamId}`, teamData);
    return data;
  },

  /** 删除队伍 */
  deleteTeam: async (teamId: string) => {
    const { data } = await api.delete(`/api/teams/${teamId}`);
    return data;
  },

  /** 获取队伍的所有队员 */
  getPlayers: async (teamId: string) => {
    const { data } = await api.get(`/api/teams/${teamId}/players`);
    return data;
  },

  /** 添加队员到队伍 */
  addPlayer: async (teamId: string, playerData: { name: string; number?: number; position?: string }) => {
    const { data } = await api.post(`/api/teams/${teamId}/players`, playerData);
    return data;
  },

  /** 更新队员 */
  updatePlayer: async (playerId: string, playerData: { name?: string; number?: number; position?: string }) => {
    const { data } = await api.put(`/api/teams/players/${playerId}`, playerData);
    return data;
  },

  /** 删除队员 */
  deletePlayer: async (playerId: string) => {
    const { data } = await api.delete(`/api/teams/players/${playerId}`);
    return data;
  },
};
