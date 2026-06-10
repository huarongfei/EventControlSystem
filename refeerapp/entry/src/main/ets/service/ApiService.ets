// ApiService.ets - HTTP 请求服务
// 后端直接返回 JSON 对象/数组（非 {success,data} 包装），此处做统一适配
import http from '@ohos.net.http';
import { MatchInfo, FoulType } from '../model/MatchModels';

const DEFAULT_TIMEOUT = 10000; // 10秒超时

// ── 后端实际返回的比赛列表项格式 ──
export interface MatchListItem {
  id: string;
  event_id: string;
  event_name: string;
  home_team: { id: string; name: string; short_name: string; logo: string | null };
  away_team: { id: string; name: string; short_name: string; logo: string | null };
  home_score: number;
  away_score: number;
  status: string;
  current_period: number;
  total_periods: number;
  period_label: string;
  game_clock: string;
  sport_type: string;
  category: string;
  sport_emoji: string;
}

// ── 后端比赛详情格式 ──
export interface MatchDetail {
  id: string;
  category: string;
  sportType: string;
  homeTeam: { id: string; name: string; short_name: string; logo: string | null };
  awayTeam: { id: string; name: string; short_name: string; logo: string | null };
  homeStats: { teamId: string; score: number };
  awayStats: { teamId: string; score: number };
  status: string;
  currentPeriod: number;
  totalPeriods: number;
  periodLabel: string;
  gameClock: string;
}

/** 统一 API 响应包装，内部使用 */
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** API 服务类 */
export class ApiService {
  private baseUrl: string = '';

  /** 设置服务器地址 */
  setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** 构建完整 URL */
  private buildUrl(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  /** GET 请求 — 返回解析后的 JS 值 */
  async getRaw(path: string): Promise<ApiResult<Object>> {
    const httpReq = http.createHttp();
    try {
      const url = this.buildUrl(path);
      const response = await httpReq.request(url, {
        method: http.RequestMethod.GET,
        connectTimeout: DEFAULT_TIMEOUT,
        readTimeout: DEFAULT_TIMEOUT,
        header: { 'Accept': 'application/json' },
        expectDataType: http.HttpDataType.STRING,
      });
      httpReq.destroy();

      if (response.responseCode >= 200 && response.responseCode < 300) {
        const raw = response.result as string;
        try {
          const parsed = JSON.parse(raw) as Object;
          return { ok: true, data: parsed };
        } catch {
          return { ok: false, error: '响应解析失败' };
        }
      }
      return { ok: false, error: `HTTP ${response.responseCode}` };
    } catch (err) {
      httpReq.destroy();
      return { ok: false, error: `网络错误: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  /** POST / PUT / PATCH 请求 */
  async sendRaw(method: http.RequestMethod, path: string, body: object): Promise<ApiResult<Object>> {
    const httpReq = http.createHttp();
    try {
      const url = this.buildUrl(path);
      const response = await httpReq.request(url, {
        method,
        header: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        extraData: JSON.stringify(body),
        connectTimeout: DEFAULT_TIMEOUT,
        readTimeout: DEFAULT_TIMEOUT,
        expectDataType: http.HttpDataType.STRING,
      });
      httpReq.destroy();

      if (response.responseCode >= 200 && response.responseCode < 300) {
        const raw = response.result as string;
        try {
          const parsed = JSON.parse(raw) as Object;
          return { ok: true, data: parsed };
        } catch {
          return { ok: true }; // 有些接口无 body
        }
      }
      return { ok: false, error: `HTTP ${response.responseCode}` };
    } catch (err) {
      httpReq.destroy();
      return { ok: false, error: `网络错误: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // ─── 便捷方法 ─────────────────────────────────────────────

  /** 健康检查 — 后端返回 {status:"ok",...} */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getRaw('/api/health');
      if (!result.ok || !result.data) return false;
      const body = result.data as Record<string, string>;
      return body['status'] === 'ok';
    } catch {
      return false;
    }
  }

  /** 获取比赛列表 */
  async getMatchList(): Promise<ApiResult<MatchListItem[]>> {
    const result = await this.getRaw('/api/matches');
    if (!result.ok) return { ok: false, error: result.error };
    // 后端直接返回数组
    return { ok: true, data: result.data as MatchListItem[] };
  }

  /** 获取比赛详情 */
  async getMatchDetail(matchId: string): Promise<ApiResult<MatchDetail>> {
    const result = await this.getRaw(`/api/matches/${matchId}/detail`);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, data: result.data as MatchDetail };
  }

  /** 更新比分 */
  async updateScore(matchId: string, homeScore: number, awayScore: number): Promise<ApiResult<Object>> {
    return this.sendRaw(http.RequestMethod.PUT, `/api/matches/${matchId}/score`, { homeScore, awayScore });
  }

  /** 上报比赛事件 */
  async reportEvent(matchId: string, event: object): Promise<ApiResult<Object>> {
    return this.sendRaw(http.RequestMethod.POST, `/api/matches/${matchId}/events`, event);
  }

  /** 修改比赛状态 */
  async updateStatus(matchId: string, status: string): Promise<ApiResult<Object>> {
    return this.sendRaw(http.RequestMethod.PUT, `/api/matches/${matchId}/status`, { status });
  }

  /** 获取犯规类型列表 - 后端直接返回数组，也兼容 {success,data} 格式 */
  async getFoulTypes(sportType: string): Promise<ApiResult<FoulType[]>> {
    const result = await this.getRaw(`/api/foul-types?sportType=${sportType}`);
    if (!result.ok) return { ok: false, error: result.error };
    
    // 后端直接返回数组（根据注释说明）
    const data = result.data;
    if (Array.isArray(data)) {
      return { ok: true, data: data as FoulType[] };
    }
    
    // 兼容 {success, data} 包装格式
    const response = data as Record<string, Object>;
    if (response['success'] === true && response['data']) {
      return { ok: true, data: response['data'] as FoulType[] };
    }
    
    return { ok: false, error: '获取犯规类型失败：响应格式错误' };
  }
}

/** 导出单例 */
export const apiService = new ApiService();
