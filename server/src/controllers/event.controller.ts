import { Router, Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { matchService } from '../services/match.service';
import { parsePagination, paginate } from '../utils/pagination';
import { validateParamId, validateBody } from '../middleware/validate';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = parsePagination(req.query);
    const result = await eventService.getAll(options);
    if (options.page || options.limit !== 20) {
      res.json(paginate(result.data, result.total, options.page!, options.limit!));
    } else {
      res.json(result.data);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody({ rules: [
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 200 },
    { field: 'sportType', type: 'string', required: false, maxLength: 30 },
    { field: 'venue', type: 'string', required: false, maxLength: 200 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const event = await eventService.getById(id);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/matches — 获取赛事下的所有比赛（支持分页）
router.get('/:id/matches', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // 先检查赛事是否存在
    await eventService.getById(id);
    const options = parsePagination(req.query);
    const result = await matchService.getListByEventId(id, options);
    if (options.page || options.limit !== 20) {
      res.json(paginate(result.data, result.total, options.page!, options.limit!));
    } else {
      res.json(result.data);
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id — 删除赛事
router.delete('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deleted = await eventService.delete(id);
    res.json({ deleted: deleted.id });
  } catch (err) {
    next(err);
  }
});

export const eventController = router;
