import {
  matchRepository,
  matchEventRepository,
  broadcastSceneRepository,
} from '../repositories/match.repository';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { matchTimerService } from './match-timer.service';
import { getSportRule, SportRule } from '../config/sport-rules';
import { PaginationOptions } from '../utils/pagination';

const ALL_EVENT_TYPES = [
  'score','foul','substitution','timeout','injury',
  'yellow_card','red_card','corner_kick','offside','side_change',
  'finish','dq','withdraw',
] as const;

// ─── 统计字段标准化映射（中文规则名 → 英文API字段名） ───
// 前端组件依赖固定的英文字段名，后端规则使用中文名。
// 此映射确保 API 返回一致的英文键，无论运动类型如何。
const STAT_FIELD_MAP: Record<string, string> = {
  // 通用
  '得分': 'points',
  '篮板': 'totalRebounds',
  '助攻': 'assists',
  '抢断': 'steals',
  '盖帽': 'blocks',
  '犯规': 'fouls',
  '失误': 'turnovers',
  // 篮球细分
  '二分命中': 'twoPointMade',
  '二分尝试': 'twoPointAttempted',
  '三分命中': 'threePointMade',
  '三分尝试': 'threePointAttempted',
  '罚球命中': 'freeThrowMade',
  '罚球尝试': 'freeThrowAttempted',
  '进攻篮板': 'offensiveRebounds',
  '防守篮板': 'defensiveRebounds',
  // 足球
  '进球': 'goals',
  '射门': 'shots',
  '射正': 'shotsOnTarget',
  '角球': 'corners',
  // 排球
  '发球': 'serves',
  '扣球': 'spikes',
  '拦网': 'blocks',
};

/** 将后端规则的中文统计键转换为标准英文字段名 */
function normalizeStatKey(key: string): string {
  return STAT_FIELD_MAP[key] || key;
}

// ─── Schemas ──────────────────────────────────────────────────

const updateScoreSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  period: z.number().int().min(1).optional(),
  matchTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const addEventSchema = z.object({
  type: z.enum(ALL_EVENT_TYPES),
  period: z.number().int().min(1).optional(),
  teamId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  detail: z.record(z.unknown()).optional(),
  reportedBy: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['not_started', 'running', 'paused', 'finished']),
});

const updateBroadcastSchema = z.object({
  name: z.string().optional(),
  layout: z.enum(['single', 'dual', 'quad', 'scoreboard']).optional(),
  primaryCamera: z.string().optional(),
  overlay: z.record(z.unknown()).optional(),
  transition: z.enum(['cut', 'fade', 'wipe']).optional(),
});

const createMatchSchema = z.object({
  eventId: z.string().uuid(),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  category: z.enum(['team', 'race']).optional(),
  sportType: z.string().optional(),
  status: z.enum(['not_started', 'running', 'paused', 'finished']).optional(),
  periodDuration: z.number().int().min(0).optional(),
  matchTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const updateMatchSchema = z.object({
  category: z.enum(['team', 'race']).optional(),
  sportType: z.string().optional(),
  status: z.enum(['not_started', 'running', 'paused', 'finished']).optional(),
  currentPeriod: z.number().int().min(1).optional(),
  periodDuration: z.number().int().min(0).optional(),
  matchTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  homeTeamId: z.string().uuid().optional(),
  awayTeamId: z.string().uuid().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    not_started: 'upcoming',
    running: 'live',
    paused: 'paused',
    finished: 'finished',
  };
  return map[status] ?? status;
}

/** 从 match 上读取 / 解析 SportRule */
function getRule(match: any): SportRule {
  // 优先从 scoreRules JSON 读取（Event 创建时注入的完整规则）
  if ((match as any).scoreRules) {
    try {
      const parsed = JSON.parse((match as any).scoreRules);
      if (parsed.sportType) return parsed as SportRule;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.debug(`[getRule] Failed to parse match.scoreRules: ${msg}`);
    }
  }
  // 其次从 Event → scoreRules 读取
  const event = (match as any).events;
  if (event?.scoreRules) {
    try {
      const parsed = JSON.parse(event.scoreRules);
      if (parsed.sportType) return parsed as SportRule;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.debug(`[getRule] Failed to parse event.scoreRules: ${msg}`);
    }
  }
  // 回退：根据 sportType 从内置规则获取
  const sportType = (match as any).sportType || event?.sportType || 'basketball';
  return getSportRule(sportType);
}

// ─── MatchService ─────────────────────────────────────────────

export class MatchService {

  // ════════════════════════════════════════
  //  获取比赛列表（Dashboard 用）
  // ════════════════════════════════════════

  async getList(options?: PaginationOptions) {
    const result = await matchRepository.findAll(options);
    return {
      data: this.formatMatchList(result.items),
      total: result.total,
    };
  }

  // ════════════════════════════════════════
  //  获取指定赛事下的比赛列表
  // ════════════════════════════════════════

  async getListByEventId(eventId: string, options?: PaginationOptions) {
    const matches = await matchRepository.findByEventId(eventId);
    return {
      data: this.formatMatchList(matches),
      total: matches.length,
    };
  }

  private formatMatchList(matches: any[]) {
    return matches.map((m: any) => {
      const rule = getRule(m);
      const homeTeam = m.teams_matches_homeTeamIdToteams;
      const awayTeam = m.teams_matches_awayTeamIdToteams;
      const event = m.events;
      return {
        id: m.id,
        event_id: m.eventId,
        event_name: event?.name ?? '',
        home_team: this.formatTeam(homeTeam),
        away_team: this.formatTeam(awayTeam),
        home_score: m.homeScore,
        away_score: m.awayScore,
        status: mapStatus(m.status),
        currentQuarter: m.currentPeriod,       // 前端 MatchListItem 类型使用 currentQuarter
        total_periods: rule.periodNames.length,
        period_duration_minutes: m.periodDuration ?? rule.periodDuration ?? 10,
        period_label: rule.periodNames[m.currentPeriod - 1] ?? `第${m.currentPeriod}节`,
        game_clock: m.matchTime,
        start_time: m.startedAt?.toISOString() ?? m.createdAt.toISOString(),
        sport_type: (m as any).sportType ?? 'basketball',
        category: (m as any).category ?? 'team',
        sport_emoji: rule.emoji,
      };
    });
  }

  private formatTeam(team: any) {
    return {
      id: team.id,
      name: team.name,
      short_name: team.shortName ?? team.name,
      logo: team.logoUrl ?? null,
    };
  }

  async getById(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    return match;
  }

  // ════════════════════════════════════════
  //  比赛详情（按 category 分支）
  // ════════════════════════════════════════

  async getDetail(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }

    const rule = getRule(match);
    if (rule.category === 'race') {
      return this.buildRaceDetail(match, rule);
    }
    return this.buildTeamDetail(match, rule);
  }

  /** A类：两队对战详情 */
  private async buildTeamDetail(match: any, rule: SportRule) {
    const events = await matchEventRepository.findByMatchId(match.id);
    const homeTeam = match.teams_matches_homeTeamIdToteams;
    const awayTeam = match.teams_matches_awayTeamIdToteams;

    // ── 动态构建球员统计 ─────────────────────
    const statFields = rule.playerStats;
    const playerStatMap: Record<string, any> = {};

    const initPlayer = (player: any) => {
      if (playerStatMap[player.id]) return;
      const obj: any = {
        playerId: player.id,
        player: {
          id: player.id,
          teamId: player.teamId,
          number: player.number ?? 0,
          name: player.name,
          position: player.position,
        },
      };
      for (const f of statFields) obj[normalizeStatKey(f)] = 0;
      // 确保基础字段始终存在（前端类型依赖）
      obj.points ??= 0;
      obj.totalRebounds ??= 0;
      obj.assists ??= 0;
      obj.steals ??= 0;
      obj.blocks ??= 0;
      obj.turnovers ??= 0;
      obj.fouls ??= 0;
      obj.twoPointMade ??= 0;
      obj.twoPointAttempted ??= 0;
      obj.threePointMade ??= 0;
      obj.threePointAttempted ??= 0;
      obj.freeThrowMade ??= 0;
      obj.freeThrowAttempted ??= 0;
      obj.offensiveRebounds ??= 0;
      obj.defensiveRebounds ??= 0;
      obj.efficiency ??= 0;
      playerStatMap[player.id] = obj;
    };

    [...homeTeam.players, ...awayTeam.players].forEach(initPlayer);

    // ── 按事件累积统计 ─────────────────────
    for (const ev of events) {
      if (!ev.playerId || !playerStatMap[ev.playerId]) continue;
      const ps = playerStatMap[ev.playerId];
      const detail = ev.detail ? JSON.parse(ev.detail) : {};

      if (ev.type === 'score') {
        const pts = detail.points ?? 1;
        const pointsKey = normalizeStatKey('得分');
        ps[pointsKey] = (ps[pointsKey] || 0) + pts;
        // 篮球细分（兼容）
        if (rule.sportType === 'basketball') {
          if (pts === 3) { ps[normalizeStatKey('三分命中')] = (ps[normalizeStatKey('三分命中')] || 0) + 1; ps[normalizeStatKey('三分尝试')] = (ps[normalizeStatKey('三分尝试')] || 0) + 1; }
          else if (pts === 1) { ps[normalizeStatKey('罚球命中')] = (ps[normalizeStatKey('罚球命中')] || 0) + 1; ps[normalizeStatKey('罚球尝试')] = (ps[normalizeStatKey('罚球尝试')] || 0) + 1; }
          else { ps[normalizeStatKey('二分命中')] = (ps[normalizeStatKey('二分命中')] || 0) + 1; ps[normalizeStatKey('二分尝试')] = (ps[normalizeStatKey('二分尝试')] || 0) + 1; }
        }
      } else if (ev.type === 'foul' || ev.type === 'yellow_card' || ev.type === 'red_card') {
        const foulKey = normalizeStatKey('犯规');
        ps[foulKey] = (ps[foulKey] || 0) + 1;
      } else if (ev.type === 'assist') {
        const assistKey = normalizeStatKey('助攻');
        ps[assistKey] = (ps[assistKey] || 0) + 1;
      }
    }

    // ── 走势数据 ─────────────────────
    let hScore = 0, aScore = 0;
    const scoreTrend: any[] = [{ gameClock: '00:00', homeScore: 0, awayScore: 0, period: 1 }];
    for (const ev of events.filter((e: any) => e.type === 'score')) {
      const detail = ev.detail ? JSON.parse(ev.detail) : {};
      const pts = detail.points ?? 1;
      if (ev.teamId === homeTeam.id) hScore += pts;
      else if (ev.teamId === awayTeam.id) aScore += pts;
      scoreTrend.push({
        gameClock: (ev as any).timestamp,
        homeScore: hScore,
        awayScore: aScore,
        period: ev.period ?? 1,
      });
    }

    // ── 格式化事件列表 ─────────────────────
    const eventsFormatted = events.map((ev: any) => ({
      id: ev.id,
      matchId: ev.matchId,
      teamId: ev.teamId,
      playerId: ev.playerId,
      eventType: ev.type,
      quarter: ev.period ?? 1,
      timestamp: (ev as any).timestamp?.toISOString() ?? new Date().toISOString(),
      gameClock: match.matchTime,
      description: this.formatEventDescription(ev, rule),
      points: ev.type === 'score' ? (ev.detail ? JSON.parse(ev.detail).points : 0) : undefined,
    }));

    const homePlayerStats = homeTeam.players.map((p: any) => playerStatMap[p.id]).filter(Boolean);
    const awayPlayerStats = awayTeam.players.map((p: any) => playerStatMap[p.id]).filter(Boolean);

    // 计算衍生统计：总篮板 + 效率值
    const deriveStats = (players: any[]) => players.map(p => {
      p.totalRebounds = (p.offensiveRebounds || 0) + (p.defensiveRebounds || 0);
      // 简化效率公式: PTS + REB + AST + STL + BLK - TO
      p.efficiency = (p.points || 0) + (p.totalRebounds || 0) + (p.assists || 0)
        + (p.steals || 0) + (p.blocks || 0) - (p.turnovers || 0);
      return p;
    });

    return {
      id: match.id,
      category: 'team',
      sportType: rule.sportType,
      homeTeam: this.formatTeam(homeTeam),
      awayTeam: this.formatTeam(awayTeam),
      homeStats: this.calcTeamStats(deriveStats(homePlayerStats), match.homeScore, homeTeam.id, homeTeam, rule),
      awayStats: this.calcTeamStats(deriveStats(awayPlayerStats), match.awayScore, awayTeam.id, awayTeam, rule),
      homePlayers: deriveStats(homePlayerStats),
      awayPlayers: deriveStats(awayPlayerStats),
      events: eventsFormatted,
      scoreTrend,
      status: mapStatus(match.status),
      currentQuarter: match.currentPeriod,       // 前端类型使用 currentQuarter
      periodLabel: rule.periodNames[match.currentPeriod - 1] ?? `第${match.currentPeriod}节`,
      gameClock: match.matchTime,
      startTime: match.startedAt?.toISOString() ?? match.createdAt.toISOString(),
      venue: (match as any).venue || null,
    };
  }

  /** B类：个人竞速赛详情 */
  private async buildRaceDetail(match: any, rule: SportRule) {
    const participants = await matchRepository.findParticipants(match.id);
    const sorted = [...participants].sort((a: any, b: any) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.rank && !b.rank) return -1;
      if (!a.rank && b.rank) return 1;
      if (a.finalTime && b.finalTime) return a.finalTime.localeCompare(b.finalTime);
      return 0;
    });

    return {
      id: match.id,
      category: 'race',
      sportType: rule.sportType,
      sportEmoji: rule.emoji,
      status: mapStatus(match.status),
      periodLabel: rule.periodNames[0] ?? '决赛',
      participants: sorted.map((p: any) => ({
        id: p.id,
        laneNumber: p.laneNumber,
        athleteName: p.athleteName,
        teamName: p.teamName,
        splitTimes: p.splitTimes ? JSON.parse(p.splitTimes) : [],
        finalTime: p.finalTime,
        rank: p.rank,
        status: p.status,
      })),
      startTime: match.startedAt?.toISOString() ?? match.createdAt.toISOString(),
    };
  }

  // ════════════════════════════════════════
  //  队伍统计（动态字段）
  // ════════════════════════════════════════

  private calcTeamStats(players: any[], score: number, teamId: string, team: any, rule: SportRule) {
    const stats: any = {
      teamId,
      team: this.formatTeam(team),
      score,
    };
    for (const f of rule.teamStats) {
      const normalizedKey = normalizeStatKey(f);
      stats[normalizedKey] = players.reduce((s: number, p: any) => s + (p[normalizedKey] || 0), 0);
    }
    return stats;
  }

  // ════════════════════════════════════════
  //  事件描述（按 sportType 适配）
  // ════════════════════════════════════════

  private formatEventDescription(ev: any, rule: SportRule): string {
    const detail = ev.detail ? JSON.parse(ev.detail) : {};
    switch (ev.type) {
      case 'score':
        return `得分 +${detail.points ?? 1}`;
      case 'foul':
        return `犯规: ${detail.foulType ?? '普通犯规'}`;
      case 'yellow_card':
        return `黄牌${detail.reason ? ': ' + detail.reason : ''}`;
      case 'red_card':
        return `红牌${detail.reason ? ': ' + detail.reason : ''}`;
      case 'timeout':
        return '请求暂停';
      case 'substitution':
        return '换人';
      case 'side_change':
        return '换边';
      case 'corner_kick':
        return '角球';
      case 'offside':
        return '越位';
      case 'injury':
        return '伤病';
      case 'finish':
        return `完赛 ${detail.time ?? ''}`;
      case 'dq':
        return '取消资格';
      case 'withdraw':
        return '退赛';
      default:
        return ev.type;
    }
  }

  // ════════════════════════════════════════
  //  导出数据
  // ════════════════════════════════════════

  async exportMatch(id: string, format: string): Promise<string> {
    const detail = await this.getDetail(id);
    if (detail.category === 'race') {
      // B类：导出选手成绩
      const rows = ['选手', '队伍', '最终成绩', '排名'].join(',');
      const lines = [rows];
      for (const p of (detail as any).participants) {
        lines.push([p.athleteName, p.teamName || '', p.finalTime || '', p.rank || ''].join(','));
      }
      return lines.join('\n');
    }
    // A类：导出球员统计
    const d = detail as any;
    const rows = ['球员', '队伍', '得分', '犯规'].join(',');
    const players = [...(d.homePlayers || []), ...(d.awayPlayers || [])];
    const lines = [rows];
    for (const p of players) {
      const teamName = (d.homePlayers || []).includes(p)
        ? d.homeTeam.name : d.awayTeam.name;
      lines.push([p.player.name, teamName, p['得分'] || 0, p['犯规'] || 0].join(','));
    }
    return lines.join('\n');
  }

  // ════════════════════════════════════════
  //  更新比分
  // ════════════════════════════════════════

  async updateScore(id: string, data: unknown) {
    const parsed = updateScoreSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map((e: any) => e.message).join(', '));
    }
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    return matchRepository.updateScore(
      id,
      parsed.data.homeScore,
      parsed.data.awayScore,
      parsed.data.period ?? match.currentPeriod,
      parsed.data.matchTime ?? match.matchTime
    );
  }

  // ════════════════════════════════════════
  //  上报事件
  // ════════════════════════════════════════

  async addEvent(id: string, data: unknown) {
    const parsed = addEventSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map((e: any) => e.message).join(', '));
    }
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    const { detail, ...rest } = parsed.data;
    return matchEventRepository.create({
      id: uuidv4(),
      matchId: id,
      ...rest,
      detail: detail ? JSON.stringify(detail) : undefined,
    });
  }

  // ════════════════════════════════════════
  //  统计数据
  // ════════════════════════════════════════

  async getStatistics(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    const rule = getRule(match);
    if (rule.category === 'race') {
      return { matchId: id, category: 'race', participants: await matchRepository.findParticipants(id) };
    }
    const events = await matchEventRepository.findStatsByMatchId(id);
    const stats: Record<string, Record<string, number>> = {};
    for (const event of events) {
      const teamKey = event.teamId || 'general';
      if (!stats[teamKey]) stats[teamKey] = {};
      const typeKey = event.type;
      stats[teamKey][typeKey] = (stats[teamKey][typeKey] || 0) + 1;
    }
    return {
      matchId: id,
      category: 'team',
      teamStats: stats,
      currentScore: { home: match.homeScore, away: match.awayScore },
    };
  }

  // ════════════════════════════════════════
  //  状态变更（接入计时器服务）
  // ════════════════════════════════════════

  async updateStatus(id: string, data: unknown) {
    const parsed = updateStatusSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map((e: any) => e.message).join(', '));
    }
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    const updated = await matchRepository.updateStatus(id, parsed.data.status);
    const rule = getRule(updated);
    await matchTimerService.onStatusChange(id, parsed.data.status, {
      ...updated,
      periodDuration: (updated as any).periodDuration ?? rule.periodDuration ?? 10,
      category: (updated as any).category ?? 'team',
      sportType: (updated as any).sportType ?? 'basketball',
    });
    return updated;
  }

  // ════════════════════════════════════════
  //  Broadcast
  // ════════════════════════════════════════

  async getBroadcast(matchId: string) {
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${matchId} not found`);
    }
    return broadcastSceneRepository.findByMatchId(matchId);
  }

  async updateBroadcast(matchId: string, data: unknown) {
    const parsed = updateBroadcastSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map((e: any) => e.message).join(', '));
    }
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${matchId} not found`);
    }
    const { overlay, ...rest } = parsed.data;
    return broadcastSceneRepository.upsert(matchId, {
      ...rest,
      overlay: overlay ? JSON.stringify(overlay) : undefined,
    });
  }

  // ════════════════════════════════════════
  //  B类：选手成绩管理
  // ════════════════════════════════════════

  async getRaceResults(matchId: string) {
    const participants = await matchRepository.findParticipants(matchId);
    return [...participants].sort((a: any, b: any) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.finalTime && b.finalTime) return a.finalTime.localeCompare(b.finalTime);
      return 0;
    });
  }

  async addParticipant(matchId: string, data: { laneNumber: number; athleteName: string; teamName?: string }) {
    return matchRepository.addParticipant(matchId, data);
  }

  async updateParticipantTime(matchId: string, participantId: string, data: { splitTimes?: any[]; finalTime?: string }) {
    return matchRepository.updateParticipant(matchId, participantId, data);
  }

  async updateRanks(matchId: string) {
    return matchRepository.recalculateRanks(matchId);
  }

  // ══════════════════════════════════════
  //  创建比赛（从 Event 继承 sportType/category）
  // ══════════════════════════════════════
  async create(data: unknown) {
    const parsed = createMatchSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map((e: any) => e.message).join(', '));
    }
    // 继承 Event 的 sportType / category
    const event = await matchRepository.findEventById(parsed.data.eventId);
    if (!event) {
      throw AppError.badRequest('EVENT_NOT_FOUND', `Event ${parsed.data.eventId} not found`);
    }
    let eventRules: any = null;
    if (event.scoreRules) {
      try { eventRules = JSON.parse(event.scoreRules); } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.warn(`[create] Failed to parse event.scoreRules: ${msg}`);
      }
    }
    return matchRepository.create({
      ...parsed.data,
      category: parsed.data.category ?? event.category ?? eventRules?.category ?? 'team',
      sportType: parsed.data.sportType ?? event.sportType ?? eventRules?.sportType ?? 'basketball',
      periodDuration: parsed.data.periodDuration ?? eventRules?.periodDuration ?? 10,
      periodGoal: eventRules?.periodGoal ?? 0,
    });
  }

  // ══════════════════════════════════════
  //  更新比赛信息
  // ══════════════════════════════════════
  async update(id: string, data: unknown) {
    const parsed = updateMatchSchema.safeParse(data);
    if (!parsed.success) {
      throw AppError.badRequest('VALIDATION_ERROR', parsed.error.errors.map((e: any) => e.message).join(', '));
    }
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    return matchRepository.update(id, parsed.data);
  }

  // ══════════════════════════════════════
  //  删除比赛
  // ══════════════════════════════════════
  async delete(id: string) {
    const match = await matchRepository.findById(id);
    if (!match) {
      throw AppError.notFound('MATCH_NOT_FOUND', `Match with id ${id} not found`);
    }
    return matchRepository.delete(id);
  }
}

export const matchService = new MatchService();
