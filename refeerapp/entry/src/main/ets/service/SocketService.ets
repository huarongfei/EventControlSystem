// SocketService.ets
// 用 Socket.IO HTTP 长轮询（EIO=4 polling transport）实现实时通信
// HarmonyOS 的原生 @ohos.net.webSocket 无法连接 Socket.IO（协议不兼容），
// 改用 HTTP 轮询模拟 Engine.IO 握手，完整支持 Socket.IO v4 事件。
import http from '@ohos.net.http';

// ─── 数据类型 ──────────────────────────────────────────────────────────────

export interface ScoreUpdateData {
  matchId: string;
  homeScore: number;
  awayScore: number;
  period: number;
  matchTime: string;
}

export interface TimerData {
  matchId: string;
  remainingTime: number;
  period: number;
  status: string;
  isCountdown: boolean;
}

export interface SocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onScoreUpdate?: (data: ScoreUpdateData) => void;
  onTimerTick?: (data: TimerData) => void;
  onMatchUpdate?: (data: object) => void;
  onError?: (msg: string) => void;
}

// ─── Engine.IO / Socket.IO 常量 ───────────────────────────────────────────
// Engine.IO packet types (单字符前缀)
const EIO_OPEN    = '0'; // Server → Client: session info
const EIO_CLOSE   = '1';
const EIO_PING    = '2'; // Client → Server
const EIO_PONG    = '3'; // Server → Client: keepalive
const EIO_MESSAGE = '4'; // payload 前缀，后续跟 Socket.IO 包

// Socket.IO packet types (EIO_MESSAGE 之后的第一个字符)
const SIO_CONNECT    = '0'; // namespace connection
const SIO_DISCONNECT = '1';
const SIO_EVENT      = '2';
const SIO_ACK        = '3';

// ─── SocketService ────────────────────────────────────────────────────────

export class SocketService {
  private baseUrl: string = '';
  private sid: string = '';          // Engine.IO session id
  private matchId: string = '';
  private callbacks: SocketCallbacks = {};
  private pollTimer: number = -1;
  private pingTimer: number = -1;
  private pingInterval: number = 25000;
  private running: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnect: number = 10;

  // ─── 公开 API ───────────────────────────────────────────────

  /** 初始化，传入 http://host:port 格式的 baseUrl */
  setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  connect(matchId: string, cb: SocketCallbacks): void {
    this.matchId = matchId;
    this.callbacks = cb;
    this.running = true;
    this.reconnectAttempts = 0;
    this.doHandshake();
  }

  disconnect(): void {
    this.running = false;
    this.stopPoll();
    this.stopPing();
    this.sid = '';
    this.callbacks.onDisconnect?.();
  }

  isConnected(): boolean {
    return this.sid !== '' && this.running;
  }

  /** 向服务端 emit 一个 Socket.IO 事件（fire-and-forget） */
  emit(event: string, data: object): void {
    if (!this.sid) return;
    const payload = JSON.stringify([event, data]);
    const packet = EIO_MESSAGE + SIO_EVENT + payload;
    this.postPacket(packet).catch(() => {});
  }

  // ─── 握手 ─────────────────────────────────────────────────

  private async doHandshake(): Promise<void> {
    try {
      const url = `${this.baseUrl}/socket.io/?EIO=4&transport=polling`;
      const result = await this.httpGet(url);
      if (!result) {
        this.scheduleReconnect();
        return;
      }

      // Engine.IO 握手响应: "0{...json...}"
      if (!result.startsWith(EIO_OPEN)) {
        this.callbacks.onError?.('握手响应格式错误: ' + result.substring(0, 50));
        this.scheduleReconnect();
        return;
      }

      const json = JSON.parse(result.substring(1)) as Record<string, Object>;
      this.sid = json['sid'] as string;
      this.pingInterval = (json['pingInterval'] as number) || 25000;

      // Socket.IO namespace 连接包: "40"
      await this.postPacket(EIO_MESSAGE + SIO_CONNECT);

      // 加入比赛房间（Socket.IO event: match:join）
      await this.postSioEvent('match:join', { matchId: this.matchId });

      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();

      // 启动轮询 & 心跳
      this.startPoll();
      this.startPing();
    } catch (err) {
      this.callbacks.onError?.(`握手失败: ${String(err)}`);
      this.scheduleReconnect();
    }
  }

  // ─── 长轮询循环 ──────────────────────────────────────────

  private startPoll(): void {
    this.schedulePoll();
  }

  private stopPoll(): void {
    if (this.pollTimer !== -1) {
      clearTimeout(this.pollTimer);
      this.pollTimer = -1;
    }
  }

  private schedulePoll(): void {
    if (!this.running || !this.sid) return;
    // 立即轮询
    this.doPoll();
  }

  private async doPoll(): Promise<void> {
    if (!this.running || !this.sid) return;
    try {
      const url = `${this.baseUrl}/socket.io/?EIO=4&transport=polling&sid=${this.sid}`;
      const body = await this.httpGet(url);
      if (body !== null) {
        this.processPackets(body);
      }
    } catch {
      // 网络错误，稍后重试
    }

    // 持续轮询（不使用 setInterval 避免并发）
    if (this.running && this.sid) {
      this.pollTimer = setTimeout(() => {
        this.pollTimer = -1;
        this.doPoll();
      }, 1000); // 每 1 秒轮询一次
    }
  }

  // ─── 解析 Engine.IO 包 ────────────────────────────────────

  private processPackets(raw: string): void {
    // Engine.IO v4 多包用 \x1e 分隔
    const packets = raw.split('\x1e');
    for (const pkt of packets) {
      if (!pkt) continue;
      this.processOnePacket(pkt);
    }
  }

  private processOnePacket(pkt: string): void {
    if (!pkt || pkt.length === 0) return;
    const type = pkt[0];

    switch (type) {
      case EIO_PONG:
        // 心跳 pong
        break;
      case EIO_CLOSE:
        if (this.running) {
          this.sid = '';
          this.stopPoll();
          this.stopPing();
          this.callbacks.onDisconnect?.();
          this.scheduleReconnect();
        }
        break;
      case EIO_MESSAGE: {
        // Socket.IO 层
        const sioPayload = pkt.substring(1); // 去掉 EIO_MESSAGE 前缀
        this.processSioPacket(sioPayload);
        break;
      }
      default:
        console.warn(`[Socket] Unknown EIO packet type: ${type}, pkt=${pkt.substring(0, 40)}`);
        break;
    }
  }

  private processSioPacket(payload: string): void {
    if (!payload || payload.length === 0) return;
    const type = payload[0];

    switch (type) {
      case SIO_CONNECT:
        // namespace 连接确认，已在握手后 onConnect 触发，忽略
        break;
      case SIO_DISCONNECT:
        if (this.running) {
          this.sid = '';
          this.stopPoll();
          this.callbacks.onDisconnect?.();
          this.scheduleReconnect();
        }
        break;
      case SIO_EVENT: {
        // 格式: 2["eventName", data] 或 2/namespace,["eventName", data]
        const jsonStr = payload.substring(1).trim();
        try {
          const arr = JSON.parse(jsonStr) as Array<Object>;
          if (Array.isArray(arr) && arr.length >= 1) {
            const eventName = arr[0] as string;
            const eventData = arr.length >= 2 ? arr[1] : {};
            this.handleSioEvent(eventName, eventData as Record<string, Object>);
          }
        } catch (err) {
          console.warn(`[Socket] SIO_EVENT JSON parse error: ${String(err)}, raw=${jsonStr.substring(0, 80)}`);
        }
        break;
      }
      case SIO_ACK:
        // 忽略 ACK
        break;
      default:
        break;
    }
  }

  // ─── 处理业务事件 ─────────────────────────────────────────

  private handleSioEvent(event: string, data: Record<string, Object>): void {
    switch (event) {
      case 'score:update':
        this.callbacks.onScoreUpdate?.(data as unknown as ScoreUpdateData);
        break;
      case 'timer:tick':
        this.callbacks.onTimerTick?.(data as unknown as TimerData);
        break;
      case 'match:event':
        this.callbacks.onMatchUpdate?.(data);
        break;
      case 'match:state':
        // 进入房间后收到完整状态，可触发得分更新
        if (data && data['match']) {
          const m = data['match'] as Record<string, Object>;
          const scoreUpdate: ScoreUpdateData = {
            matchId: m['id'] as string,
            homeScore: m['homeScore'] as number,
            awayScore: m['awayScore'] as number,
            period: m['currentPeriod'] as number,
            matchTime: m['matchTime'] as string,
          };
          this.callbacks.onScoreUpdate?.(scoreUpdate);
        }
        break;
      case 'error':
        this.callbacks.onError?.((data['message'] as string) || '服务器错误');
        break;
      default:
        break;
    }
  }

  // ─── 发包辅助 ─────────────────────────────────────────────

  /** 向服务端 POST 一个 Engine.IO 文本包 */
  private async postPacket(packet: string): Promise<void> {
    if (!this.baseUrl) return;
    const sidParam = this.sid ? `&sid=${this.sid}` : '';
    const url = `${this.baseUrl}/socket.io/?EIO=4&transport=polling${sidParam}`;
    await this.httpPost(url, packet);
  }

  /** 封装 Socket.IO 事件包并发送 */
  private async postSioEvent(event: string, data: object): Promise<void> {
    const payload = JSON.stringify([event, data]);
    await this.postPacket(EIO_MESSAGE + SIO_EVENT + payload);
  }

  // ─── 心跳 ────────────────────────────────────────────────

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.sid && this.running) {
        this.postPacket(EIO_PING).catch(() => {});
      }
    }, this.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer !== -1) {
      clearInterval(this.pingTimer);
      this.pingTimer = -1;
    }
  }

  // ─── 重连 ────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (!this.running) return;
    if (this.reconnectAttempts >= this.maxReconnect) {
      this.callbacks.onError?.('已达到最大重连次数，请手动重试');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    setTimeout(() => {
      if (this.running) this.doHandshake();
    }, delay);
  }

  // ─── HTTP 工具 ────────────────────────────────────────────

  private async httpGet(url: string): Promise<string | null> {
    const req = http.createHttp();
    try {
      const resp = await req.request(url, {
        method: http.RequestMethod.GET,
        connectTimeout: 8000,
        readTimeout: 35000, // polling 服务器会 hold 请求到有数据
        expectDataType: http.HttpDataType.STRING,
      });
      req.destroy();
      if (resp.responseCode >= 200 && resp.responseCode < 300) {
        return resp.result as string;
      }
      return null;
    } catch {
      req.destroy();
      return null;
    }
  }

  private async httpPost(url: string, body: string): Promise<boolean> {
    const req = http.createHttp();
    try {
      const resp = await req.request(url, {
        method: http.RequestMethod.POST,
        header: { 'Content-Type': 'text/plain;charset=UTF-8' },
        extraData: body,
        connectTimeout: 8000,
        readTimeout: 10000,
        expectDataType: http.HttpDataType.STRING,
      });
      req.destroy();
      return resp.responseCode >= 200 && resp.responseCode < 300;
    } catch {
      req.destroy();
      return false;
    }
  }
}

export const socketService = new SocketService();
