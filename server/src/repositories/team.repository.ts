import { prisma } from '../utils/prisma';
import type { teams } from '@prisma/client';
import { PaginationOptions } from '../utils/pagination';

export class TeamsRepository {
  async findAll(options?: PaginationOptions): Promise<{ items: teams[]; total: number }> {
    const where = {};
    const [items, total] = await Promise.all([
      prisma.teams.findMany({
        where,
        include: { players: { orderBy: { number: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: options ? (options.page! - 1) * options.limit! : undefined,
        take: options?.limit,
      }),
      prisma.teams.count({ where }),
    ]);
    return { items, total };
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

export const teamRepository = new TeamsRepository();
