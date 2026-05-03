// Match model
export interface Match {
  id: string;
  eventName: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  matchTime: string;
  status: string;
  sportType: string;
  periodDuration: number;
  periodGoal: number;
  totalPeriods: number;
  periodNames: string[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  number: number;
}

export enum EventType {
  SCORE = 'score',
  FOUL = 'foul',
  SUBSTITUTION = 'substitution',
  TIMEOUT = 'timeout',
  INJURY = 'injury',
  CANCEL = 'cancel',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  CORNER_KICK = 'corner_kick',
  OFFSIDE = 'offside',
  SIDE_CHANGE = 'side_change',
  FINISH = 'finish',
  DQ = 'dq',
  WITHDRAW = 'withdraw'
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: EventType;
  period: number;
  teamId: string;
  playerId?: string;
  detail?: Record<string, Object>;
  reportedBy: string;
  timestamp: number;
  isSynced?: boolean;
}

export interface SportRule {
  sportType: string;
  displayName: string;
  emoji: string;
  category: string;
  periodCount: number;
  periodDuration: number;
  periodGoal: number;
}

export const SPORT_RULES: Record<string, SportRule> = {
  basketball: {
    sportType: 'basketball',
    displayName: '篮球',
    emoji: '🏀',
    category: 'team',
    periodCount: 4,
    periodDuration: 10,
    periodGoal: 0
  },
  football: {
    sportType: 'football',
    displayName: '足球',
    emoji: '⚽',
    category: 'team',
    periodCount: 2,
    periodDuration: 45,
    periodGoal: 0
  },
  volleyball: {
    sportType: 'volleyball',
    displayName: '排球',
    emoji: '🏐',
    category: 'team',
    periodCount: 5,
    periodDuration: 0,
    periodGoal: 0
  },
  badminton: {
    sportType: 'badminton',
    displayName: '羽毛球',
    emoji: '🏸',
    category: 'individual',
    periodCount: 0,
    periodDuration: 0,
    periodGoal: 21
  },
  tennis: {
    sportType: 'tennis',
    displayName: '网球',
    emoji: '🎾',
    category: 'individual',
    periodCount: 0,
    periodDuration: 0,
    periodGoal: 0
  },
  table_tennis: {
    sportType: 'table_tennis',
    displayName: '乒乓球',
    emoji: '🏓',
    category: 'individual',
    periodCount: 0,
    periodDuration: 0,
    periodGoal: 11
  },
  swimming: {
    sportType: 'swimming',
    displayName: '游泳',
    emoji: '🏊',
    category: 'race',
    periodCount: 1,
    periodDuration: 0,
    periodGoal: 0
  },
  running: {
    sportType: 'running',
    displayName: '跑步',
    emoji: '🏃',
    category: 'race',
    periodCount: 1,
    periodDuration: 0,
    periodGoal: 0
  }
};

export function getSportRule(sportType: string): SportRule {
  return SPORT_RULES[sportType] || SPORT_RULES.basketball;
}
