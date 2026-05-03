import axios from 'axios';
import type { Team, Player } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const teamApi = {
  getTeams: async (): Promise<Team[]> => {
    const { data } = await api.get('/teams');
    return data;
  },

  getTeamById: async (teamId: string): Promise<Team> => {
    const { data } = await api.get(`/teams/${teamId}`);
    return data;
  },

  createTeam: async (teamData: { name: string; shortName?: string; logoUrl?: string }): Promise<Team> => {
    const { data } = await api.post('/teams', teamData);
    return data;
  },

  updateTeam: async (teamId: string, teamData: { name?: string; shortName?: string; logoUrl?: string }): Promise<Team> => {
    const { data } = await api.put(`/teams/${teamId}`, teamData);
    return data;
  },

  deleteTeam: async (teamId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}`);
  },

  getPlayers: async (teamId: string): Promise<Player[]> => {
    const { data } = await api.get(`/teams/${teamId}/players`);
    return data;
  },

  addPlayer: async (teamId: string, playerData: { name: string; number?: number; position?: string }): Promise<Player> => {
    const { data } = await api.post(`/teams/${teamId}/players`, playerData);
    return data;
  },

  updatePlayer: async (playerId: string, playerData: { name?: string; number?: number; position?: string }): Promise<Player> => {
    const { data } = await api.put(`/teams/players/${playerId}`, playerData);
    return data;
  },

  deletePlayer: async (playerId: string): Promise<void> => {
    await api.delete(`/teams/players/${playerId}`);
  },
};
