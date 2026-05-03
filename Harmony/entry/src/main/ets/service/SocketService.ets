// SocketService - WebSocket 连接（兼容后端 Socket.IO）
import webSocket from '@ohos.net.webSocket';
import { Match, MatchEvent, EventType } from '../model/MatchModels';

export class SocketService {
  private ws: webSocket.WebSocket | null = null;
  private matchUpdateCallback: ((match: Match) => void) | null = null;
  private eventCallback: ((event: MatchEvent) => void) | null = null;
  private connectionCallback: ((connected: boolean) => void) | null = null;
  private serverUrl: string = '';
  private matchId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isManualClose: boolean = false;

  connect(serverUrl: string, matchId: string): void {
    this.serverUrl = serverUrl;
    this.matchId = matchId;
    this.reconnectAttempts = 0;
    this.isManualClose = false;

    try {
      // Convert http/https to ws/wss
      let wsUrl = serverUrl.replace(/^http/, 'ws');
      // Socket.IO default path is /socket.io/?EIO=4&transport=websocket
      wsUrl += '/socket.io/?EIO=4&transport=websocket';

      this.notifyConnectionChange(false);

      this.ws = webSocket.createWebSocket();
      this.ws.onOpen((err, value) => {
        if (err) {
          console.error('WebSocket onOpen error:', err);
          this.notifyConnectionChange(false);
          return;
        }
        console.info('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);
        // Send Socket.IO probe/protocol message
        this.sendSocketIOMessage('40'); // Socket.IO v4 join message
        // Join match room
        this.sendSocketIOMessage(`42["join_match","${matchId}"]`);
      });

      this.ws.onMessage((err, value) => {
        if (err) {
          console.error('WebSocket onMessage error:', err);
          return;
        }
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        this.handleMessage(data);
      });

      this.ws.onClose((err, value) => {
        if (err) {
          console.error('WebSocket onClose error:', err);
        }
        console.info('WebSocket disconnected');
        this.notifyConnectionChange(false);
        if (!this.isManualClose) {
          this.tryReconnect();
        }
      });

      this.ws.onError((err) => {
        console.error('WebSocket error:', err);
        this.notifyConnectionChange(false);
      });

      // Connect
      this.ws.connect(wsUrl);
    } catch (e) {
      console.error('Socket connect error:', e);
      this.notifyConnectionChange(false);
    }
  }

  private handleMessage(data: string): void {
    // Socket.IO v4 message format:
    // - "0" = open
    // - "40" = connect
    // - "42" = event
    // - "43" = ack

    if (!data || data.length < 2) return;

    // Ping-Pong handling
    if (data === '2') {
      this.sendRaw('3'); // Pong
      return;
    }

    // Socket.IO message type
    const type = data.charAt(0);
    const payload = data.substring(1);

    switch (type) {
      case '0': // Open
        console.info('Socket.IO opened');
        break;

      case '2': // Ping
        this.sendRaw('3'); // Pong
        break;

      case '4': // Socket.IO message
        this.handleSocketIOMessage(payload);
        break;

      default:
        console.info('Unknown Socket.IO message type:', type);
    }
  }

  private handleSocketIOMessage(payload: string): void {
    // "42" prefix indicates an event
    if (payload.startsWith('2[') || payload.startsWith('42')) {
      try {
        // Extract JSON array from message
        const jsonStart = payload.indexOf('[');
        if (jsonStart === -1) return;

        const jsonStr = payload.substring(jsonStart);
        const messages = JSON.parse(jsonStr);

        if (Array.isArray(messages) && messages.length >= 2) {
          const eventName = messages[0];
          const eventData = messages[1];

          this.processEvent(eventName, eventData);
        }
      } catch (e) {
        console.error('Parse Socket.IO message error:', e, payload);
      }
    }
  }

  private processEvent(eventName: string, data: any): void {
    switch (eventName) {
      case 'match_update':
        if (this.matchUpdateCallback && data) {
          this.matchUpdateCallback(data as Match);
        }
        break;

      case 'event_reported':
        if (this.eventCallback && data) {
          this.eventCallback(data as MatchEvent);
        }
        break;

      case 'connect':
        console.info('Socket.IO connected to namespace');
        break;

      case 'disconnect':
        console.info('Socket.IO disconnected');
        break;

      default:
        console.info('Unknown event:', eventName, data);
    }
  }

  private sendSocketIOMessage(message: string): void {
    if (this.ws) {
      this.ws.send(message);
    }
  }

  private sendRaw(message: string): void {
    if (this.ws) {
      this.ws.send(message);
    }
  }

  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.info(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect(this.serverUrl, this.matchId);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  emitEvent(event: MatchEvent): void {
    const message = `42${JSON.stringify(['report_event', event])}`;
    this.sendSocketIOMessage(message);
  }

  emitScoreUpdate(matchId: string, homeScore: number, awayScore: number): void {
    const message = `42${JSON.stringify(['score_update', { matchId, homeScore, awayScore }])}`;
    this.sendSocketIOMessage(message);
  }

  emitStatusUpdate(matchId: string, status: string): void {
    const message = `42${JSON.stringify(['status_update', { matchId, status }])}`;
    this.sendSocketIOMessage(message);
  }

  onMatchUpdate(callback: (match: Match) => void): void {
    this.matchUpdateCallback = callback;
  }

  onEvent(callback: (event: MatchEvent) => void): void {
    this.eventCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallback = callback;
  }

  private notifyConnectionChange(connected: boolean): void {
    if (this.connectionCallback) {
      this.connectionCallback(connected);
    }
  }

  isConnected(): boolean {
    return this.ws !== null;
  }
}

// 单例导出
export const socketService = new SocketService();