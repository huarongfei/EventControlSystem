import { Router, Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { validateParamId, validateBody } from '../middleware/validate';
import { parsePagination, paginate } from '../utils/pagination';

const router = Router();

// 获取所有队伍（支持分页）
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = parsePagination(req.query);
    const result = await teamService.getAll(options);
    if (options.page || options.limit !== 20) {
      res.json(paginate(result.data, result.total, options.page!, options.limit!));
    } else {
      res.json(result.data);
    }
  } catch (err) {
    next(err);
  }
});

// 创建队伍
router.post('/', validateBody({ rules: [
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 100 },
    { field: 'sportType', type: 'string', required: false, maxLength: 30 },
    { field: 'abbreviation', type: 'string', required: false, maxLength: 10 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await teamService.create(req.body);
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
});

// 获取指定队伍
router.get('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const team = await teamService.getById(id);
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// 更新队伍
router.put('/:id', validateParamId('id'), validateBody({ rules: [
    { field: 'name', type: 'string', required: false, minLength: 1, maxLength: 100 },
    { field: 'sportType', type: 'string', required: false, maxLength: 30 },
    { field: 'abbreviation', type: 'string', required: false, maxLength: 10 },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const team = await teamService.update(id, req.body);
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// 删除队伍
router.delete('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const team = await teamService.delete(id);
    res.json({ deleted: team.id });
  } catch (err) {
    next(err);
  }
});

// 获取队伍的所有队员
router.get('/:id/players', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.id as string;
    const players = await teamService.getPlayers(teamId);
    res.json(players);
  } catch (err) {
    next(err);
  }
});

// 添加队员到队伍
router.post('/:id/players', validateParamId('id'), validateBody({ rules: [
    { field: 'name', type: 'string', required: true },
    { field: 'jerseyNumber', type: 'number', required: false },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.id as string;
    const player = await teamService.addPlayer(teamId, req.body);
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
});

// 更新队员
router.put('/players/:playerId', validateParamId('playerId'), validateBody({ rules: [
    { field: 'name', type: 'string', required: false, minLength: 1, maxLength: 100 },
    { field: 'jerseyNumber', type: 'number', required: false },
  ] }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = req.params.playerId as string;
    const player = await teamService.updatePlayer(playerId, req.body);
    res.json(player);
  } catch (err) {
    next(err);
  }
});

// 删除队员
router.delete('/players/:playerId', validateParamId('playerId'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = req.params.playerId as string;
    const player = await teamService.deletePlayer(playerId);
    res.json({ deleted: player.id });
  } catch (err) {
    next(err);
  }
});

export const teamController = router;
