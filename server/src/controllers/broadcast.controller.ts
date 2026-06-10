import { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { validateParamId, validateBody } from '../middleware/validate';

const router = Router();

router.get('/:matchId', validateParamId('matchId'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matchId = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
    const scene = await matchService.getBroadcast(matchId);
    res.json(scene || null);
  } catch (err) {
    next(err);
  }
});

// 导播场景更新：校验字段类型和范围
const broadcastUpdateRules: Array<{ field: string; type: 'string' | 'enum'; required?: boolean; maxLength?: number; values?: string[] }> = [
  { field: 'name', type: 'string', required: false, maxLength: 100 },
  { field: 'layout', type: 'enum', required: false, values: ['single', 'dual', 'quad', 'scoreboard'] },
  { field: 'primaryCamera', type: 'string', required: false, maxLength: 50 },
  { field: 'transition', type: 'enum', required: false, values: ['cut', 'fade', 'wipe'] },
];

router.put('/:matchId',
  validateParamId('matchId'),
  validateBody({ rules: broadcastUpdateRules }),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matchId = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
    const scene = await matchService.updateBroadcast(matchId, req.body);
    res.json(scene);
  } catch (err) {
    next(err);
  }
});

export { router as broadcastController };
