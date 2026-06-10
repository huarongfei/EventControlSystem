import { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { getIO } from '../socket';
import { validateParamId, validateBody } from '../middleware/validate';

const router = Router();

// POST /api/matches — 创建比赛
router.post('/', validateBody({ rules: [
    { field: 'eventId', type: 'uuid', required: true },
    { field: 'homeTeamId', type: 'uuid', required: true },
    { field: 'awayTeamId', type: 'uuid', required: true },
  ] }), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const match = await matchService.create(_req.body);
    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches — 获取所有比赛列表
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const matches = await matchService.getList();
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/detail — 获取比赛完整详情（必须在 :id 之前）
router.get('/:id/detail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const detail = await matchService.getDetail(id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/statistics
router.get('/:id/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const statistics = await matchService.getStatistics(id);
    res.json(statistics);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/broadcast
router.get('/:id/broadcast', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const scene = await matchService.getBroadcast(id);
    res.json(scene || null);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id/broadcast
router.put('/:id/broadcast', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const scene = await matchService.updateBroadcast(id, req.body);

    // Broadcast scene change
    const io = getIO();
    io.to(`match:${id}`).emit('broadcast:scene_change', {
      matchId: id,
      scene,
    });

    res.json(scene);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/export — 导出比赛数据
router.get('/:id/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const format = (req.query.format as string) || 'json';
    const data = await matchService.exportMatch(id, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="match-${id}.csv"`);
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="match-${id}.json"`);
      res.send(data);
    }
  } catch (err) {
    next(err);
  }
});

// B类运动：选手管理路由（在 /:id/* 之前）

// GET /api/matches/:id/participants
router.get('/:id/participants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const participants = await matchService.getRaceResults(id);
    res.json(participants);
  } catch (err) {
    next(err);
  }
});

// POST /api/matches/:id/participants
router.post('/:id/participants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const participant = await matchService.addParticipant(id, req.body);
    res.status(201).json(participant);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id/participants/:pid/time
router.put('/:id/participants/:pid/time', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const pid = req.params.pid as string;
    const updated = await matchService.updateParticipantTime(id, pid, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/race-results
router.get('/:id/race-results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const results = await matchService.getRaceResults(id);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id/score
router.put('/:id/score', validateParamId('id'), validateBody({ rules: [
    { field: 'homeScore', type: 'number', required: false, min: 0 },
    { field: 'awayScore', type: 'number', required: false, min: 0 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await matchService.updateScore(id, req.body);

    // Broadcast score update
    const io = getIO();
    io.to(`match:${id}`).emit('score:update', {
      matchId: match.id,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      period: match.currentPeriod,
      matchTime: match.matchTime,
    });

    res.json(match);
  } catch (err) {
    next(err);
  }
});

// POST /api/matches/:id/events
router.post('/:id/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const matchEvent = await matchService.addEvent(id, req.body);

    // Broadcast new event
    const io = getIO();
    io.to(`match:${id}`).emit('match:event', {
      event: matchEvent,
    });

    res.status(201).json(matchEvent);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id/status
router.put('/:id/status', validateParamId('id'), validateBody({ rules: [
    { field: 'status', type: 'string', required: true },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await matchService.updateStatus(id, req.body);

    // Broadcast status change
    const io = getIO();
    io.to(`match:${id}`).emit('match:status_change', {
      matchId: match.id,
      status: match.status,
    });

    res.json(match);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id — 更新比赛信息（必须在 :id 之前，但在所有 /:id/xxx 之后）
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await matchService.update(id, req.body);
    res.json(match);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/matches/:id — 删除比赛
router.delete('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await matchService.delete(id);
    res.json({ success: true, deleted: match.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id — 获取单场比赛（必须放在最后）
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await matchService.getById(id);
    res.json(match);
  } catch (err) {
    next(err);
  }
});

export const matchController = router;
