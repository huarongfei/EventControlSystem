import { Router, Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { validateParamId, validateBody } from '../middleware/validate';

const router = Router();

// 获取所有队伍
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const teams = await teamService.getAll();
    res.json(teams);
  } catch (err) {
    next(err);
  }
});

// 创建队伍
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
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
router.put('/:id', validateParamId('id'), async (req: Request, res: Response, next: NextFunction) => {
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
    res.json({ message: 'Team deleted successfully', team });
  } catch (err) {
    next(err);
  }
});

// 获取队伍的所有队员
router.get('/:id/players', async (req: Request, res: Response, next: NextFunction) => {
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
router.put('/players/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = req.params.playerId as string;
    const player = await teamService.updatePlayer(playerId, req.body);
    res.json(player);
  } catch (err) {
    next(err);
  }
});

// 删除队员
router.delete('/players/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = req.params.playerId as string;
    const player = await teamService.deletePlayer(playerId);
    res.json({ message: 'Player deleted successfully', player });
  } catch (err) {
    next(err);
  }
});

export const teamController = router;
