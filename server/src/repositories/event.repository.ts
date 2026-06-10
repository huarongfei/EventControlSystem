import { prisma } from '../utils/prisma';
import type { events, matches } from '@prisma/client';
import { PaginationOptions } from '../utils/pagination';

export class EventRepository {
  async findAll(options?: PaginationOptions): Promise<{ items: (events & { _count?: { matches: number } })[]; total: number }> {
    const where = {};
    const [items, total] = await Promise.all([
      prisma.events.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: options ? (options.page! - 1) * options.limit! : undefined,
        take: options?.limit,
        include: {
          _count: {
            select: { matches: true }
          }
        }
      }),
      prisma.events.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<events | null> {
    return prisma.events.findUnique({
      where: { id },
    });
  }

  async create(data: {
    id: string;
    name: string;
    sportType: string;
    category?: string;
    startTime?: Date;
    status?: string;
    scoreRules?: string;
  }): Promise<events> {
    return prisma.events.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    sportType: string;
    startTime: Date;
    status: string;
    scoreRules: string;
  }>): Promise<events> {
    return prisma.events.update({ where: { id }, data });
  }

  async delete(id: string): Promise<events> {
    return prisma.events.delete({ where: { id } });
  }
}

export const eventRepository = new EventRepository();
