import { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { getIO } from '../socket';
import { matchEventRepository } from '../repositories/match.repository';
import logger from '../utils/logger';

const router = Router();

// ─── 事件级字段校验规则 ──────────────
const VALID_EVENT_TYPES = ['score', 'foul', 'substitution', 'timeout', 'injury', 'period_end', 'card'];
const VALID_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'OT', 'ot'];

/** 快速校验单个事件对象，返回错误信息或 null */
function validateSyncEvent(event: any, index: number): string | null {
  if (!event.matchId || typeof event.matchId !== 'string' || event.matchId.trim() === '') {
    return `events[${index}]: matchId must be a non-empty string`;
  }
  if (!event.type || !VALID_EVENT_TYPES.includes(event.type)) {
    return `events[${index}]: type must be one of ${VALID_EVENT_TYPES.join(', ')}`;
  }
  if (event.period !== undefined && event.period !== null &&
      !VALID_PERIODS.includes(event.period) &&
      (typeof event.period !== 'number' || event.period < 1 || event.period > 10)) {
    return `events[${index}]: invalid period value`;
  }
  return null;
}

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

    for (const [index, event] of events.entries()) {
      try {
        // 事件级别字段校验
        const fieldError = validateSyncEvent(event, index);
        if (fieldError) {
          results.push({ success: false, error: fieldError, clientTimestamp: event.clientTimestamp });
          continue;
        }

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
        // 捕获唯一约束冲突（并发请求可能同时通过 findByClientEventId 检查）
        const created = await matchService.addEvent(event.matchId || '', {
          type: event.type,
          period: event.period,
          teamId: event.teamId,
          playerId: event.playerId,
          detail: event.detail,
          reportedBy: event.reportedBy || 'sync',
          clientEventId: event.clientEventId || null,
        }).catch((err: any) => {
          // Prisma P2002 = Unique constraint violation（clientEventId 重复）
          if (err?.code === 'P2002' || err?.message?.includes('Unique constraint')) {
            return null; // 重复事件，视为成功
          }
          throw err; // 其他错误继续抛出
        });

        // created 为 null 表示因重复被跳过
        if (!created) {
          results.push({ success: true, clientTimestamp: event.clientTimestamp });
          continue;
        }

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
