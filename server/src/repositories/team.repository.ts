import { prisma } from '../utils/prisma';
import type { teams } from '@prisma/client';

export class teamsRepository {
  async findAll(): Promise<teams[]> {
    return prisma.teams.findMany({
      include: { players: { orderBy: { number: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<teams | null> {
    return prisma.teams.findUnique({
      where: { id },
      include: { players: { orderBy: { number: 'asc' } } },
    });
  }

  async create(data: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  }): Promise<teams> {
    return prisma.teams.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    shortName: string;
    logoUrl: string;
  }>): Promise<teams> {
    return prisma.teams.update({ where: { id }, data });
  }

  async delete(id: string): Promise<teams> {
    return prisma.$transaction(async (tx) => {
      await tx.matches.deleteMany({
        where: {
          OR: [{ homeTeamId: id }, { awayTeamId: id }]
        }
      });
      return tx.teams.delete({ where: { id } });
    });
  }
}

export const teamRepository = new teamsRepository();
