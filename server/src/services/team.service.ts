import { teamRepository } from '../repositories/team.repository';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { PaginationOptions } from '../utils/pagination';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  shortName: z.string().max(10).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export class TeamService {
  async getAll(options?: PaginationOptions) {
    const result = await teamRepository.findAll(options);
    return {
      data: result.items,
      total: result.total,
    };
  }

  async getById(id: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw AppError.notFound('TEAM_NOT_FOUND', `Team with id ${id} not found`);
    }
    return team;
  }

  async create(data: unknown) {
    const parsed = createTeamSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '));
    }

    const { logoUrl, ...rest } = parsed.data;
    return teamRepository.create({
      id: uuidv4(),
      ...rest,
      logoUrl: logoUrl && logoUrl !== '' ? logoUrl : undefined,
    });
  }

  async update(id: string, data: unknown) {
    await this.getById(id); // 先检查队伍是否存在

    const parsed = createTeamSchema.partial().safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '));
    }

    const { logoUrl, ...rest } = parsed.data;
    
    const updateData: any = { ...rest };
    if (logoUrl !== undefined) {
      updateData.logoUrl = logoUrl === '' ? null : logoUrl;
    }
    
    return teamRepository.update(id, updateData);
  }

  async delete(id: string) {
    await this.getById(id); // 先检查队伍是否存在
    return teamRepository.delete(id);
  }

  async getPlayers(teamId: string) {
    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: { players: { orderBy: { number: 'asc' } } },
    });
    
    if (!team) {
      throw AppError.notFound('TEAM_NOT_FOUND', `Team with id ${teamId} not found`);
    }
    return team.players || [];
  }

  async addPlayer(teamId: string, data: unknown) {
    await this.getById(teamId); // 先检查队伍是否存在

    const playerSchema = z.object({
      name: z.string().min(1, 'Player name is required'),
      number: z.number().int().min(0).max(99).optional(),
      position: z.string().max(20).optional(),
    });

    const parsed = playerSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '));
    }

    return prisma.players.create({
      data: {
        id: uuidv4(),
        teamId,
        ...parsed.data,
      },
    });
  }

  async updatePlayer(playerId: string, data: unknown) {
    const playerSchema = z.object({
      name: z.string().min(1, 'Player name is required').optional(),
      number: z.number().int().min(0).max(99).optional(),
      position: z.string().max(20).optional(),
    });

    const parsed = playerSchema.partial().safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '));
    }

    const player = await prisma.players.findUnique({ where: { id: playerId } });
    if (!player) {
      throw AppError.notFound('PLAYER_NOT_FOUND', `Player with id ${playerId} not found`);
    }

    return prisma.players.update({
      where: { id: playerId },
      data: parsed.data,
    });
  }

  async deletePlayer(playerId: string) {
    const player = await prisma.players.findUnique({ where: { id: playerId } });
    if (!player) {
      throw AppError.notFound('PLAYER_NOT_FOUND', `Player with id ${playerId} not found`);
    }

    return prisma.players.delete({ where: { id: playerId } });
  }
}

export const teamService = new TeamService();
