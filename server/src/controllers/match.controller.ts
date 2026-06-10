import { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { getIO } from '../socket';
import { validateParamId, validateBody } from '../middleware/validate';
import { parsePagination, paginate } from '../utils/pagination';
import { AppError } from '../utils/AppError';

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

// GET /api/matches — 获取所有比赛列表（支持分页）
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = parsePagination(req.query);
    const result = await matchService.getList(options);
    if (options.page || options.limit !== 20) {
      // 分页请求：返回标准分页格式
      res.json(paginate(result.data, result.total, options.page!, options.limit!));
    } else {
      // 无分页参数：保持向后兼容
      res.json(result.data);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/detail — 获取比赛完整详情（必须在 :id 之前）
router.get('/:id/detail', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const detail = await matchService.getDetail(id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id/statistics
router.get('/:id/statistics', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/:id/export', validateParamId('id'), (req: Request, res: Response, next: NextFunction) => {
  // format 参数白名单验证
  const format = (req.query.format as string) || 'json';
  const allowedFormats = ['json', 'csv'];
  if (!allowedFormats.includes(format)) {
    next(AppError.badRequest('INVALID_FORMAT', `导出格式必须是: ${allowedFormats.join(', ')}`));
    return;
  }
  // 将验证后的 format 挂到 req 上供 handler 使用
  req.body = { _validatedFormat: format };
  next();
}, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const format = req.body._validatedFormat as string;
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
router.get('/:id/participants', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const participants = await matchService.getRaceResults(id);
    res.json(participants);
  } catch (err) {
    next(err);
  }
});

// POST /api/matches/:id/participants
router.post('/:id/participants', validateParamId('id'), validateBody({ rules: [
    { field: 'laneNumber', type: 'number', required: true, min: 1, max: 99 },
    { field: 'athleteName', type: 'string', required: true, minLength: 1, maxLength: 100 },
    { field: 'teamName', type: 'string', required: false, maxLength: 100 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const participant = await matchService.addParticipant(id, req.body);
    res.status(201).json(participant);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id/participants/:pid/time
router.put('/:id/participants/:pid/time', validateParamId('id'), validateBody({ rules: [
    { field: 'finalTime', type: 'string', required: false, maxLength: 20 },
    { field: 'rank', type: 'number', required: false, min: 1, max: 999 },
    { field: 'status', type: 'enum', required: false, values: ['pending', 'running', 'finished', 'dq'] },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
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
router.get('/:id/race-results', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
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
      quarter: match.currentPeriod,
      gameClock: match.matchTime,
    });

    res.json(match);
  } catch (err) {
    next(err);
  }
});

// POST /api/matches/:id/events
router.post('/:id/events', validateParamId('id'), validateBody({ rules: [
    { field: 'type', type: 'string', required: true, minLength: 1, maxLength: 50 },
    { field: 'period', type: 'number', required: false, min: 1, max: 99 },
    { field: 'teamId', type: 'uuid', required: false },
    { field: 'playerId', type: 'uuid', required: false },
    { field: 'detail', type: 'string', required: false, maxLength: 1000 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
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
router.put('/:id', validateParamId('id'), validateBody({ rules: [
    { field: 'sportType', type: 'string', required: false, maxLength: 30 },
    { field: 'category', type: 'enum', required: false, values: ['team', 'race'] },
    { field: 'status', type: 'string', required: false, maxLength: 20 },
    { field: 'venue', type: 'string', required: false, maxLength: 200 },
    { field: 'periodDuration', type: 'number', required: false, min: 1, max: 120 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
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
    res.json({ deleted: match.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/matches/:id — 获取单场比赛（必须放在最后）
router.get('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await matchService.getById(id);
    res.json(match);
  } catch (err) {
    next(err);
  }
});

export const matchController = router;
