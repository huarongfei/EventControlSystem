import { prisma } from '../utils/prisma';
import type { matches, match_events, broadcast_scenes, match_participants, events } from '@prisma/client';

export class MatchRepository {
  async findAll(): Promise<any[]> {
    return prisma.matches.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teams_matches_homeTeamIdToteams: true,
        teams_matches_awayTeamIdToteams: true,
        events: true,
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.matches.findUnique({
      where: { id },
      include: {
        teams_matches_homeTeamIdToteams: true,
        teams_matches_awayTeamIdToteams: true,
        events: true,
      },
    });
  }

  async findByEventId(eventId: string): Promise<any[]> {
    return prisma.matches.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      include: {
        teams_matches_homeTeamIdToteams: true,
        teams_matches_awayTeamIdToteams: true,
        events: true,
      },
    });
  }

  async findEventById(eventId: string): Promise<any> {
    return prisma.events.findUnique({ where: { id: eventId } });
  }

  async updateScore(
    id: string,
    homeScore: number,
    awayScore: number,
    period: number,
    matchTime: string
  ): Promise<matches> {
    return prisma.matches.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        currentPeriod: period,
        matchTime,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<matches> {
    const data: Record<string, unknown> = { status };

    if (status === 'running' && !data.startedAt) {
      data.startedAt = new Date();
    }
    if (status === 'finished') {
      data.endedAt = new Date();
    }

    return prisma.matches.update({
      where: { id },
      data: data as any,
    });
  }

  async findByStatus(status: string): Promise<matches[]> {
    return prisma.matches.findMany({
      where: { status },
    });
  }

  async updateMatchTime(id: string, matchTime: string): Promise<matches> {
    return prisma.matches.update({
      where: { id },
      data: { matchTime },
    });
  }

  async updateCurrentPeriod(id: string, currentPeriod: number): Promise<matches> {
    return prisma.matches.update({
      where: { id },
      data: { currentPeriod },
    });
  }

  // ─── B类运动：选手管理 ─────────────────────

  async findParticipants(matchId: string): Promise<any[]> {
    return prisma.match_participants.findMany({
      where: { matchId },
      orderBy: { laneNumber: 'asc' },
    });
  }

  async addParticipant(matchId: string, data: { laneNumber: number; athleteName: string; teamName?: string }): Promise<any> {
    return prisma.match_participants.create({
      data: { matchId, ...data },
    });
  }

  async updateParticipant(
    matchId: string,
    participantId: string,
    data: { splitTimes?: any[]; finalTime?: string; rank?: number; status?: string }
  ): Promise<any> {
    const updateData: Record<string, unknown> = {};
    if (data.splitTimes !== undefined) updateData.splitTimes = JSON.stringify(data.splitTimes);
    if (data.finalTime !== undefined) updateData.finalTime = data.finalTime;
    if (data.rank !== undefined) updateData.rank = data.rank;
    if (data.status !== undefined) updateData.status = data.status;
    return prisma.match_participants.update({
      where: { id: participantId },
      data: updateData,
    });
  }

  /** 按 finalTime 重新计算排名 */
  async recalculateRanks(matchId: string): Promise<any[]> {
    const participants = await this.findParticipants(matchId);
    const finished = participants
      .filter((p: any) => p.finalTime && p.status !== 'dq')
      .sort((a: any, b: any) => (a.finalTime as string).localeCompare(b.finalTime as string));

    const updates: Promise<any>[] = [];
    finished.forEach((p: any, idx: number) => {
      updates.push(
        prisma.match_participants.update({
          where: { id: p.id },
          data: { rank: idx + 1 },
        })
      );
    });

    // DQ 的选手排在最后
    const dq = participants.filter((p: any) => p.status === 'dq');
    for (const p of dq) {
      updates.push(
        prisma.match_participants.update({
          where: { id: p.id },
          data: { rank: null },
        })
      );
    }

    await Promise.all(updates);
    return this.findParticipants(matchId);
  }

  async create(data: {
    eventId: string;
    homeTeamId: string;
    awayTeamId: string;
    category?: string;
    sportType?: string;
    status?: string;
    currentPeriod?: number;
    periodDuration?: number;
    periodGoal?: number;
    matchTime?: string;
  }): Promise<matches> {
    return prisma.matches.create({
      data: {
        eventId: data.eventId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        category: data.category ?? 'team',
        sportType: data.sportType ?? 'basketball',
        status: data.status ?? 'not_started',
        currentPeriod: data.currentPeriod ?? 1,
        periodDuration: data.periodDuration ?? 10,
        periodGoal: data.periodGoal ?? 0,
        matchTime: data.matchTime ?? '10:00',
      },
    });
  }

  async update(id: string, data: {
    category?: string;
    sportType?: string;
    status?: string;
    currentPeriod?: number;
    periodDuration?: number;
    matchTime?: string;
    homeTeamId?: string;
    awayTeamId?: string;
  }): Promise<matches> {
    return prisma.matches.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<matches> {
    return prisma.matches.delete({
      where: { id },
    });
  }
}

export class MatchEventRepository {
  async findByMatchId(matchId: string): Promise<match_events[]> {
    return prisma.match_events.findMany({
      where: { matchId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async create(data: {
    id: string;
    matchId: string;
    type: string;
    period?: number;
    teamId?: string;
    playerId?: string;
    detail?: string;
    reportedBy?: string;
  }): Promise<match_events> {
    return prisma.match_events.create({ data });
  }

  async findStatsByMatchId(matchId: string): Promise<any[]> {
    return prisma.match_events.findMany({
      where: { matchId },
      select: {
        type: true,
        teamId: true,
        period: true,
      },
    });
  }
}

export class BroadcastSceneRepository {
  async findByMatchId(matchId: string): Promise<broadcast_scenes | null> {
    return prisma.broadcast_scenes.findUnique({
      where: { matchId },
    });
  }

  async upsert(
    matchId: string,
    data: {
      name?: string;
      layout?: string;
      primaryCamera?: string;
      overlay?: string;
      transition?: string;
    }
  ): Promise<broadcast_scenes> {
    return prisma.broadcast_scenes.upsert({
      where: { matchId },
      create: { matchId, ...data },
      update: data,
    });
  }
}

export const matchRepository = new MatchRepository();
export const matchEventRepository = new MatchEventRepository();
export const broadcastSceneRepository = new BroadcastSceneRepository();
