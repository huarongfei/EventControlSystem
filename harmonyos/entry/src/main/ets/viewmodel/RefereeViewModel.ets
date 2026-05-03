// RefereeViewModel - 裁判端业务逻辑（类似 Android ViewModel）
import { Match, MatchEvent, EventType, getSportRule, SportRule } from '../model/MatchModels';
import { apiService } from '../service/ApiService';
import { socketService } from '../service/SocketService';
import { StorageManager } from '../service/StorageManager';
import { OfflineQueue } from '../service/OfflineQueue';

export class RefereeViewModel {
  // UI State
  isLoading: boolean = false;
  isConnected: boolean = false;
  isOfflineMode: boolean = false;
  currentMatch: Match | null = null;
  matchList: Match[] = [];
  matchEvents: MatchEvent[] = [];
  offlineEvents: MatchEvent[] = [];
  pendingSyncCount: number = 0;
  error: string = '';
  sportRule: SportRule | null = null;

  private storageManager: StorageManager | null = null;
  private offlineQueue: OfflineQueue | null = null;
  private callbacks: Map<string, Function> = new Map();

  constructor(context: any) {
    this.storageManager = new StorageManager(context);
    this.offlineQueue = new OfflineQueue(context);
    this.init();
  }

  private async init(): Promise<void> {
    // Load offline events
    const queue = await this.offlineQueue?.getQueue() || [];
    this.offlineEvents = queue;
    this.pendingSyncCount = queue.length;
  }

  // Callbacks for UI updates
  onMatchUpdate(callback: (match: Match | null) => void): void {
    this.callbacks.set('matchUpdate', callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.callbacks.set('connectionChange', callback);
  }

  onEventsChange(callback: (events: MatchEvent[]) => void): void {
    this.callbacks.set('eventsChange', callback);
  }

  private notifyMatchUpdate(): void {
    const cb = this.callbacks.get('matchUpdate');
    if (cb) cb(this.currentMatch);
  }

  private notifyConnectionChange(): void {
    const cb = this.callbacks.get('connectionChange');
    if (cb) cb(this.isConnected);
  }

  private notifyEventsChange(): void {
    const cb = this.callbacks.get('eventsChange');
    if (cb) cb(this.matchEvents);
  }

  async connectToMatch(matchId: string, serverUrl: string): Promise<void> {
    this.isLoading = true;
    this.error = '';

    try {
      // Initialize API service
      apiService.setBaseUrl(serverUrl);
      await this.storageManager?.saveServerUrl(serverUrl);
      await this.storageManager?.saveMatchId(matchId);

      // Get match details
      const match = await apiService.getMatch(matchId);
      if (!match) {
        this.isLoading = false;
        this.error = '比赛数据不完整，无法连接';
        return;
      }

      this.currentMatch = match;
      this.sportRule = getSportRule(match.sportType);

      // Connect to WebSocket
      socketService.connect(serverUrl, matchId);
      socketService.onMatchUpdate((updatedMatch: Match) => {
        this.currentMatch = updatedMatch;
        this.notifyMatchUpdate();
      });
      socketService.onConnectionChange((connected: boolean) => {
        this.isConnected = connected;
        this.notifyConnectionChange();
      });

      this.isLoading = false;
      this.error = '';
    } catch (e) {
      this.isLoading = false;
      this.error = e instanceof Error ? e.message : '连接失败';
    }
  }

  disconnect(): void {
    socketService.disconnect();
    this.storageManager?.clearMatchData();
    this.isConnected = false;
    this.currentMatch = null;
    this.matchEvents = [];
  }

  // Event reporting methods
  reportScore(teamId: string, points: number, playerId?: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.SCORE,
      teamId,
      playerId,
      { points }
    );
    this.processEvent(event);
  }

  reportFoul(teamId: string, foulType: string, playerId?: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.FOUL,
      teamId,
      playerId,
      { foulType }
    );
    this.processEvent(event);
  }

  reportSubstitution(teamId: string, playerIn?: string, playerOut?: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.SUBSTITUTION,
      teamId,
      playerIn,
      { playerIn: playerIn || '', playerOut: playerOut || '' }
    );
    this.processEvent(event);
  }

  reportTimeout(teamId: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.TIMEOUT,
      teamId
    );
    this.processEvent(event);
  }

  reportInjury(teamId: string, playerId?: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.INJURY,
      teamId,
      playerId
    );
    this.processEvent(event);
  }

  reportCard(teamId: string, cardType: string): void {
    if (!this.currentMatch) return;
    const eventType = cardType === 'yellow_card' ? EventType.YELLOW_CARD : EventType.RED_CARD;
    const event: MatchEvent = this.createEvent(
      eventType,
      teamId,
      undefined,
      { cardType }
    );
    this.processEvent(event);
  }

  reportCornerKick(teamId: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.CORNER_KICK,
      teamId
    );
    this.processEvent(event);
  }

  reportOffside(teamId: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.OFFSIDE,
      teamId
    );
    this.processEvent(event);
  }

  reportSideChange(): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.SIDE_CHANGE,
      ''
    );
    this.processEvent(event);
  }

  reportDQ(teamId: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.DQ,
      teamId
    );
    this.processEvent(event);
  }

  reportWithdraw(teamId: string): void {
    if (!this.currentMatch) return;
    const event: MatchEvent = this.createEvent(
      EventType.WITHDRAW,
      teamId
    );
    this.processEvent(event);
  }

  private createEvent(
    type: EventType,
    teamId: string,
    playerId?: string,
    detail?: Record<string, Object>
  ): MatchEvent {
    return {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      matchId: this.currentMatch?.id || '',
      type,
      period: this.currentMatch?.currentPeriod || 1,
      teamId,
      playerId,
      detail,
      reportedBy: this.storageManager?.getDeviceId() || 'unknown',
      timestamp: Date.now(),
      isSynced: false
    };
  }

  private processEvent(event: MatchEvent): void {
    // Emit via socket
    socketService.emitEvent(event);

    // Add to local events list
    this.matchEvents = [...this.matchEvents, event];
    this.notifyEventsChange();

    // Try to sync
    this.syncEvent(event);
  }

  private async syncEvent(event: MatchEvent): Promise<void> {
    try {
      const success = await apiService.reportEvent(event);
      if (!success) {
        this.isOfflineMode = true;
        await this.offlineQueue?.addEvent(event);
        const queue = await this.offlineQueue.getQueue();
        this.pendingSyncCount = queue.length;
      }
    } catch (e) {
      this.isOfflineMode = true;
      await this.offlineQueue?.addEvent(event);
      const queue = await this.offlineQueue.getQueue();
      this.pendingSyncCount = queue.length;
    }
  }

  async syncOfflineEvents(): Promise<void> {
    const queue = await this.offlineQueue?.getQueue() || [];
    for (const event of queue) {
      try {
        await apiService.reportEvent(event);
      } catch (e) {
        console.error('Sync event failed:', e);
      }
    }
    await this.offlineQueue?.clear();
    this.offlineEvents = [];
    this.pendingSyncCount = 0;
    this.isOfflineMode = false;
  }

  async loadMatches(eventId?: string): Promise<void> {
    this.isLoading = true;
    try {
      const matches = await apiService.getMatches(eventId);
      this.matchList = matches;
    } catch (e) {
      this.error = e instanceof Error ? e.message : '加载比赛列表失败';
    } finally {
      this.isLoading = false;
    }
  }

  clearError(): void {
    this.error = '';
  }
}

// 单例导出
let viewModelInstance: RefereeViewModel | null = null;

export function getViewModel(context: any): RefereeViewModel {
  if (!viewModelInstance) {
    viewModelInstance = new RefereeViewModel(context);
  }
  return viewModelInstance;
}
