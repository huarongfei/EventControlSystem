import { Router, Request, Response, NextFunction } from 'express';
import { getAllSportTypes, getSportsByCategory } from '../config/sport-rules';

const router = Router();

// GET /api/sports — 获取所有运动项目及规则
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const sports = category && (category === 'team' || category === 'race')
      ? getSportsByCategory(category)
      : getAllSportTypes();

    // 不暴露 raceConfig 的 splitDistances（仅内部使用）
    const sanitized = sports.map(s => ({
      sportType: s.sportType,
      displayName: s.displayName,
      emoji: s.emoji,
      category: s.category,
      periodCount: s.periodCount,
      periodDuration: s.periodDuration,
      periodGoal: s.periodGoal,
      periodNames: s.periodNames,
      periodNamesShort: s.periodNamesShort,
      isCountdown: s.isCountdown,
      scoreButtons: s.scoreButtons,
      eventTypes: s.eventTypes,
      teamStats: s.teamStats,
      playerStats: s.playerStats,
    }));

    res.json(sanitized);
  } catch (err) {
    next(err);
  }
});

export const sportController = router;
