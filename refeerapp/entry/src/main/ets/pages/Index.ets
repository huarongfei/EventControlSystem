// Index.ets - 连接页面
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { apiService, MatchListItem } from '../service/ApiService';
import { storageService } from '../service/StorageService';
import { networkMonitor, NetworkStatus } from '../utils/NetworkMonitor';

/** 将后端 status 字符串映射为中文 */
function getStatusText(status: string): string {
  const map: Record<string, string> = {
    live: '进行中', upcoming: '未开始', paused: '暂停',
    finished: '已结束', cancelled: '已取消', not_started: '未开始', running: '进行中',
  };
  return map[status] ?? status;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    live: '#4CAF50', running: '#4CAF50',
    upcoming: '#999999', not_started: '#999999',
    paused: '#FF9800', finished: '#607D8B', cancelled: '#F44336',
  };
  return map[status] ?? '#999999';
}

@Entry
@Component
struct Index {
  @State serverUrl: string = 'http://192.168.1.100:3001';
  @State isLoading: boolean = false;
  @State isLoadingMatches: boolean = false;
  @State errorMsg: string = '';
  @State matchList: MatchListItem[] = [];
  @State selectedMatch: MatchListItem | null = null;
  @State historyUrls: string[] = [];
  @State showHistoryDropdown: boolean = false;
  @State isTestingConnection: boolean = false;
  @State connectionStatus: string = '';
  @State isNetworkConnected: boolean = true;
  @State networkType: string = '';

  aboutToAppear(): void {
    this.loadSavedConfig();
    this.startNetworkMonitoring();
  }

  aboutToDisappear(): void {
    networkMonitor.stopMonitoring();
  }

  private startNetworkMonitoring(): void {
    networkMonitor.addListener((status: NetworkStatus) => {
      this.isNetworkConnected = status.isConnected;
      this.networkType = status.networkType;
    });
    networkMonitor.startMonitoring();
  }

  private async loadSavedConfig(): Promise<void> {
    const savedUrl = await storageService.getServerUrl();
    if (savedUrl) this.serverUrl = savedUrl;
    this.historyUrls = await storageService.getHistoryUrls();
  }

  async testConnection(): Promise<void> {
    if (!this.serverUrl) {
      this.errorMsg = '请输入服务器地址';
      return;
    }

    this.isTestingConnection = true;
    this.connectionStatus = '检测中...';
    this.errorMsg = '';
    this.matchList = [];
    this.selectedMatch = null;

    try {
      apiService.setBaseUrl(this.serverUrl);
      const connected = await apiService.testConnection();

      if (connected) {
        this.connectionStatus = '✓ 连接成功';
        await storageService.saveServerUrl(this.serverUrl);
        // 自动加载比赛列表
        this.fetchMatchList();
      } else {
        this.connectionStatus = '';
        this.errorMsg = '无法连接到服务器，请检查地址和网络';
      }
    } catch (err) {
      this.connectionStatus = '';
      this.errorMsg = `连接失败: ${String(err)}`;
    } finally {
      this.isTestingConnection = false;
    }
  }

  selectHistoryUrl(url: string): void {
    this.serverUrl = url;
    this.showHistoryDropdown = false;
    this.testConnection();
  }

  async fetchMatchList(): Promise<void> {
    this.isLoadingMatches = true;
    this.errorMsg = '';

    try {
      const result = await apiService.getMatchList();
      if (result.ok && result.data) {
        this.matchList = result.data;
        if (this.matchList.length === 0) {
          this.errorMsg = '暂无可用比赛，请先在管理端创建比赛';
        }
      } else {
        this.errorMsg = result.error ?? '获取比赛列表失败';
      }
    } catch (err) {
      this.errorMsg = '获取比赛列表失败: ' + String(err);
    } finally {
      this.isLoadingMatches = false;
    }
  }

  async connectToMatch(): Promise<void> {
    if (!this.selectedMatch) {
      this.errorMsg = '请先选择比赛';
      return;
    }
    this.isLoading = true;
    this.errorMsg = '';

    try {
      router.pushUrl({
        url: 'pages/MainPage',
        params: {
          serverUrl: this.serverUrl,
          matchId: this.selectedMatch.id,
          homeTeamName: this.selectedMatch.home_team.name,
          awayTeamName: this.selectedMatch.away_team.name,
          homeTeamId: this.selectedMatch.home_team.id,
          awayTeamId: this.selectedMatch.away_team.id,
          eventName: this.selectedMatch.event_name,
          sportEmoji: this.selectedMatch.sport_emoji,
        }
      });
    } catch (err) {
      this.errorMsg = '跳转失败: ' + String(err);
    } finally {
      this.isLoading = false;
    }
  }

  build() {
    Column() {
      // ── 顶部标题 ──
      Text('⚡ 裁判端')
        .fontSize(30)
        .fontWeight(FontWeight.Bold)
        .margin({ top: 48, bottom: 4 });

      Text('体育比赛综合管理系统')
        .fontSize(14)
        .fontColor('#999999')
        .margin({ bottom: 32 });

      // ── 网络状态 ──
      if (!this.isNetworkConnected) {
        Row() {
          Text('⚠️ 网络未连接，请检查网络设置')
            .fontSize(13)
            .fontColor('#FFFFFF')
            .padding({ left: 16, right: 16, top: 8, bottom: 8 });
        }
        .width('100%')
        .backgroundColor('#F44336')
        .justifyContent(FlexAlign.Center)
        .margin({ bottom: 12 });
      }

      // ── 服务器地址输入框 ──
      Column() {
        Row() {
          Text('服务器地址').fontSize(13).fontColor('#666666');
          Blank();
          if (this.historyUrls.length > 0) {
            Text('历史')
              .fontSize(12)
              .fontColor('#007AFF')
              .onClick(() => { this.showHistoryDropdown = !this.showHistoryDropdown; });
          }
        }
        .width('100%')
        .margin({ bottom: 6 });

        // 历史下拉
        if (this.showHistoryDropdown && this.historyUrls.length > 0) {
          Column() {
            ForEach(this.historyUrls, (url: string) => {
              Text(url)
                .fontSize(13)
                .fontColor('#333333')
                .width('100%')
                .padding({ left: 12, right: 12, top: 10, bottom: 10 })
                .backgroundColor('#F8F8F8')
                .borderRadius(8)
                .margin({ bottom: 4 })
                .onClick(() => this.selectHistoryUrl(url));
            });
          }
          .width('100%')
          .padding(8)
          .backgroundColor('#FFF')
          .borderRadius(10)
          .shadow({ radius: 6, color: 'rgba(0,0,0,0.1)', offsetX: 0, offsetY: 2 })
          .margin({ bottom: 8 });
        }

        Row() {
          TextInput({ placeholder: 'http://192.168.x.x:3001', text: this.serverUrl })
            .layoutWeight(1)
            .height(48)
            .borderRadius(10)
            .backgroundColor('#F5F5F5')
            .onChange((v: string) => {
              this.serverUrl = v;
              this.connectionStatus = '';
            });

          Button(this.isTestingConnection ? '检测中...' : '连接')
            .width(76)
            .height(48)
            .borderRadius(10)
            .margin({ left: 10 })
            .enabled(!this.isTestingConnection)
            .onClick(() => this.testConnection());
        }
        .width('100%');

        if (this.connectionStatus) {
          Text(this.connectionStatus)
            .fontSize(12)
            .fontColor('#4CAF50')
            .margin({ top: 6 })
            .alignSelf(ItemAlign.Start);
        }
      }
      .width('100%')
      .padding({ left: 24, right: 24 })
      .margin({ bottom: 20 });

      // ── 比赛列表 ──
      Row() {
        Text('选择比赛').fontSize(13).fontColor('#666666');
        Blank();
        if (!this.isLoadingMatches && this.matchList.length > 0) {
          Text(`${this.matchList.length} 场`)
            .fontSize(12)
            .fontColor('#999999');
        }
        if (this.connectionStatus !== '' && !this.isLoadingMatches) {
          Text('刷新')
            .fontSize(12)
            .fontColor('#007AFF')
            .margin({ left: 12 })
            .onClick(() => this.fetchMatchList());
        }
      }
      .width('100%')
      .padding({ left: 24, right: 24 })
      .margin({ bottom: 8 });

      if (this.isLoadingMatches) {
        Column() {
          LoadingProgress().width(36).height(36);
          Text('加载比赛列表...').fontSize(13).fontColor('#999999').margin({ top: 10 });
        }
        .width('100%')
        .height(180)
        .justifyContent(FlexAlign.Center);
      } else if (this.matchList.length > 0) {
        Scroll() {
          Column() {
            ForEach(this.matchList, (match: MatchListItem) => {
              this.MatchCard(match);
            });
          }
          .width('100%')
          .padding({ left: 24, right: 24 });
        }
        .width('100%')
        .height(280);
      } else if (!this.errorMsg) {
        Column() {
          Text('🎯').fontSize(40);
          Text('连接成功后将自动显示比赛')
            .fontSize(13)
            .fontColor('#BBBBBB')
            .margin({ top: 8 });
        }
        .width('100%')
        .height(180)
        .justifyContent(FlexAlign.Center);
      }

      // ── 错误信息 ──
      if (this.errorMsg) {
        Text(this.errorMsg)
          .fontSize(13)
          .fontColor('#F44336')
          .padding({ left: 24, right: 24 })
          .margin({ top: 8, bottom: 8 })
          .textAlign(TextAlign.Center);
      }

      Blank();

      // ── 进入比赛按钮 ──
      Button('进入比赛')
        .width('88%')
        .height(52)
        .borderRadius(26)
        .fontSize(18)
        .fontWeight(FontWeight.Medium)
        .backgroundColor(this.selectedMatch ? '#007AFF' : '#C8C8C8')
        .enabled(!this.isLoading && this.selectedMatch !== null)
        .margin({ bottom: 32 })
        .onClick(() => this.connectToMatch());

      if (this.isLoading) {
        LoadingProgress().width(24).height(24).margin({ bottom: 16 });
      }
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Start)
    .alignItems(HorizontalAlign.Center)
    .backgroundColor('#FAFAFA');
  }

  @Builder
  MatchCard(match: MatchListItem) {
    Row() {
      // 左侧：赛事名 + 球队
      Column() {
        // 赛事名 + 运动图标
        Row() {
          Text(match.sport_emoji + ' ' + match.event_name)
            .fontSize(12)
            .fontColor('#888888')
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis });
        }
        .margin({ bottom: 4 });

        // 球队 vs 球队
        Row() {
          Text(match.home_team.short_name ?? match.home_team.name)
            .fontSize(15)
            .fontWeight(FontWeight.Medium)
            .maxLines(1)
            .layoutWeight(1);
          Text(' vs ')
            .fontSize(13)
            .fontColor('#AAAAAA');
          Text(match.away_team.short_name ?? match.away_team.name)
            .fontSize(15)
            .fontWeight(FontWeight.Medium)
            .maxLines(1)
            .layoutWeight(1)
            .textAlign(TextAlign.End);
        }
        .width('100%');

        // 比分 + 状态
        Row() {
          Text(`${match.home_score}`)
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor('#007AFF');
          Text(' : ')
            .fontSize(18)
            .fontColor('#CCCCCC');
          Text(`${match.away_score}`)
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor('#007AFF');
          Blank();
          Text(getStatusText(match.status))
            .fontSize(11)
            .fontColor(getStatusColor(match.status))
            .backgroundColor(getStatusColor(match.status) + '22')
            .padding({ left: 8, right: 8, top: 3, bottom: 3 })
            .borderRadius(4);
        }
        .width('100%')
        .margin({ top: 6 });
      }
      .layoutWeight(1);

      // 右侧选中圆圈
      Circle()
        .width(22)
        .height(22)
        .fill(this.selectedMatch?.id === match.id ? '#007AFF' : 'transparent')
        .stroke(this.selectedMatch?.id === match.id ? '#007AFF' : '#CCCCCC')
        .strokeWidth(2)
        .margin({ left: 12 });
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 14, bottom: 14 })
    .backgroundColor(this.selectedMatch?.id === match.id ? '#E8F4FF' : '#FFFFFF')
    .borderRadius(12)
    .margin({ bottom: 10 })
    .shadow({
      radius: this.selectedMatch?.id === match.id ? 8 : 3,
      color: 'rgba(0,122,255,0.12)',
      offsetX: 0,
      offsetY: 2
    })
    .onClick(() => {
      this.selectedMatch = match;
    });
  }
}
