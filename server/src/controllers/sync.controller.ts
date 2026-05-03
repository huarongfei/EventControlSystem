import { Router, Request, Response, NextFunction } from 'express';
import { matchEventRepository } from '../repositories/match.repository';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getIO } from '../socket';

const router = Router();

const syncEventSchema = z.object({
  matchId: z.string().uuid(),
  type: z.string(),
  period: z.number().int().optional(),
  teamId: z.string().optional(),
  playerId: z.string().optional(),
  detail: z.record(z.unknown()).optional(),
  reportedBy: z.string().optional(),
  clientTimestamp: z.string().optional(),
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = req.body.events;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'events must be a non-empty array',
      });
      return;
    }

    const results: Array<{ success: boolean; id?: string; error?: string; clientTimestamp?: string }> = [];

    for (const event of events) {
      const parsed = syncEventSchema.safeParse(event);
      if (!parsed.success) {
        results.push({
          success: false,
          error: parsed.error.errors.map(e => e.message).join(', '),
          clientTimestamp: event.clientTimestamp,
        });
        continue;
      }

      try {
        const { detail, clientTimestamp, period, ...rest } = parsed.data;
        const created = await matchEventRepository.create({
          id: uuidv4(),
          period: period,
          ...rest,
          detail: detail ? JSON.stringify(detail) : undefined,
        });

        // Broadcast the synced event
        const io = getIO();
        io.to(`match:${parsed.data.matchId}`).emit('match:event', {
          event: created,
        });

        results.push({
          success: true,
          id: created.id,
          clientTimestamp,
        });
      } catch (err: any) {
        results.push({
          success: false,
          error: err.message,
          clientTimestamp: event.clientTimestamp,
        });
      }
    }

    res.json({
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (err) {
    next(err);
  }
});

export const syncController = router;
