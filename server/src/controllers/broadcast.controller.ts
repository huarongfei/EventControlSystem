import { Router, Request, Response, NextFunction } from 'express';
import { matchService } from '../services/match.service';
import { validateParamId } from '../middleware/validate';

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

router.put('/:matchId', validateParamId('matchId'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matchId = Array.isArray(req.params.matchId) ? req.params.matchId[0] : req.params.matchId;
    const scene = await matchService.updateBroadcast(matchId, req.body);
    res.json(scene);
  } catch (err) {
    next(err);
  }
});

export { router as broadcastController };
