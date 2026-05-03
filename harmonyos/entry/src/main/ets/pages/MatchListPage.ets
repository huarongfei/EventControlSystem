// MatchListPage - 比赛列表页面（支持多设备适配）
import { Match, getSportRule } from '../model/MatchModels';
import { getViewModel } from '../viewmodel/RefereeViewModel';
import { getLayoutConfig, LayoutConfig } from '../utils/DeviceInfo';
import { ResponsiveCard, EmptyState, PageTitle, ConnectionBadge } from '../components/ResponsiveComponents';
import router from '@ohos.router';

@Entry
@Component
struct MatchListPage {
  @State config: LayoutConfig = {
    isPhone: true,
    isTablet: false,
    isDesktop: false,
    isLandscape: false,
    isLargeScreen: false,
    columns: 1,
    gutter: 12,
    padding: 16,
    cardWidth: '90%',
    fontScale: 1.0
  };
  @State matches: Match[] = [];
  @State isLoading: boolean = true;
  @State isConnected: boolean = false;
  @State errorMsg: string = '';

  private viewModel = getViewModel(getContext(this));

  async aboutToAppear() {
    // 获取布局配置
    this.config = await getLayoutConfig();

    // 监听连接状态
    this.viewModel.onConnectionChange((connected: boolean) => {
      this.isConnected = connected;
    });

    // 加载比赛列表
    await this.loadMatches();
  }

  async loadMatches(): Promise<void> {
    this.isLoading = true;
    this.errorMsg = '';

    try {
      await this.viewModel.loadMatches();
      this.matches = this.viewModel.matchList;
    } catch (e) {
      this.errorMsg = '加载比赛列表失败';
    } finally {
      this.isLoading = false;
    }
  }

  onSelectMatch(match: Match): void {
    // 连接到选中的比赛
    this.viewModel.connectToMatch(match.id, this.viewModel['apiService']?.getBaseUrl?.() || '');
    router.pushUrl({ url: 'pages/MainPage' });
  }

  build() {
    Column() {
      // 标题栏
      Row() {
        Text('选择比赛')
          .fontSize(this.config.isLargeScreen ? 24 : 20)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')

        Blank()

        ConnectionBadge({ config: this.config, isConnected: this.isConnected })

        Button('刷新')
          .fontSize(12)
          .height(32)
          .margin({ left: 12 })
          .backgroundColor('#1C1C1E')
          .borderRadius(8)
          .onClick(() => this.loadMatches())
      }
      .width('100%')
      .padding({ left: this.config.padding, right: this.config.padding, top: 16, bottom: 16 })

      // 错误提示
      if (this.errorMsg) {
        Text(this.errorMsg)
          .fontSize(14)
          .fontColor('#FF3B30')
          .width('100%')
          .textAlign(TextAlign.Center)
          .padding(12)
      }

      // 加载状态
      if (this.isLoading) {
        LoadingProgress()
          .width(this.config.isLargeScreen ? 48 : 36)
          .height(this.config.isLargeScreen ? 48 : 36)
          .margin({ top: 40 })
        Text('加载中...')
          .fontSize(14)
          .fontColor('#8A8A8A')
          .margin({ top: 12 })
      } else if (this.matches.length === 0) {
        // 空状态
        EmptyState({
          config: this.config,
          emoji: '🏟️',
          message: '暂无比赛',
          action: () => {
            Button('重新加载')
              .width(140)
              .height(44)
              .backgroundColor('#5AC8FA')
              .borderRadius(22)
              .onClick(() => this.loadMatches())
          }
        })
      } else {
        // 比赛列表
        if (this.config.isLargeScreen) {
          // 大屏：网格布局
          this.MatchGrid()
        } else {
          // 小屏：列表布局
          this.MatchList()
        }
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#000000')
  }

  @Builder
  MatchList() {
    List() {
      ForEach(this.matches, (match: Match) => {
        ListItem() {
          this.MatchCard(match)
        }
      }, (match: Match) => match.id)
    }
    .width('100%')
    .height('100%')
    .padding({ left: this.config.padding, right: this.config.padding })
  }

  @Builder
  MatchGrid() {
    Scroll() {
      Column() {
        Grid() {
          ForEach(this.matches, (match: Match) => {
            GridItem() {
              this.MatchCard(match)
            }
          }, (match: Match) => match.id)
        }
        .columnsTemplate('1fr 1fr')
        .columnsGap(this.config.gutter)
        .rowsGap(this.config.gutter)
        .width('100%')
        .padding({ left: this.config.padding, right: this.config.padding })
      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .scrollBar(BarState.Off)
  }

  @Builder
  MatchCard(match: Match) {
    Column() {
      // 比赛类型和状态
      Row() {
        Text(getSportRule(match.sportType)?.emoji || '🏀')
          .fontSize(this.config.isLargeScreen ? 32 : 24)

        Text(this.getMatchStatus(match.status))
          .fontSize(11)
          .fontColor('#FFFFFF')
          .padding({ left: 8, right: 8, top: 3, bottom: 3 })
          .backgroundColor(this.getStatusColor(match.status))
          .borderRadius(10)

        Blank()

        Text(match.startTime ? new Date(match.startTime).toLocaleDateString('zh-CN') : '')
          .fontSize(12)
          .fontColor('#8A8A8A')
      }
      .width('100%')
      .margin({ bottom: 12 })

      // 队伍信息
      Row() {
        Column() {
          Text(match.homeTeam.name)
            .fontSize(this.config.isLargeScreen ? 18 : 15)
            .fontColor('#FFFFFF')
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })

          Text(match.homeScore.toString())
            .fontSize(this.config.isLargeScreen ? 36 : 28)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
            .margin({ top: 4 })
        }
        .width('45%')
        .alignItems(HorizontalAlign.Center)

        Text('VS')
          .fontSize(this.config.isLargeScreen ? 18 : 14)
          .fontColor('#8A8A8A')

        Column() {
          Text(match.awayTeam.name)
            .fontSize(this.config.isLargeScreen ? 18 : 15)
            .fontColor('#FFFFFF')
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })

          Text(match.awayScore.toString())
            .fontSize(this.config.isLargeScreen ? 36 : 28)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
            .margin({ top: 4 })
        }
        .width('45%')
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)

      // 选择按钮
      Button('进入裁判')
        .width('100%')
        .height(40)
        .margin({ top: 16 })
        .backgroundColor('#5AC8FA')
        .borderRadius(20)
        .fontSize(14)
        .onClick(() => this.onSelectMatch(match))
    }
    .width('100%')
    .padding(this.config.isLargeScreen ? 20 : 16)
    .backgroundColor('#1C1C1E')
    .borderRadius(16)
    .margin({ bottom: this.config.gutter })
  }

  getMatchStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '未开始',
      'live': '进行中',
      'paused': '暂停',
      'finished': '已结束',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending': '#8E8E93',
      'live': '#34C759',
      'paused': '#FF9500',
      'finished': '#5AC8FA',
      'cancelled': '#FF3B30'
    };
    return colorMap[status] || '#8E8E93';
  }
}
