// ApiService - HTTP 请求封装（HarmonyOS NEXT API）
import http from '@ohos.net.http';
import { Match, Team, MatchEvent } from '../model/MatchModels';
import { preferences } from '@kit.ArkData';

const BASE_URL_KEY = 'server_url';
const MATCH_ID_KEY = 'match_id';
const DEVICE_ID_KEY = 'device_id';

// 默认服务器地址
const DEFAULT_BASE_URL = 'http://192.168.1.100:3001';

// 预置的比赛ID（种子数据）
const DEMO_MATCH_ID = '46a9f476-b050-4e88-84cc-0a44c16b7c03';

export class ApiService {
  private baseUrl: string = DEFAULT_BASE_URL;
  private context: any = null;

  constructor(context: any = null) {
    this.context = context;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.trim().replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // 通用 HTTP 请求方法
  private async request<T>(
    path: string,
    options: {
      method: http.RequestMethod;
      body?: string;
      headers?: Record<string, string>;
    }
  ): Promise<T | null> {
    const url = `${this.baseUrl}${path}`;

    try {
      const httpRequest = http.createHttp();
      const response = await httpRequest.request(url, {
        method: options.method,
        header: options.headers || {
          'Content-Type': 'application/json'
        },
        extraData: options.body,
        connectTimeout: 10000,
        readTimeout: 10000
      });

      if (response.responseCode === 200 || response.responseCode === 201) {
        const result = response.result;
        if (typeof result === 'string') {
          return JSON.parse(result) as T;
        }
        return result as T;
      }

      console.error(`API Error: ${response.responseCode} - ${response.result}`);
      return null;
    } catch (e) {
      console.error(`Request failed: ${e}`);
      return null;
    }
  }

  async getMatches(eventId?: string): Promise<Match[]> {
    const path = eventId
      ? `/api/events/${eventId}/matches`
      : '/api/matches';

    const result = await this.request<any[]>(path, {
      method: http.RequestMethod.GET
    });

    return result || [];
  }

  async getMatch(matchId: string): Promise<Match | null> {
    const result = await this.request<any>(`/api/matches/${matchId}`, {
      method: http.RequestMethod.GET
    });

    if (result) {
      return this.normalizeMatch(result);
    }
    return null;
  }

  async getMatchDetail(matchId: string): Promise<any | null> {
    const result = await this.request<any>(`/api/matches/${matchId}/detail`, {
      method: http.RequestMethod.GET
    });

    return result;
  }

  async updateScore(matchId: string, homeScore: number, awayScore: number): Promise<boolean> {
    const result = await this.request<any>(`/api/matches/${matchId}/score`, {
      method: http.RequestMethod.PUT,
      body: JSON.stringify({ homeScore, awayScore }),
      headers: { 'Content-Type': 'application/json' }
    });

    return result !== null;
  }

  async updateStatus(matchId: string, status: string): Promise<boolean> {
    const result = await this.request<any>(`/api/matches/${matchId}/status`, {
      method: http.RequestMethod.PUT,
      body: JSON.stringify({ status }),
      headers: { 'Content-Type': 'application/json' }
    });

    return result !== null;
  }

  async reportEvent(event: MatchEvent): Promise<boolean> {
    const result = await this.request<any>(`/api/matches/${event.matchId}/events`, {
      method: http.RequestMethod.POST,
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' }
    });

    return result !== null;
  }

  async createMatch(matchData: Partial<Match>): Promise<Match | null> {
    const result = await this.request<any>('/api/matches', {
      method: http.RequestMethod.POST,
      body: JSON.stringify(matchData),
      headers: { 'Content-Type': 'application/json' }
    });

    if (result) {
      return this.normalizeMatch(result);
    }
    return null;
  }

  // 数据标准化
  private normalizeMatch(data: any): Match {
    return {
      id: data.id || '',
      eventId: data.eventId || data.event_id || '',
      homeTeam: {
        id: data.homeTeamId || data.home_team?.id || '',
        name: data.homeTeamName || data.home_team?.name || '主队',
        logo: data.homeTeamLogo || data.home_team?.logo || ''
      },
      awayTeam: {
        id: data.awayTeamId || data.away_team?.id || '',
        name: data.awayTeamName || data.away_team?.name || '客队',
        logo: data.awayTeamLogo || data.away_team?.logo || ''
      },
      homeScore: data.homeScore ?? data.home_score ?? 0,
      awayScore: data.awayScore ?? data.away_score ?? 0,
      currentPeriod: data.currentPeriod ?? data.current_period ?? 1,
      status: data.status || 'pending',
      sportType: data.sportType || data.sport_type || 'basketball',
      startTime: data.startTime || data.start_time || Date.now(),
      venue: data.venue || ''
    };
  }
}

// 单例导出
export const apiService = new ApiService();