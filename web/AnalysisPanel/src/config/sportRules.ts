/**
 * 运动规则配置中心 - 前端副本
 * 与后端 server/src/config/sport-rules.ts 保持同步
 */
import type { SportRule, SportCategory } from '@/types';

const basketball: SportRule = {
  sportType: 'basketball',
  displayName: '篮球',
  emoji: '🏀',
  category: 'team',
  periodCount: 4,
  periodDuration: 10,
  periodGoal: 0,
  periodNames: ['第1节', '第2节', '第3节', '第4节'],
  periodNamesShort: ['Q1', 'Q2', 'Q3', 'Q4'],
  isCountdown: true,
  scoreButtons: [1, 2, 3],
  eventTypes: ['score', 'foul', 'timeout', 'substitution', 'injury'],
  teamStats: ['得分', '篮板', '助攻', '抢断', '盖帽', '犯规'],
  playerStats: ['得分', '篮板', '助攻', '抢断', '盖帽', '二分命中', '三分命中', '罚球命中', '犯规'],
};

const football: SportRule = {
  sportType: 'football',
  displayName: '足球',
  emoji: '⚽',
  category: 'team',
  periodCount: 2,
  periodDuration: 45,
  periodGoal: 0,
  periodNames: ['上半场', '下半场'],
  periodNamesShort: ['H1', 'H2'],
  isCountdown: false,
  scoreButtons: [1],
  eventTypes: ['score', 'yellow_card', 'red_card', 'substitution', 'corner_kick', 'offside', 'injury'],
  teamStats: ['进球', '射门', '射正', '角球', '黄牌', '红牌', '犯规'],
  playerStats: ['进球', '助攻', '射门', '黄牌', '红牌', '犯规'],
};

const volleyball: SportRule = {
  sportType: 'volleyball',
  displayName: '排球',
  emoji: '🏐',
  category: 'team',
  periodCount: 3,
  periodDuration: 0,
  periodGoal: 25,
  periodNames: ['第1局', '第2局', '第3局'],
  periodNamesShort: ['S1', 'S2', 'S3'],
  isCountdown: false,
  scoreButtons: [1],
  eventTypes: ['score', 'foul', 'timeout', 'substitution', 'injury'],
  teamStats: ['得分', '发球', '扣球', '拦网', '犯规'],
  playerStats: ['得分', '发球', '扣球', '拦网', '犯规'],
};

const badminton: SportRule = {
  sportType: 'badminton',
  displayName: '羽毛球',
  emoji: '🏸',
  category: 'team',
  periodCount: 3,
  periodDuration: 0,
  periodGoal: 21,
  periodNames: ['第1局', '第2局', '第3局'],
  periodNamesShort: ['G1', 'G2', 'G3'],
  isCountdown: false,
  scoreButtons: [1],
  eventTypes: ['score', 'foul', 'substitution', 'side_change', 'injury'],
  teamStats: ['得分', '发球', '杀球', '犯规'],
  playerStats: ['得分', '发球', '杀球', '失误', '犯规'],
};

const tennis: SportRule = {
  sportType: 'tennis',
  displayName: '网球',
  emoji: '🎾',
  category: 'team',
  periodCount: 3,
  periodDuration: 0,
  periodGoal: 6,
  periodNames: ['第1盘', '第2盘', '第3盘'],
  periodNamesShort: ['T1', 'T2', 'T3'],
  isCountdown: false,
  scoreButtons: [1],
  eventTypes: ['score', 'foul', 'substitution', 'side_change', 'injury'],
  teamStats: ['得分', 'ACE球', '破发'],
  playerStats: ['得分', 'ACE球', '破发', '犯规'],
};

const tableTennis: SportRule = {
  sportType: 'table_tennis',
  displayName: '乒乓球',
  emoji: '🏓',
  category: 'team',
  periodCount: 5,
  periodDuration: 0,
  periodGoal: 11,
  periodNames: ['第1局', '第2局', '第3局', '第4局', '第5局'],
  periodNamesShort: ['G1', 'G2', 'G3', 'G4', 'G5'],
  isCountdown: false,
  scoreButtons: [1],
  eventTypes: ['score', 'foul', 'substitution', 'side_change', 'injury'],
  teamStats: ['得分', '发球得分', '攻球得分'],
  playerStats: ['得分', '发球得分', '攻球得分', '失误', '犯规'],
};

const swimming: SportRule = {
  sportType: 'swimming',
  displayName: '游泳',
  emoji: '🏊',
  category: 'race',
  periodCount: 1,
  periodDuration: 0,
  periodGoal: 0,
  periodNames: ['决赛'],
  periodNamesShort: ['FINAL'],
  isCountdown: false,
  scoreButtons: [],
  eventTypes: ['finish', 'dq', 'withdraw'],
  teamStats: [],
  playerStats: ['用时', '分段成绩'],
  raceConfig: {
    lanes: 8,
    recordSplits: true,
    splitDistances: [50, 100],
  },
};

const running: SportRule = {
  sportType: 'running',
  displayName: '跑步',
  emoji: '🏃',
  category: 'race',
  periodCount: 1,
  periodDuration: 0,
  periodGoal: 0,
  periodNames: ['决赛'],
  periodNamesShort: ['FINAL'],
  isCountdown: false,
  scoreButtons: [],
  eventTypes: ['finish', 'dq', 'withdraw'],
  teamStats: [],
  playerStats: ['用时', '分段成绩'],
  raceConfig: {
    lanes: 8,
    recordSplits: true,
    splitDistances: [400, 800, 1500],
  },
};

/** 所有运动规则映射表 */
export const SPORT_RULES: Record<string, SportRule> = {
  basketball,
  football,
  volleyball,
  badminton,
  tennis,
  table_tennis: tableTennis,
  swimming,
  running,
};

/** 获取指定运动类型的规则 */
export function getSportRule(sportType: string): SportRule {
  return SPORT_RULES[sportType] ?? basketball;
}

/** 获取所有运动类型列表 */
export function getAllSportTypes(): SportRule[] {
  return Object.values(SPORT_RULES);
}

/** 按类别获取运动列表 */
export function getSportsByCategory(category: SportCategory): SportRule[] {
  return Object.values(SPORT_RULES).filter((r) => r.category === category);
}

/** 根据节次获取节次名称 */
export function getPeriodName(sportType: string, periodIndex: number): string {
  const rule = getSportRule(sportType);
  return rule.periodNames[periodIndex - 1] ?? `第${periodIndex}节`;
}

/** 获取当前节次显示名称（用于记分板） */
export function getPeriodLabel(sportType: string, quarter: number | string | 'OT'): string {
  if (typeof quarter === 'string' && quarter !== 'OT') {
    return quarter; // B类运动直接返回
  }
  const rule = getSportRule(sportType);
  if (quarter === 'OT') {
    return '加时赛';
  }
  return rule.periodNamesShort[(quarter as number) - 1] ?? `Q${quarter}`;
}
