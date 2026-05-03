import { prisma } from '../utils/prisma';
import type { events, matches } from '@prisma/client';

export class EventRepository {
  async findAll(): Promise<(events & { _count?: { matches: number } })[]> {
    return prisma.events.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { matches: true }
        }
      }
    });
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
