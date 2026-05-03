import { eventRepository } from '../repositories/event.repository';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getSportRule, SportRule } from '../config/sport-rules';

const SPORT_TYPES = ['basketball', 'football', 'volleyball', 'badminton', 'tennis', 'table_tennis', 'swimming', 'running', 'custom'] as const;

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  sportType: z.enum(SPORT_TYPES),
  startTime: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  scoreRules: z.record(z.unknown()).optional(),
});

export class EventService {
  async getAll() {
    return eventRepository.findAll();
  }

  async getById(id: string) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw AppError.notFound('EVENT_NOT_FOUND', `Event with id ${id} not found`);
    }
    return event;
  }

  async delete(id: string) {
    // 先检查是否存在
    await this.getById(id);
    return eventRepository.delete(id);
  }

  async create(data: unknown) {
    const parsed = createEventSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '));
    }

    const { scoreRules, ...rest } = parsed.data;
    const rule: SportRule = getSportRule(parsed.data.sportType);

    return eventRepository.create({
      id: uuidv4(),
      ...rest,
      category: rule.category,
      scoreRules: JSON.stringify(rule),    // 自动注入完整规则
    });
  }
}

export const eventService = new EventService();
