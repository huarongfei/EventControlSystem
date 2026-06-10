// MainPage.ets - 裁判主控页面
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { Breakpoint, ResponsiveLayout } from '../utils/DeviceInfo';
import { PlayerInfo, MatchEvent, EventType, ConnectionState, FoulType } from '../model/MatchModels';
import { apiService, MatchDetail } from '../service/ApiService';
import { socketService, ScoreUpdateData, TimerData as SocketTimerData } from '../service/SocketService';

@Entry
@Component
struct MainPage {
  // 路由参数
  @State serverUrl: string = '';
  @State matchCode: string = '';   // matchId
  // 从路由传入的基础信息（备用，若 API 拉取失败时展示）
  @State homeTeamName: string = '';
  @State awayTeamName: string = '';
  @State homeTeamId: string = '';
  @State awayTeamId: string = '';
  @State eventName: string = '';
  @State sportEmoji: string = '';
  
  // 比赛数据（从 detail API 获取）
  @State detail: MatchDetail | null = null;
  // 运行时比分（由 score:update 实时更新）
  @State homeScore: number = 0;
  @State awayScore: number = 0;
  @State connectionState: ConnectionState = ConnectionState.CONNECTING;
  @State eventLog: MatchEvent[] = [];

  // 计时器数据
  @State timerData: SocketTimerData = { matchId: '', remainingTime: 600, period: 1, status: 'stopped', isCountdown: true };
  @State displayTime: string = '10:00';
  
  // UI状态
  @State currentBreakpoint: string = 'MD';
  @State isLoading: boolean = true;
  @State selectedTab: number = 0;
  @State errorMessage: string = '';
  
  // 设备信息
  @State screenWidth: number = 360;
  
  // 弹窗状态
  @State showPlayerDialog: boolean = false;
  @State dialogTeamId: string = '';
  @State dialogTeamName: string = '';
  @State dialogPlayers: PlayerInfo[] = [];
  @State dialogEventType: EventType = EventType.FOUL;
  
  // 犯规类型相关状态
  @State foulTypes: FoulType[] = [];
  @State showFoulTypeDialog: boolean = false;
  @State selectedFoulType: FoulType | null = null;
  @State foulTeamIsHome: boolean = false;
  
  // 手势确认状态
  @State longPressProgress: number = 0;
  @State isLongPressing: boolean = false;
  @State pendingAction: (() => void) | null = null;
  
  // 离线提示
  @State showOfflineBanner: boolean = false;

  // 总节次数（从 detail 动态读取）
  @State totalPeriods: number = 4;

  // 生成节次数组（兼容 ArkTS）
  private getQuarterArray(): number[] {
    const arr: number[] = [];
    const total = this.totalPeriods ?? 4;
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  }

  // 私有变量
  private longPressTimer: number = -1;
  private readonly LONG_PRESS_DURATION: number = 800; // 长按确认时间(ms)

  aboutToAppear(): void {
    // 获取路由参数
    const params = router.getParams() as Record<string, string>;
    if (params) {
      this.serverUrl = params['serverUrl'] ?? '';
      this.matchCode = params['matchId'] ?? '';
      this.homeTeamName = params['homeTeamName'] ?? '主队';
      this.awayTeamName = params['awayTeamName'] ?? '客队';
      this.homeTeamId   = params['homeTeamId'] ?? '';
      this.awayTeamId   = params['awayTeamId'] ?? '';
      this.eventName    = params['eventName'] ?? '';
      this.sportEmoji   = params['sportEmoji'] ?? '';
    }

    this.loadMatchData();
    this.observeBreakpoint();
  }

  private observeBreakpoint(): void {
    ResponsiveLayout.addBreakpointListener((bp: Breakpoint) => {
      this.currentBreakpoint = ResponsiveLayout.getBreakpointName();
    });
  }

  async loadMatchData(): Promise<void> {
    this.isLoading = true;
    this.connectionState = ConnectionState.CONNECTING;

    try {
      apiService.setBaseUrl(this.serverUrl);

      // 获取比赛详情
      const result = await apiService.getMatchDetail(this.matchCode);

      if (result.ok && result.data) {
        this.detail = result.data;
        this.homeScore = result.data.homeStats.score;
        this.awayScore = result.data.awayStats.score;
        this.connectionState = ConnectionState.CONNECTED;
        // 异步加载犯规类型，不阻塞主流程
        this.loadFoulTypes(result.data.sportType);
        // 读取总节次数
        this.totalPeriods = result.data.totalPeriods ?? 4;
        this.connectSocket();
      } else {
        this.errorMessage = result.error || '获取比赛信息失败';
        this.connectionState = ConnectionState.DISCONNECTED;
      }
    } catch (err) {
      this.errorMessage = '加载失败: ' + String(err);
      this.connectionState = ConnectionState.DISCONNECTED;
    } finally {
      this.isLoading = false;
    }
  }

  private connectSocket(): void {
    socketService.setBaseUrl(this.serverUrl);
    socketService.connect(this.matchCode, {
      onConnect: () => {
        this.connectionState = ConnectionState.CONNECTED;
        this.showOfflineBanner = false;
      },
      onDisconnect: () => {
        this.connectionState = ConnectionState.DISCONNECTED;
        this.showOfflineBanner = true;
      },
      onScoreUpdate: (data: ScoreUpdateData) => {
        this.homeScore = data.homeScore;
        this.awayScore = data.awayScore;
        if (data.period) {
          this.timerData = {
            matchId: data.matchId,
            remainingTime: this.timerData.remainingTime,
            period: data.period,
            status: this.timerData.status,
            isCountdown: this.timerData.isCountdown,
          };
        }
      },
      onTimerTick: (data: SocketTimerData) => {
        this.timerData = data;
        this.displayTime = this.formatTime(data.remainingTime);
      },
      onMatchEvent: (_data: object) => {
        // 暂不处理事件推送
      },
      onError: (msg: string) => {
        this.errorMessage = msg;
      }
    });
  }

  /** 加载犯规类型 */
  private async loadFoulTypes(sportType: string): Promise<void> {
    try {
      const result = await apiService.getFoulTypes(sportType);
      if (result.ok && result.data) {
        this.foulTypes = result.data;
      } else {
        console.error('获取犯规类型失败:', result.error);
      }
    } catch (err) {
      console.error('加载犯规类型异常:', err);
    }
  }

  /** 处理计时器滴答 */
  private handleTimerTick(data: SocketTimerData): void {
    this.timerData = data;
    this.displayTime = this.formatTime(data.remainingTime);
  }

  /** 格式化时间为 mm:ss */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private updateScore(data: ScoreUpdateData): void {
    this.homeScore = data.homeScore;
    this.awayScore = data.awayScore;
  }

  // 主队加分（带手势确认）
  homeAddScore(points: number): void {
    const action = (): void => {
      void this.executeHomeAddScore(points);
    };
    this.executeWithConfirm(action);
  }

  private async executeHomeAddScore(points: number): Promise<void> {
    if (!this.detail) return;

    const event: MatchEvent = {
      type: EventType.SCORE,
      teamId: this.detail.homeTeam.id,
      quarter: this.timerData.period,
      time: this.timerData.remainingTime,
      timestamp: Date.now(),
      synced: false,
      data: { 'points': points }
    };

    this.eventLog.unshift(event);
    this.homeScore += points;

    if (this.connectionState === ConnectionState.CONNECTED) {
      const result = await apiService.reportEvent(this.matchCode, {
        type: 'score', teamId: this.detail.homeTeam.id,
        period: this.timerData.period, detail: { points }
      });
      event.synced = result.ok;
    }

    promptAction.showToast({ message: `${this.detail.homeTeam.name} +${points}分` });
  }

  // 客队加分（带手势确认）
  awayAddScore(points: number): void {
    const action = (): void => {
      void this.executeAwayAddScore(points);
    };
    this.executeWithConfirm(action);
  }

  private async executeAwayAddScore(points: number): Promise<void> {
    if (!this.detail) return;

    const event: MatchEvent = {
      type: EventType.SCORE,
      teamId: this.detail.awayTeam.id,
      quarter: this.timerData.period,
      time: this.timerData.remainingTime,
      timestamp: Date.now(),
      synced: false,
      data: { 'points': points }
    };

    this.eventLog.unshift(event);
    this.awayScore += points;

    if (this.connectionState === ConnectionState.CONNECTED) {
      const result = await apiService.reportEvent(this.matchCode, {
        type: 'score', teamId: this.detail.awayTeam.id,
        period: this.timerData.period, detail: { points }
      });
      event.synced = result.ok;
    }

    promptAction.showToast({ message: `${this.detail.awayTeam.name} +${points}分` });
  }

  /** 执行带确认的操作 */
  private executeWithConfirm(action: () => void): void {
    this.pendingAction = action;
    this.isLongPressing = true;
    this.longPressProgress = 0;
    
    // 开始进度动画
    const startTime = Date.now();
    const updateProgress = (): void => {
      if (!this.isLongPressing) return;
      
      const elapsed = Date.now() - startTime;
      this.longPressProgress = Math.min(elapsed / this.LONG_PRESS_DURATION, 1);
      
      if (this.longPressProgress >= 1) {
        // 确认完成，执行操作
        this.pendingAction?.();
        this.resetLongPress();
      } else {
        this.longPressTimer = setTimeout(updateProgress, 16);
      }
    };
    
    updateProgress();
  }

  /** 取消长按 */
  cancelLongPress(): void {
    this.resetLongPress();
  }

  /** 重置长按状态 */
  private resetLongPress(): void {
    this.isLongPressing = false;
    this.longPressProgress = 0;
    this.pendingAction = null;
    if (this.longPressTimer !== -1) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = -1;
    }
  }

  // 显示犯规类型选择弹窗
  showFoulTypeDialog(isHome: boolean): void {
    this.foulTeamIsHome = isHome;
    this.selectedFoulType = null;
    this.showFoulTypeDialog = true;
  }

  // 显示球员选择弹窗（犯规）
  showFoulDialog(isHome: boolean): void {
    this.dialogTeamId = isHome ? (this.detail?.homeTeam?.id ?? '') : (this.detail?.awayTeam?.id ?? '');
    this.dialogTeamName = isHome ? (this.detail?.homeTeam?.name ?? '') : (this.detail?.awayTeam?.name ?? '');
    this.dialogPlayers = [];
    this.dialogEventType = EventType.FOUL;
    this.showPlayerDialog = true;
  }

  // 显示球员选择弹窗（换人）
  showSubDialog(isHome: boolean): void {
    this.dialogTeamId = isHome ? (this.detail?.homeTeam?.id ?? '') : (this.detail?.awayTeam?.id ?? '');
    this.dialogTeamName = isHome ? (this.detail?.homeTeam?.name ?? '') : (this.detail?.awayTeam?.name ?? '');
    this.dialogPlayers = [];
    this.dialogEventType = EventType.SUBSTITUTION;
    this.showPlayerDialog = true;
  }

  // 选择球员上报事件
  async onPlayerSelected(player: PlayerInfo): Promise<void> {
    const event: MatchEvent = {
      type: this.dialogEventType,
      teamId: this.dialogTeamId,
      playerId: player.id,
      quarter: this.timerData.period,
      time: this.timerData.remainingTime,
      timestamp: Date.now(),
      synced: false,
      data: this.dialogEventType === EventType.FOUL && this.selectedFoulType 
        ? { foulTypeId: this.selectedFoulType.id, foulTypeCode: this.selectedFoulType.code }
        : {}
    };

    this.eventLog.unshift(event);
    this.showPlayerDialog = false;

    if (this.connectionState === ConnectionState.CONNECTED) {
      const eventData: Record<string, Object> = {
        type: this.dialogEventType === EventType.FOUL ? 'foul' : 'substitution',
        teamId: this.dialogTeamId,
        playerId: player.id,
        period: this.timerData.period,
      };
      if (this.dialogEventType === EventType.FOUL && this.selectedFoulType) {
        eventData['foulTypeId'] = this.selectedFoulType.id;
        eventData['foulTypeCode'] = this.selectedFoulType.code;
      }
      const result = await apiService.reportEvent(this.matchCode, eventData);
      event.synced = result.ok;
    }

    const eventName = this.dialogEventType === EventType.FOUL 
      ? `犯规（${this.selectedFoulType?.name || '普通犯规'}）` 
      : '换人';
    promptAction.showToast({ message: `${player.name} ${eventName} 已记录` });
    this.selectedFoulType = null;
  }

  // 请求暂停
  async requestTimeout(isHome: boolean): Promise<void> {
    const teamId = isHome ? (this.detail?.homeTeam?.id ?? '') : (this.detail?.awayTeam?.id ?? '');
    if (!teamId) return;

    const event: MatchEvent = {
      type: EventType.TIMEOUT,
      teamId: teamId,
      quarter: this.timerData.period,
      time: this.timerData.remainingTime,
      timestamp: Date.now(),
      synced: false
    };

    this.eventLog.unshift(event);

    if (this.connectionState === ConnectionState.CONNECTED) {
      const result = await apiService.reportEvent(this.matchCode, {
        type: 'timeout', teamId, period: this.timerData.period
      });
      event.synced = result.ok;
    }

    promptAction.showToast({ message: '暂停请求已发送' });
  }

  // 撤销最近事件
  async undoLastEvent(): Promise<void> {
    if (this.eventLog.length === 0) {
      promptAction.showToast({ message: '没有可撤销的事件' });
      return;
    }

    const lastEvent = this.eventLog[0];

    // 如果是得分事件，需要回退比分
    if (lastEvent.type === EventType.SCORE && lastEvent.data) {
      const points = lastEvent.data['points'] as number;
      if (lastEvent.teamId === this.detail?.homeTeam?.id) {
        this.homeScore = Math.max(0, this.homeScore - points);
      } else {
        this.awayScore = Math.max(0, this.awayScore - points);
      }
    }

    this.eventLog.shift();
    promptAction.showToast({ message: '已撤销最近事件' });
  }

  // 切换节次
  async changeQuarter(quarter: number): Promise<void> {
    const total = this.detail?.totalPeriods ?? 4; // 从 detail 读取总节次
    if (quarter < 1 || quarter > total) return;

    this.timerData = {
      matchId: this.timerData.matchId,
      remainingTime: this.timerData.remainingTime,
      period: quarter,
      status: this.timerData.status,
      isCountdown: this.timerData.isCountdown,
    };

    promptAction.showToast({ message: `已切换到第 ${quarter} 节` });
  }

  build() {
    Stack() {
      if (this.isLoading) {
        this.LoadingView();
      } else if (this.errorMessage) {
        this.ErrorView();
      } else {
        this.MainContent();
      }

      // 犯规类型选择弹窗
      if (this.showFoulTypeDialog) {
        Column() {
          Column() {
            this.FoulTypeSelectDialog();
          }
          .width('90%')
          .maxHeight('80%')
          .backgroundColor('#FFFFFF')
          .borderRadius(16)
          .shadow({ radius: 20, color: 'rgba(0,0,0,0.2)' });
        }
        .width('100%')
        .height('100%')
        .backgroundColor('rgba(0,0,0,0.5)')
        .justifyContent(FlexAlign.Center)
        .onClick(() => {
          this.showFoulTypeDialog = false;
        });
      }

      // 球员选择弹窗
      if (this.showPlayerDialog) {
        Column() {
          Column() {
            this.PlayerSelectDialog();
          }
          .width('90%')
          .backgroundColor('#FFFFFF')
          .borderRadius(16)
          .shadow({ radius: 20, color: 'rgba(0,0,0,0.2)' });
        }
        .width('100%')
        .height('100%')
        .backgroundColor('rgba(0,0,0,0.5)')
        .justifyContent(FlexAlign.Center)
        .onClick(() => {
          // 点击背景关闭弹窗
          this.showPlayerDialog = false;
        });
      }
    }
    .width('100%')
    .height('100%');
  }

  @Builder
  LoadingView() {
    Column() {
      LoadingProgress().width(48).height(48);
      Text('加载中...').fontSize(16).margin({ top: 16 });
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center);
  }

  @Builder
  ErrorView() {
    Column() {
      Text('⚠️').fontSize(48);
      Text(this.errorMessage).fontSize(16).margin({ top: 16 });
      Button('返回').onClick(() => router.back()).margin({ top: 24 });
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center);
  }

  @Builder
  MainContent() {
    if (this.currentBreakpoint === 'LG' || this.currentBreakpoint === 'XL') {
      // 大屏：双栏布局
      Row() {
        this.MatchInfoPanel();
        Divider().width(1).height('100%').backgroundColor('#E0E0E0');
        this.OperationPanel();
      }
      .width('100%')
      .height('100%');
    } else {
      // 小屏：Tab 切换
      Column() {
        this.MatchInfoHeader();
        Tabs() {
          TabContent() { this.OperationPanel(); }.tabBar('操作');
          TabContent() { this.EventLogPanel(); }.tabBar('事件');
        }
        .barHeight(48);
      }
      .width('100%')
      .height('100%');
    }
  }

  @Builder
  MatchInfoPanel() {
    Column() {
      // 离线状态横幅
      if (this.showOfflineBanner) {
        Row() {
          Text('⚠️ 网络已断开，操作将在恢复后同步')
            .fontSize(14)
            .fontColor('#FFFFFF')
            .padding({ left: 16, right: 16, top: 8, bottom: 8 });
        }
        .width('100%')
        .backgroundColor('#FF9800')
        .justifyContent(FlexAlign.Center);
      }

      // 连接状态
      Row() {
        Circle().width(8).height(8).fill(this.connectionState === ConnectionState.CONNECTED ? '#4CAF50' : '#999999');
        Text(this.getConnectionStatusText()).fontSize(12).fontColor('#666666');
      }
      .margin({ bottom: 16 });

      // 计时器显示
      Column() {
        Text(this.displayTime)
          .fontSize(72)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.timerData.status === 'running' ? '#4CAF50' : '#666666');
        Text(`第 ${this.timerData.period} 节 · ${this.getTimerStatusText()}`)
          .fontSize(14)
          .fontColor('#999999')
          .margin({ top: 4 });
      }
      .margin({ bottom: 24 });

      // 比分显示
      Row() {
        Column() {
          Text(this.detail?.homeTeam?.name ?? this.homeTeamName).fontSize(18).fontWeight(FontWeight.Bold);
          Text(this.homeScore.toString())
            .fontSize(64)
            .fontWeight(FontWeight.Bold)
            .fontColor('#007AFF');
        }
        .width('45%');

        Column() {
          Text('VS').fontSize(24).fontColor('#999999');
        }
        .width('10%');

        Column() {
          Text(this.detail?.awayTeam?.name ?? this.awayTeamName).fontSize(18).fontWeight(FontWeight.Bold);
          Text(this.awayScore.toString())
            .fontSize(64)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FF6B00');
        }
        .width('45%');
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly);

      // 节次切换
      Row() {
        ForEach(this.getQuarterArray(), (quarter: number) => {
          Button(`Q${quarter}`)
            .width(56)
            .height(40)
            .fontSize(14)
            .fontWeight(FontWeight.Medium)
            .backgroundColor(this.detail?.currentPeriod === quarter ? '#007AFF' : '#F0F0F0')
            .fontColor(this.detail?.currentPeriod === quarter ? '#FFFFFF' : '#666666')
            .margin({ left: 4, right: 4 })
            .onClick(() => this.changeQuarter(quarter));
        });
      }
      .margin({ top: 24 });

      // 撤销按钮
      Button('撤销最近操作')
        .width(160)
        .height(40)
        .fontSize(14)
        .backgroundColor('#F5F5F5')
        .fontColor('#666666')
        .margin({ top: 16 })
        .enabled(this.eventLog.length > 0)
        .onClick(() => this.undoLastEvent());
    }
    .width('100%')
    .height('100%')
    .padding(32)
    .justifyContent(FlexAlign.Center);
  }

  @Builder
  MatchInfoHeader() {
    Column() {
      // 离线状态横幅
      if (this.showOfflineBanner) {
        Row() {
          Text('⚠️ 网络已断开')
            .fontSize(12)
            .fontColor('#FFFFFF')
            .padding({ left: 16, right: 16, top: 4, bottom: 4 });
        }
        .width('100%')
        .backgroundColor('#FF9800')
        .justifyContent(FlexAlign.Center);
      }

      Row() {
        Text(`${this.detail?.homeTeam?.name ?? this.homeTeamName} vs ${this.detail?.awayTeam?.name ?? this.awayTeamName}`)
          .fontSize(16)
          .fontWeight(FontWeight.Bold);
        Blank();
        Column() {
          Text(this.displayTime)
            .fontSize(14)
            .fontColor('#666666');
          Text(`${this.homeScore} : ${this.awayScore}`)
            .fontSize(24)
            .fontWeight(FontWeight.Bold);
        }
        .alignItems(HorizontalAlign.End);
      }
      .width('100%')
      .padding(16)
      .backgroundColor('#F5F5F5');
    }
    .width('100%');
  }

  @Builder
  OperationPanel() {
    Scroll() {
      Column() {
        // 主队操作
        this.TeamOperationPanel(true);

        Divider().margin({ top: 24, bottom: 24 });

        // 客队操作
        this.TeamOperationPanel(false);
      }
      .padding(24);
    }
  }

  @Builder
  TeamOperationPanel(isHome: boolean) {
    const teamName = isHome
      ? (this.detail?.homeTeam?.name ?? this.homeTeamName)
      : (this.detail?.awayTeam?.name ?? this.awayTeamName);

    Column() {
      Text(teamName)
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .fontColor(isHome ? '#007AFF' : '#FF6B00')
        .margin({ bottom: 16 });

      // 得分按钮组（带长按确认）
      Row() {
        this.ScoreButton('+1', isHome, () => isHome ? this.homeAddScore(1) : this.awayAddScore(1));
        this.ScoreButton('+2', isHome, () => isHome ? this.homeAddScore(2) : this.awayAddScore(2));
        this.ScoreButton('+3', isHome, () => isHome ? this.homeAddScore(3) : this.awayAddScore(3));
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)
      .margin({ bottom: 24 });

      // 操作按钮组
      Row() {
        Button('犯规')
          .layoutWeight(1)
          .height(48)
          .borderRadius(12)
          .backgroundColor('#FF9800')
          .onClick(() => this.showFoulTypeDialog(isHome));

        Button('暂停')
          .layoutWeight(1)
          .height(48)
          .borderRadius(12)
          .backgroundColor('#9C27B0')
          .margin({ left: 12 })
          .onClick(() => this.requestTimeout(isHome));

        Button('换人')
          .layoutWeight(1)
          .height(48)
          .borderRadius(12)
          .backgroundColor('#607D8B')
          .margin({ left: 12 })
          .onClick(() => this.showSubDialog(isHome));
      }
      .width('100%');
    }
    .width('100%');
  }

  @Builder
  ScoreButton(text: string, isHome: boolean, onConfirm: () => void) {
    Stack() {
      // 进度环
      if (this.isLongPressing && this.pendingAction === onConfirm) {
        Circle()
          .width(76)
          .height(76)
          .fill('transparent')
          .stroke('#FFFFFF')
          .strokeWidth(4)
          .strokeDashArray([this.longPressProgress * 238, 238])
          .strokeLineCap(LineCapStyle.Round);
      }

      Button(text)
        .width(72)
        .height(72)
        .borderRadius(36)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .backgroundColor(isHome ? '#007AFF' : '#FF6B00')
        .gesture(
          GestureGroup(GestureMode.Sequence,
            LongPressGesture({ duration: this.LONG_PRESS_DURATION })
              .onAction(() => this.executeWithConfirm(onConfirm))
              .onActionEnd(() => this.cancelLongPress())
          )
        );
    }
    .width(76)
    .height(76);
  }

  @Builder
  EventLogPanel() {
    List() {
      ForEach(this.eventLog, (event: MatchEvent, index: number) => {
        ListItem() {
          Row() {
            Text(this.getEventIcon(event.type))
              .fontSize(20)
              .margin({ right: 12 });
            
            Column() {
              Text(this.getEventText(event))
                .fontSize(14);
              Text(`第 ${event.quarter} 节`)
                .fontSize(12)
                .fontColor('#999999');
            }
            
            Blank();
            
            Circle().width(8).height(8).fill(event.synced ? '#4CAF50' : '#FF9800');
          }
          .width('100%')
          .padding(16);
        }
        .borderWidth({ bottom: 1 })
        .borderColor('#F0F0F0');
      });
    }
  }

  private getConnectionStatusText(): string {
    switch (this.connectionState) {
      case ConnectionState.CONNECTED: return '已连接';
      case ConnectionState.CONNECTING: return '连接中...';
      case ConnectionState.DISCONNECTED: return '未连接';
      case ConnectionState.SYNCING: return '同步中...';
      default: return '未知';
    }
  }

  private getEventIcon(type: EventType): string {
    switch (type) {
      case EventType.SCORE: return '🏀';
      case EventType.FOUL: return '🚫';
      case EventType.TIMEOUT: return '⏸️';
      case EventType.SUBSTITUTION: return '🔄';
      case EventType.INJURY: return '🏥';
      default: return '📋';
    }
  }

  private getEventText(event: MatchEvent): string {
    switch (event.type) {
      case EventType.SCORE: return '得分';
      case EventType.FOUL: return '犯规';
      case EventType.TIMEOUT: return '暂停';
      case EventType.SUBSTITUTION: return '换人';
      case EventType.INJURY: return '伤病';
      case EventType.QUARTER_CHANGE: return '节次切换';
      default: return '事件';
    }
  }

  private getTimerStatusText(): string {
    switch (this.timerData.status) {
      case 'running': return '进行中';
      case 'paused': return '已暂停';
      case 'stopped': return '已停止';
      default: return '未知';
    }
  }

  @Builder
  PlayerSelectDialog() {
    Column() {
      Text(`选择球员 - ${this.dialogTeamName}`)
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .margin({ bottom: 16 });

      if (this.dialogPlayers.length === 0) {
        Text('暂无球员信息')
          .fontSize(14)
          .fontColor('#999999')
          .margin({ top: 24 });
      } else {
        List() {
          ForEach(this.dialogPlayers, (player: PlayerInfo) => {
            ListItem() {
              Row() {
                Text(`${player.number}`)
                  .fontSize(18)
                  .fontWeight(FontWeight.Bold)
                  .width(40)
                  .height(40)
                  .backgroundColor(player.isOnCourt ? '#4CAF50' : '#E0E0E0')
                  .fontColor('#FFFFFF')
                  .textAlign(TextAlign.Center)
                  .borderRadius(20);

                Column() {
                  Text(player.name)
                    .fontSize(16)
                    .fontWeight(FontWeight.Medium);
                  Text(player.isOnCourt ? '在场' : '替补')
                    .fontSize(12)
                    .fontColor(player.isOnCourt ? '#4CAF50' : '#999999');
                }
                .layoutWeight(1)
                .margin({ left: 12 });

                Text(`${player.points}分 ${player.fouls}犯`)
                  .fontSize(12)
                  .fontColor('#666666');
              }
              .width('100%')
              .padding(12)
              .backgroundColor('#F8F8F8')
              .borderRadius(8)
              .onClick(() => this.onPlayerSelected(player));
            }
            .margin({ bottom: 8 });
          });
        }
        .width('100%')
        .height(300);
      }

      Button('取消')
        .width('100%')
        .height(48)
        .fontSize(16)
        .backgroundColor('#F0F0F0')
        .fontColor('#666666')
        .margin({ top: 16 })
        .onClick(() => {
          this.showPlayerDialog = false;
        });
    }
    .width('100%')
    .padding(24)
    .backgroundColor('#FFFFFF')
    .borderRadius(16);
  }

  @Builder
  FoulTypeSelectDialog() {
    Column() {
      Text('选择犯规类型')
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .margin({ bottom: 16 });

      if (this.foulTypes.length === 0) {
        Column() {
          LoadingProgress().width(32).height(32);
          Text('加载犯规类型中...')
            .fontSize(14)
            .fontColor('#999999')
            .margin({ top: 8 });
        }
        .margin({ top: 24 })
        .alignSelf(FlexAlign.Center);
      } else {
        List() {
          ForEach(this.foulTypes, (foulType: FoulType) => {
            ListItem() {
              Column() {
                Row() {
                  Column() {
                    Text(foulType.name)
                      .fontSize(16)
                      .fontWeight(FontWeight.Medium)
                      .fontColor('#333333');
                    Text(`严重程度: ${this.getSeverityText(foulType.severity)}`)
                      .fontSize(12)
                      .fontColor(this.getSeverityColor(foulType.severity))
                      .margin({ top: 4 });
                  }
                  .layoutWeight(1);

                  Text(foulType.code)
                    .fontSize(12)
                    .fontColor('#999999')
                    .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                    .backgroundColor('#F0F0F0')
                    .borderRadius(4);
                }
                .width('100%');

                Row() {
                  Text(`处罚: ${foulType.penalty.description}`)
                    .fontSize(12)
                    .fontColor('#666666');
                }
                .width('100%')
                .margin({ top: 8 });

                if (foulType.description) {
                  Text(foulType.description)
                    .fontSize(12)
                    .fontColor('#999999')
                    .margin({ top: 4 })
                    .width('100%');
                }
              }
              .width('100%')
              .padding(16)
              .backgroundColor('#F8F8F8')
              .borderRadius(8)
              .onClick(() => this.onFoulTypeSelected(foulType));
            }
            .margin({ bottom: 12 });
          });
        }
        .width('100%')
        .layoutWeight(1);
      }

      Button('取消')
        .width('100%')
        .height(48)
        .fontSize(16)
        .backgroundColor('#F0F0F0')
        .fontColor('#666666')
        .margin({ top: 16 })
        .onClick(() => {
          this.showFoulTypeDialog = false;
        });
    }
    .width('100%')
    .padding(24)
    .backgroundColor('#FFFFFF')
    .borderRadius(16)
    .height('100%');
  }

  /** 犯规类型选择回调 */
  private onFoulTypeSelected(foulType: FoulType): void {
    this.selectedFoulType = foulType;
    this.showFoulTypeDialog = false;
    // 显示球员选择弹窗
    this.showFoulDialog(this.foulTeamIsHome);
  }

  /** 获取严重程度显示文本 */
  private getSeverityText(severity: string): string {
    switch (severity) {
      case 'common': return '普通';
      case 'serious': return '严重';
      case 'technical': return '技术犯规';
      case 'flagrant': return '恶意犯规';
      default: return severity;
    }
  }

  /** 获取严重程度颜色 */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'common': return '#4CAF50';
      case 'serious': return '#FF9800';
      case 'technical': return '#F44336';
      case 'flagrant': return '#D32F2F';
      default: return '#999999';
    }
  }
}
