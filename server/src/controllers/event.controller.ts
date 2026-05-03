import { Router, Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { matchService } from '../services/match.service';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.getAll();
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const event = await eventService.getById(id);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/matches — 获取赛事下的所有比赛
router.get('/:id/matches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // 先检查赛事是否存在
    await eventService.getById(id);
    // 获取该赛事下的比赛列表
    const matches = await matchService.getListByEventId(id);
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id — 删除赛事
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deleted = await eventService.delete(id);
    res.json({ success: true, deleted });
  } catch (err) {
    next(err);
  }
});

export const eventController = router;
