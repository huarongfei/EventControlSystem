// RefereeViewModel.ets - 裁判视图模型
import { MatchInfo, TeamInfo, MatchEvent, EventType, ConnectionState, MatchStatus, ReportEventRequest, matchEventToReportRequest, FoulType } from '../model/MatchModels';
import { apiService } from '../service/ApiService';
import { socketService, ScoreUpdateData, TimerData } from '../service/SocketService';
import { storageService } from '../service/StorageService';
import { offlineQueue } from '../service/OfflineQueue';

/** 视图模型状态接口 */
export interface ViewModelState {
  matchInfo: MatchInfo | null;
  connectionState: ConnectionState;
  serverUrl: string;
  matchId: string;
  errorMessage: string;
  isLoading: boolean;
  eventLog: MatchEvent[];
  displayTime: string;
  timerStatus: string;
  foulTypes: FoulType[];           // 可用的犯规类型列表
  selectedFoulType: FoulType | null;  // 选中的犯规类型
  isLoadingFoulTypes: boolean;     // 是否正在加载犯规类型
}

/** 状态变更监听器 */
export type StateChangeListener = (state: ViewModelState) => void;

export class RefereeViewModel {
  // 数据状态 - 使用私有字段存储
  private _matchInfo: MatchInfo | null = null;
  private _connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private _serverUrl: string = '';
  private _matchId: string = '';
  private _errorMessage: string = '';
  private _isLoading: boolean = false;
  private _eventLog: MatchEvent[] = [];
  private _displayTime: string = '10:00';
  private _timerStatus: string = 'stopped';
  // 犯规类型相关
  private _foulTypes: FoulType[] = [];
  private _selectedFoulType: FoulType | null = null;
  private _isLoadingFoulTypes: boolean = false;

  // 监听器列表
  private listeners: StateChangeListener[] = [];

  // 当前设备信息
  isLargeScreen: boolean = false;
  currentBreakpoint: string = 'md';

  constructor() {
    this.loadSavedConfig();
  }

  // Getter 方法
  get matchInfo(): MatchInfo | null { return this._matchInfo; }
  get connectionState(): ConnectionState { return this._connectionState; }
  get serverUrl(): string { return this._serverUrl; }
  get matchId(): string { return this._matchId; }
  get errorMessage(): string { return this._errorMessage; }
  get isLoading(): boolean { return this._isLoading; }
  get eventLog(): MatchEvent[] { return this._eventLog; }
  get displayTime(): string { return this._displayTime; }
  get timerStatus(): string { return this._timerStatus; }
  get foulTypes(): FoulType[] { return this._foulTypes; }
  get selectedFoulType(): FoulType | null { return this._selectedFoulType; }
  get isLoadingFoulTypes(): boolean { return this._isLoadingFoulTypes; }

  /** 获取完整状态 */
  getState(): ViewModelState {
    return {
      matchInfo: this._matchInfo,
      connectionState: this._connectionState,
      serverUrl: this._serverUrl,
      matchId: this._matchId,
      errorMessage: this._errorMessage,
      isLoading: this._isLoading,
      eventLog: this._eventLog,
      displayTime: this._displayTime,
      timerStatus: this._timerStatus,
      foulTypes: this._foulTypes,
      selectedFoulType: this._selectedFoulType,
      isLoadingFoulTypes: this._isLoadingFoulTypes
    };
  }

  /** 添加状态变更监听器 */
  addListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /** 移除状态变更监听器 */
  removeListener(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /** 通知所有监听器 */
  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // Setter 方法（私有）
  private setMatchInfo(value: MatchInfo | null): void {
    this._matchInfo = value;
    this.notifyListeners();
  }

  private setConnectionState(value: ConnectionState): void {
    this._connectionState = value;
    this.notifyListeners();
  }

  private setErrorMessage(value: string): void {
    this._errorMessage = value;
    this.notifyListeners();
  }

  private setIsLoading(value: boolean): void {
    this._isLoading = value;
    this.notifyListeners();
  }

  private setDisplayTime(value: string): void {
    this._displayTime = value;
    this.notifyListeners();
  }

  private setTimerStatus(value: string): void {
    this._timerStatus = value;
    this.notifyListeners();
  }

  private setFoulTypes(value: FoulType[]): void {
    this._foulTypes = value;
    this.notifyListeners();
  }

  private setSelectedFoulType(value: FoulType | null): void {
    this._selectedFoulType = value;
    this.notifyListeners();
  }

  private setIsLoadingFoulTypes(value: boolean): void {
    this._isLoadingFoulTypes = value;
    this.notifyListeners();
  }

  /** 加载指定运动类型的犯规类型 */
  async loadFoulTypes(sportType: string): Promise<void> {
    this.setIsLoadingFoulTypes(true);
    try {
      const result = await apiService.getFoulTypes(sportType);
      if (result.ok && result.data) {
        this.setFoulTypes(result.data);
      }
    } catch (err) {
      console.error('加载犯规类型失败:', err);
    } finally {
      this.setIsLoadingFoulTypes(false);
    }
  }

  /** 选择犯规类型 */
  selectFoulType(foulType: FoulType): void {
    this.setSelectedFoulType(foulType);
  }

  /** 清除犯规类型选择 */
  clearFoulTypeSelection(): void {
    this._selectedFoulType = null;
    this.notifyListeners();
  }

  /** 获取犯规严重程度颜色 */
  getFoulSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'minor': return '#4CAF50';    // Green
      case 'common': return '#FF9800';   // Orange
      case 'severe': return '#FF5722';   // Deep Orange
      case 'dangerous': return '#F44336'; // Red
      default: return '#9E9E9E';          // Grey
    }
  }

  /** 获取犯规严重程度文本 */
  getFoulSeverityText(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'minor': return '轻微';
      case 'common': return '普通';
      case 'severe': return '严重';
      case 'dangerous': return '危险';
      default: return severity;
    }
  }

  /** 加载保存的配置 */
  async loadSavedConfig(): Promise<void> {
    const savedUrl = await storageService.getServerUrl();
    const savedMatchId = await storageService.getMatchId();
    if (savedUrl) this._serverUrl = savedUrl;
    if (savedMatchId) this._matchId = savedMatchId;
  }

  /** 连接服务器 */
  async connect(url: string, matchId: string): Promise<boolean> {
    if (!url || !matchId) {
      this.setErrorMessage('请输入服务器地址和比赛ID');
      return false;
    }

    this.setIsLoading(true);
    this.setErrorMessage('');
    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      // 设置 API 服务地址
      apiService.setBaseUrl(url);

      // 测试连接
      const connected = await apiService.testConnection();
      if (!connected) {
        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.setErrorMessage('无法连接到服务器');
        this.setIsLoading(false);
        return false;
      }

      // 获取比赛详情
      const response = await apiService.getMatchDetail(matchId);
      if (!response.ok || !response.data) {
        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.setErrorMessage(response.error || '获取比赛信息失败');
        this.setIsLoading(false);
        return false;
      }

      // 保存配置
      await storageService.saveServerUrl(url);
      await storageService.saveMatchId(matchId);
      this._serverUrl = url;
      this._matchId = matchId;

      // 保存比赛数据
      const matchData = response.data;
      matchData.homeTeam.score = response.data.homeTeam?.score || 0;
      matchData.awayTeam.score = response.data.awayTeam?.score || 0;
      this.setMatchInfo(matchData);

      // 加载犯规类型
      const sportType = response.data.sportType || 'basketball';
      await this.loadFoulTypes(sportType);

      // 连接 WebSocket
      this.setConnectionState(ConnectionState.SYNCING);
      const self = this;
      socketService.connect(matchId, {
        onConnect: () => {
          self.setConnectionState(ConnectionState.CONNECTED);
          // 连接成功后同步离线事件
          self.syncOfflineEvents();
        },
        onDisconnect: () => {
          self.setConnectionState(ConnectionState.DISCONNECTED);
        },
        onScoreUpdate: (data: ScoreUpdateData) => {
          self.handleScoreUpdate(data);
        },
        onMatchUpdate: (data: MatchInfo) => {
          self.handleMatchUpdate(data);
        },
        onTimerTick: (data: TimerData) => {
          self.handleTimerTick(data);
        },
        onError: (err: Error) => {
          self.setErrorMessage(err.message);
        }
      });

      this.setIsLoading(false);
      return true;
    } catch (err) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.setErrorMessage('连接失败');
      this.setIsLoading(false);
      return false;
    }
  }

  /** 断开连接 */
  disconnect(): void {
    socketService.disconnect();
    apiService.destroy();
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.setMatchInfo(null);
    this.setFoulTypes([]);
    this.clearFoulTypeSelection();
  }

  /** 处理比分更新 */
  private handleScoreUpdate(data: ScoreUpdateData): void {
    if (this._matchInfo) {
      if (data.homeScore !== undefined) {
        this._matchInfo.homeTeam.score = data.homeScore;
        this.notifyListeners();
      }
      if (data.awayScore !== undefined) {
        this._matchInfo.awayTeam.score = data.awayScore;
        this.notifyListeners();
      }
    }
  }

  /** 处理比赛数据更新 */
  private handleMatchUpdate(data: MatchInfo): void {
    if (this._matchInfo && data) {
      this.setMatchInfo(data);
    }
  }

  /** 处理计时器更新 */
  private handleTimerTick(data: TimerData): void {
    this.setDisplayTime(this.formatTime(data.remainingTime));
    this.setTimerStatus(data.status);
  }

  /** 主队加分 */
  async homeScore(points: number): Promise<void> {
    if (!this._matchInfo) return;
    await this.reportScore(this._matchInfo.homeTeam.id, points, 1);
  }

  /** 客队加分 */
  async awayScore(points: number): Promise<void> {
    if (!this._matchInfo) return;
    await this.reportScore(this._matchInfo.awayTeam.id, points, 1);
  }

  /** 上报得分 */
  private async reportScore(teamId: string, points: number, playerNum?: number): Promise<void> {
    if (!this._matchInfo) return;

    const event: MatchEvent = {
      type: EventType.SCORE,
      teamId: teamId,
      playerId: playerNum?.toString(),
      quarter: this._matchInfo.currentQuarter,
      time: 0, // 由服务器决定
      timestamp: Date.now(),
      synced: false,
      data: { points: points }
    };

    this.addEvent(event);

    if (this._connectionState === ConnectionState.CONNECTED) {
      const response = await apiService.reportEvent(this._matchInfo.id, matchEventToReportRequest(event));
      if (response.success) {
        event.synced = true;
        // 更新本地比分
        if (teamId === this._matchInfo.homeTeam.id) {
          this._matchInfo.homeTeam.score += points;
        } else {
          this._matchInfo.awayTeam.score += points;
        }
        this.notifyListeners();
      }
    } else {
      // 离线模式，添加到队列
      await offlineQueue.addEvent(event);
    }
  }

  /** 上报犯规（带犯规类型） */
  async reportFoul(teamId?: string, playerId?: string, foulType?: FoulType): Promise<void> {
    if (!this._matchInfo) return;

    // 如果传入了犯规类型，使用它；否则使用选中的犯规类型
    const selectedFoulType = foulType || this._selectedFoulType;

    const event: MatchEvent = {
      type: EventType.FOUL,
      teamId: teamId || this._matchInfo.homeTeam.id,
      playerId: playerId,
      quarter: this._matchInfo.currentQuarter,
      time: 0,
      timestamp: Date.now(),
      synced: false,
      data: selectedFoulType ? {
        foulType: selectedFoulType.code,
        foulName: selectedFoulType.name,
        severity: selectedFoulType.severity,
        penalty: selectedFoulType.penalty.description
      } : undefined
    };

    this.addEvent(event);

    // 同步到服务器
    if (this._connectionState === ConnectionState.CONNECTED) {
      await apiService.reportEvent(this._matchInfo.id, matchEventToReportRequest(event));
      event.synced = true;
    }

    // 清除犯规类型选择
    this.clearFoulTypeSelection();
  }

  /** 上报犯规（无犯规类型，兼容旧代码） */
  async reportFoulSimple(teamId?: string, playerId?: string): Promise<void> {
    if (!this._matchInfo) return;

    const event: MatchEvent = {
      type: EventType.FOUL,
      teamId: teamId || this._matchInfo.homeTeam.id,
      playerId: playerId,
      quarter: this._matchInfo.currentQuarter,
      time: 0,
      timestamp: Date.now(),
      synced: false
    };

    this.addEvent(event);

    // 同步到服务器
    if (this._connectionState === ConnectionState.CONNECTED) {
      await apiService.reportEvent(this._matchInfo.id, matchEventToReportRequest(event));
      event.synced = true;
    }
  }

  /** 请求暂停 */
  async requestTimeout(teamId?: string): Promise<void> {
    if (!this._matchInfo) return;

    const event: MatchEvent = {
      type: EventType.TIMEOUT,
      teamId: teamId || this._matchInfo.homeTeam.id,
      quarter: this._matchInfo.currentQuarter,
      time: 0,
      timestamp: Date.now(),
      synced: false
    };

    this.addEvent(event);

    if (this._connectionState === ConnectionState.CONNECTED) {
      await apiService.reportEvent(this._matchInfo.id, matchEventToReportRequest(event));
      event.synced = true;
    }
  }

  /** 上报伤病 */
  async reportInjury(teamId: string, playerId: string): Promise<void> {
    if (!this._matchInfo) return;

    const event: MatchEvent = {
      type: EventType.INJURY,
      teamId: teamId,
      playerId: playerId,
      quarter: this._matchInfo.currentQuarter,
      time: 0,
      timestamp: Date.now(),
      synced: false
    };

    this.addEvent(event);

    if (this._connectionState === ConnectionState.CONNECTED) {
      await apiService.reportEvent(this._matchInfo.id, matchEventToReportRequest(event));
      event.synced = true;
    }
  }

  /** 添加事件到日志 */
  private addEvent(event: MatchEvent): void {
    this._eventLog.unshift(event);
    // 只保留最近 50 条
    if (this._eventLog.length > 50) {
      this._eventLog.pop();
    }
    this.notifyListeners();
  }

  /** 格式化为分钟:秒 */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /** 获取当前连接状态文本 */
  getConnectionStatusText(): string {
    switch (this.connectionState) {
      case ConnectionState.DISCONNECTED:
        return '未连接';
      case ConnectionState.CONNECTING:
        return '连接中...';
      case ConnectionState.CONNECTED:
        return '已连接';
      case ConnectionState.SYNCING:
        return '同步中...';
      default:
        return '未知';
    }
  }

  /** 离线重连后同步事件 */
  async syncOfflineEvents(): Promise<void> {
    const pendingEvents = offlineQueue.getPendingEvents();
    if (pendingEvents.length === 0) return;

    this.setConnectionState(ConnectionState.SYNCING);

    try {
      for (const event of pendingEvents) {
        const response = await apiService.reportEvent(this._matchId, matchEventToReportRequest(event));
        if (response.success) {
          offlineQueue.markSynced(event.id || '');
          event.synced = true;
        }
      }
      this.setConnectionState(ConnectionState.CONNECTED);
    } catch (err) {
      this.setConnectionState(ConnectionState.CONNECTED);
      console.error('同步离线事件失败:', err);
    }
  }

  /** 设置在线状态并触发同步 */
  setOnline(online: boolean): void {
    offlineQueue.setOnline(online);
    if (online && this._connectionState === ConnectionState.CONNECTED) {
      this.syncOfflineEvents();
    }
  }

  /** 撤销最近事件 */
  async undoLastEvent(): Promise<boolean> {
    if (this._eventLog.length === 0) return false;

    const lastEvent = this._eventLog[0];

    // 如果是得分事件，需要回退比分
    if (lastEvent.type === EventType.SCORE && lastEvent.data && this._matchInfo) {
      const points = lastEvent.data['points'] as number;
      if (lastEvent.teamId === this._matchInfo.homeTeam.id) {
        this._matchInfo.homeTeam.score = Math.max(0, this._matchInfo.homeTeam.score - points);
      } else {
        this._matchInfo.awayTeam.score = Math.max(0, this._matchInfo.awayTeam.score - points);
      }
    }

    // 从日志中移除
    this._eventLog.shift();
    this.notifyListeners();

    // 发送撤销请求到服务器
    if (this._connectionState === ConnectionState.CONNECTED) {
      try {
        await apiService.post(`/api/matches/${this._matchId}/events/undo`, { eventId: lastEvent.id });
      } catch (err) {
        console.error('撤销事件失败:', err);
      }
    }

    return true;
  }

  /** 结束比赛 */
  async finishMatch(): Promise<boolean> {
    if (!this._matchInfo) return false;

    try {
      const response = await apiService.post(`/api/matches/${this._matchId}/status`, {
        status: MatchStatus.FINISHED
      });

      if (response.success && this._matchInfo) {
        this._matchInfo.status = MatchStatus.FINISHED;
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (err) {
      console.error('结束比赛失败:', err);
      return false;
    }
  }

  /** 获取比赛统计数据 */
  getMatchStatistics(): Record<string, number> {
    if (!this._matchInfo) return {};

    const stats: Record<string, number> = {
      homeScore: this._matchInfo.homeTeam.score,
      awayScore: this._matchInfo.awayTeam.score,
      homeFouls: this._matchInfo.homeTeam.fouls,
      awayFouls: this._matchInfo.awayTeam.fouls,
      homeTimeouts: this._matchInfo.homeTeam.timeouts,
      awayTimeouts: this._matchInfo.awayTeam.timeouts,
      currentQuarter: this._matchInfo.currentQuarter
    };

    return stats;
  }
}