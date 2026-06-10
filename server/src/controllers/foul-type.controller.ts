import { Router } from 'express';
import {
  getAllFoulTypes,
  getFoulTypesBySport,
  getFoulTypeById,
  getSupportedSportTypes
} from '../services/foul-type.service';

const router = Router();

/**
 * @route   GET /api/foul-types
 * @desc    获取所有犯规类型
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const sportType = req.query.sportType as string;
    
    let foulTypes;
    if (sportType) {
      foulTypes = getFoulTypesBySport(sportType);
    } else {
      foulTypes = getAllFoulTypes();
    }
    
    res.json({
      success: true,
      data: foulTypes,
      total: foulTypes.length,
      sportTypes: getSupportedSportTypes()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/foul-types/sports
 * @desc    获取所有支持的运动类型
 * @access  Public
 */
router.get('/sports', async (req, res, next) => {
  try {
    const sports = getSupportedSportTypes();
    
    // 返回运动类型详细信息
    const sportInfo: { [key: string]: { name: string; nameEn: string; emoji: string; foulCount: number } } = {};
    
    const allFoulTypes = getAllFoulTypes();
    sports.forEach(st => {
      const firstFoul = allFoulTypes.find(f => f.sportType === st);
      sportInfo[st] = {
        name: getSportName(st),
        nameEn: getSportNameEn(st),
        emoji: getSportEmoji(st),
        foulCount: allFoulTypes.filter(f => f.sportType === st).length
      };
    });
    
    res.json({
      success: true,
      data: sportInfo
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/foul-types/:id
 * @desc    获取指定犯规类型详情
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const foulType = getFoulTypeById(req.params.id);
    
    if (!foulType) {
      return res.status(404).json({
        error: 'FOUL_TYPE_NOT_FOUND',
        message: 'Foul type not found',
      });
    }
    
    res.json({
      success: true,
      data: foulType
    });
  } catch (err) {
    next(err);
  }
});

// 辅助函数
function getSportName(sportType: string): string {
  const names: { [key: string]: string } = {
    basketball: '篮球',
    football: '足球',
    volleyball: '排球',
    badminton: '羽毛球',
    tennis: '网球',
    table_tennis: '乒乓球',
    swimming: '游泳',
    running: '田径'
  };
  return names[sportType] || sportType;
}

function getSportNameEn(sportType: string): string {
  const names: { [key: string]: string } = {
    basketball: 'Basketball',
    football: 'Football',
    volleyball: 'Volleyball',
    badminton: 'Badminton',
    tennis: 'Tennis',
    table_tennis: 'Table Tennis',
    swimming: 'Swimming',
    running: 'Athletics'
  };
  return names[sportType] || sportType;
}

function getSportEmoji(sportType: string): string {
  const emojis: { [key: string]: string } = {
    basketball: '🏀',
    football: '⚽',
    volleyball: '🏐',
    badminton: '🏸',
    tennis: '🎾',
    table_tennis: '🏓',
    swimming: '🏊',
    running: '🏃'
  };
  return emojis[sportType] || '🏆';
}

export default router;
