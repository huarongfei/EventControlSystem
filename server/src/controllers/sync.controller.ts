import { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { getIO } from '../socket';
import { matchEventRepository } from '../repositories/match.repository';
import logger from '../utils/logger';

const router = Router();

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

    // 批量大小限制，防止 DoS
    const MAX_BATCH_SIZE = 200;
    if (events.length > MAX_BATCH_SIZE) {
      res.status(413).json({
        error: 'PAYLOAD_TOO_LARGE',
        message: `单次同步最多 ${MAX_BATCH_SIZE} 个事件，当前 ${events.length} 个`,
      });
      return;
    }

    const results: Array<{ success: boolean; id?: string; error?: string; clientTimestamp?: string }> = [];

    // Track seen clientEventIds for dedup within this batch
    const seenClientIds = new Set<string>();

    for (const event of events) {
      try {
        // Dedup: skip if we've already processed this clientEventId in this batch
        if (event.clientEventId) {
          if (seenClientIds.has(event.clientEventId)) {
            results.push({
              success: true,
              clientTimestamp: event.clientTimestamp,
            });
            continue;
          }
          // Check if this event was already synced in a previous batch
          const existing = await matchEventRepository.findByClientEventId(event.clientEventId);
          if (existing) {
            results.push({
              success: true,
              id: existing.id,
              clientTimestamp: event.clientTimestamp,
            });
            continue;
          }
          seenClientIds.add(event.clientEventId);
        }

        // Delegate to MatchService.addEvent() for validation + match existence check
        const created = await matchService.addEvent(event.matchId || '', {
          type: event.type,
          period: event.period,
          teamId: event.teamId,
          playerId: event.playerId,
          detail: event.detail,
          reportedBy: event.reportedBy || 'sync',
          clientEventId: event.clientEventId || null,
        });

        // Broadcast the synced event
        const io = getIO();
        io.to(`match:${event.matchId}`).emit('match:event', { event: created });

        results.push({
          success: true,
          id: created.id,
          clientTimestamp: event.clientTimestamp,
        });
      } catch (err: any) {
        logger.debug(`[sync] Event sync failed for ${event.clientTimestamp}: ${err.message}`);
        results.push({
          success: false,
          error: err.message || 'Sync failed',
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
