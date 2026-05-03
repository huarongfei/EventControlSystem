// MainPage.ets - 主页（赛况/操作/历史）- 响应式布局
import { Match, MatchEvent, EventType, getSportRule, SportRule } from '../model/MatchModels';
import { getViewModel } from '../viewmodel/RefereeViewModel';
import { getLayoutConfig, LayoutConfig, responsiveValue, responsiveString } from '../utils/DeviceInfo';
import { ConnectionBadge, OfflineBanner, EmptyState, ActionButton, ScoreButton } from '../components/ResponsiveComponents';
import router from '@ohos.router';

@Entry
@Component
struct MainPage {
  @State currentTabIndex: number = 0;
  @State match: Match | null = null;
  @State events: MatchEvent[] = [];
  @State isConnected: boolean = false;
  @State isOfflineMode: boolean = false;
  @State sportRule: SportRule | null = null;
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
  @State pendingSyncCount: number = 0;

  private viewModel = getViewModel(getContext(this));

  aboutToAppear() {
    this.initLayout();
    this.initCallbacks();
    this.loadInitialData();
  }

  async initLayout(): Promise<void> {
    this.config = await getLayoutConfig();
  }

  initCallbacks(): void {
    this.viewModel.onMatchUpdate((match: Match | null) => {
      this.match = match;
      if (match) {
        this.sportRule = getSportRule(match.sportType);
      }
    });
    this.viewModel.onConnectionChange((connected: boolean) => {
      this.isConnected = connected;
    });
    this.viewModel.onEventsChange((events: MatchEvent[]) => {
      this.events = events;
      this.pendingSyncCount = this.viewModel.pendingSyncCount;
    });
  }

  loadInitialData(): void {
    this.match = this.viewModel.currentMatch;
    if (this.match) {
      this.sportRule = getSportRule(this.match.sportType);
    }
    this.isConnected = this.viewModel.isConnected;
    this.events = this.viewModel.matchEvents;
    this.isOfflineMode = this.viewModel.isOfflineMode;
    this.pendingSyncCount = this.viewModel.pendingSyncCount;
  }

  build() {
    if (this.config.isLargeScreen) {
      // 大屏/平板/电脑：分栏布局
      this.LargeScreenLayout()
    } else {
      // 手机：Tab 布局
      this.PhoneLayout()
    }
  }

  // ============================================
  // 手机布局 - Tab 切换
  // ============================================
  @Builder
  PhoneLayout() {
    Column() {
      // 离线横幅
      if (this.isOfflineMode) {
        OfflineBanner({
          config: this.config,
          pendingCount: this.pendingSyncCount,
          onSync: () => this.viewModel.syncOfflineEvents()
        })
      }

      // 比赛信息卡片
      if (this.match) {
        this.MatchInfoCard()
      }

      // Tab 内容
      Tabs({ index: this.currentTabIndex }) {
        TabContent() {
          this.MatchInfoTab()
        }.tabBar('赛况')

        TabContent() {
          this.OperationTab()
        }.tabBar('操作')

        TabContent() {
          this.HistoryTab()
        }.tabBar('历史')
      }
      .width('100%')
      .layoutWeight(1)
      .barHeight(48)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#000000')
  }

  // ============================================
  // 大屏布局 - 左右分栏
  // ============================================
  @Builder
  LargeScreenLayout() {
    Row() {
      // 左侧：比赛信息 + 事件列表
      Column() {
        // 离线横幅
        if (this.isOfflineMode) {
          OfflineBanner({
            config: this.config,
            pendingCount: this.pendingSyncCount,
            onSync: () => this.viewModel.syncOfflineEvents()
          })
        }

        // 比赛信息卡片
        if (this.match) {
          this.MatchInfoCardLarge()
        }

        // 事件列表
        Column() {
          Text('最近事件')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
            .alignSelf(ItemAlign.Start)
            .margin({ left: this.config.padding, bottom: 12 })

          if (this.events.length === 0) {
            EmptyState({
              config: this.config,
              emoji: '📋',
              message: '暂无事件记录'
            })
          } else {
            List() {
              ForEach(this.events.slice(0, 15), (event: MatchEvent) => {
                ListItem() {
                  this.EventItemLarge(event)
                }
              }, (event: MatchEvent) => event.id)
            }
            .width('100%')
            .layoutWeight(1)
            .padding({ left: this.config.padding, right: this.config.padding })
          }
        }
        .width('100%')
        .layoutWeight(1)
      }
      .width('45%')
      .height('100%')

      Divider()
        .width('1vp')
        .height('100%')
        .backgroundColor('#333333')

      // 右侧：操作面板
      Column() {
        this.OperationPanelLarge()
      }
      .width('55%')
      .height('100%')
      .padding(this.config.padding)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#000000')
  }

  // ============================================
  // 比赛信息卡片
  // ============================================
  @Builder
  MatchInfoCard() {
    Column() {
      Row() {
        Text(this.sportRule ? this.sportRule.emoji : '🏀')
          .fontSize(24)

        Text(this.getPeriodName())
          .fontSize(14)
          .fontColor('#8A8A8A')
          .margin({ left: 8 })

        Blank()

        ConnectionBadge({ config: this.config, isConnected: this.isConnected })
      }
      .width('100%')
      .padding({ bottom: 16 })

      // 比分显示
      Row() {
        Column() {
          Text(this.match!.homeTeam.name)
            .fontSize(14)
            .fontColor('#8A8A8A')
          Text(this.match!.homeScore.toString())
            .fontSize(44)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
        }
        .width('45%')
        .alignItems(HorizontalAlign.Center)

        Text('-')
          .fontSize(28)
          .fontColor('#666666')

        Column() {
          Text(this.match!.awayTeam.name)
            .fontSize(14)
            .fontColor('#8A8A8A')
          Text(this.match!.awayScore.toString())
            .fontSize(44)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
        }
        .width('45%')
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('92%')
    .padding(20)
    .backgroundColor('#1C1C1E')
    .borderRadius(16)
    .margin({ left: '4%', right: '4%', top: 12, bottom: 12 })
  }

  @Builder
  MatchInfoCardLarge() {
    Column() {
      Row() {
        Column() {
          Text(this.sportRule ? this.sportRule.emoji : '🏀')
            .fontSize(36)
          Text(this.sportRule?.displayName || '')
            .fontSize(14)
            .fontColor('#8A8A8A')
            .margin({ top: 4 })
        }
        .alignItems(HorizontalAlign.Start)

        Blank()

        ConnectionBadge({ config: this.config, isConnected: this.isConnected })
      }
      .width('100%')

      Row() {
        Text(this.getPeriodName())
          .fontSize(14)
          .fontColor('#8A8A8A')
          .backgroundColor('#2C2C2E')
          .padding({ left: 12, right: 12, top: 4, bottom: 4 })
          .borderRadius(12)
      }
      .width('100%')
      .margin({ top: 16 })

      // 比分显示 - 大屏优化
      Row() {
        Column() {
          Text(this.match!.homeTeam.name)
            .fontSize(18)
            .fontColor('#8A8A8A')
          Text(this.match!.homeScore.toString())
            .fontSize(72)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
            .margin({ top: 8 })
        }
        .width('45%')
        .alignItems(HorizontalAlign.Center)

        Column() {
          Text('VS')
            .fontSize(20)
            .fontColor('#666666')
        }

        Column() {
          Text(this.match!.awayTeam.name)
            .fontSize(18)
            .fontColor('#8A8A8A')
          Text(this.match!.awayScore.toString())
            .fontSize(72)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
            .margin({ top: 8 })
        }
        .width('45%')
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)
      .margin({ top: 24 })
    }
    .width('100%')
    .padding(24)
    .backgroundColor('#1C1C1E')
    .borderRadius(20)
    .margin({ left: this.config.padding, right: this.config.padding, top: 16, bottom: 16 })
  }

  // ============================================
  // 事件列表
  // ============================================
  @Builder
  MatchInfoTab() {
    Column() {
      if (this.events.length === 0) {
        EmptyState({
          config: this.config,
          emoji: '📋',
          message: '暂无事件记录'
        })
      } else {
        List() {
          ForEach(this.events.slice(0, 10), (event: MatchEvent) => {
            ListItem() {
              this.EventItem(event)
            }
          }, (event: MatchEvent) => event.id)
        }
        .width('100%')
        .layoutWeight(1)
        .padding({ left: this.config.padding, right: this.config.padding })
      }
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  EventItem(event: MatchEvent) {
    Row() {
      Text(this.getEventEmoji(event.type))
        .fontSize(20)
        .width(40)
        .height(40)
        .textAlign(TextAlign.Center)
        .backgroundColor(this.getEventColor(event.type) + '20')
        .borderRadius(8)

      Column() {
        Text(this.getEventName(event.type))
          .fontSize(15)
          .fontColor('#FFFFFF')
        Text(`第${event.period}节 · ${event.teamId ? (event.teamId === this.match?.homeTeam.id ? this.match.homeTeam.name : this.match.awayTeam.name) : ''}`)
          .fontSize(12)
          .fontColor('#8A8A8A')
      }
      .margin({ left: 12 })
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      Text(new Date(event.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
        .fontSize(12)
        .fontColor('#8A8A8A')
    }
    .width('92%')
    .padding(12)
    .backgroundColor('#1C1C1E')
    .borderRadius(12)
    .margin({ bottom: 8 })
    .alignSelf(ItemAlign.Center)
  }

  @Builder
  EventItemLarge(event: MatchEvent) {
    Row() {
      Text(this.getEventEmoji(event.type))
        .fontSize(24)
        .width(48)
        .height(48)
        .textAlign(TextAlign.Center)
        .backgroundColor(this.getEventColor(event.type) + '20')
        .borderRadius(12)

      Column() {
        Text(this.getEventName(event.type))
          .fontSize(16)
          .fontColor('#FFFFFF')
        Text(`第${event.period}节 · ${event.teamId ? (event.teamId === this.match?.homeTeam.id ? this.match.homeTeam.name : this.match.awayTeam.name) : ''}`)
          .fontSize(13)
          .fontColor('#8A8A8A')
          .margin({ top: 2 })
      }
      .margin({ left: 16 })
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      Text(new Date(event.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
        .fontSize(14)
        .fontColor('#8A8A8A')
    }
    .width('100%')
    .padding(16)
    .backgroundColor('#1C1C1E')
    .borderRadius(12)
    .margin({ bottom: 8 })
  }

  // ============================================
  // 操作面板
  // ============================================
  @Builder
  OperationTab() {
    if (!this.match || !this.sportRule) {
      Text('比赛数据未加载')
        .fontColor('#8A8A8A')
      return;
    }

    Scroll() {
      Column() {
        Text(`${this.sportRule.displayName} 操作`)
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .alignSelf(ItemAlign.Start)
          .margin({ left: this.config.padding, bottom: 16 })

        this.getSportActions()
      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  OperationPanelLarge() {
    Column() {
      // 标题栏
      Row() {
        Text(`${this.sportRule?.displayName || ''} 操作面板`)
          .fontSize(22)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')

        Blank()

        Text(`待同步: ${this.pendingSyncCount}`)
          .fontSize(13)
          .fontColor(this.pendingSyncCount > 0 ? '#FF9500' : '#34C759')
      }
      .width('100%')
      .margin({ bottom: 24 })

      if (this.match && this.sportRule) {
        Scroll() {
          Column() {
            this.getSportActionsLarge()
          }
          .width('100%')
        }
        .width('100%')
        .layoutWeight(1)
      }
    }
    .width('100%')
    .height('100%')
  }

  // 根据运动类型返回对应的操作组件
  @Builder
  getSportActions() {
    if (this.match?.sportType === 'basketball') {
      this.BasketballActions()
    } else if (this.match?.sportType === 'football') {
      this.FootballActions()
    } else if (this.match?.sportType === 'volleyball') {
      this.VolleyballActions()
    } else if (['badminton', 'tennis', 'table_tennis'].includes(this.match?.sportType || '')) {
      this.RacquetSportActions()
    } else {
      Text('竞速类项目由终点计时系统自动记录')
        .fontColor('#8A8A8A')
        .margin({ top: 40 })
    }
  }

  @Builder
  getSportActionsLarge() {
    if (this.match?.sportType === 'basketball') {
      this.BasketballActionsLarge()
    } else if (this.match?.sportType === 'football') {
      this.FootballActionsLarge()
    } else if (this.match?.sportType === 'volleyball') {
      this.VolleyballActionsLarge()
    } else if (['badminton', 'tennis', 'table_tennis'].includes(this.match?.sportType || '')) {
      this.RacquetSportActionsLarge()
    } else {
      Text('竞速类项目由终点计时系统自动记录')
        .fontColor('#8A8A8A')
        .margin({ top: 40 })
    }
  }

  // ============================================
  // 篮球操作
  // ============================================
  @Builder
  BasketballActions() {
    Column() {
      // 主队得分
      Text('主队得分').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ScoreButton(this.match!.homeTeam.name, 1, () => this.onReportScore(this.match!.homeTeam.id, 1))
        this.ScoreButton(this.match!.homeTeam.name, 2, () => this.onReportScore(this.match!.homeTeam.id, 2))
        this.ScoreButton(this.match!.homeTeam.name, 3, () => this.onReportScore(this.match!.homeTeam.id, 3))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
      .margin({ bottom: 16 })

      // 客队得分
      Text('客队得分').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ScoreButton(this.match!.awayTeam.name, 1, () => this.onReportScore(this.match!.awayTeam.id, 1))
        this.ScoreButton(this.match!.awayTeam.name, 2, () => this.onReportScore(this.match!.awayTeam.id, 2))
        this.ScoreButton(this.match!.awayTeam.name, 3, () => this.onReportScore(this.match!.awayTeam.id, 3))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
      .margin({ bottom: 20 })

      // 其他操作
      Text('其他操作').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ActionButton('主队犯规', '⚠️', '#FF9500', () => this.onReportFoul(this.match!.homeTeam.id))
        this.ActionButton('客队犯规', '⚠️', '#FF9500', () => this.onReportFoul(this.match!.awayTeam.id))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
  }

  @Builder
  BasketballActionsLarge() {
    Column() {
      // 主队得分区域
      Column() {
        Text(this.match!.homeTeam.name)
          .fontSize(18)
          .fontColor('#FFFFFF')
          .margin({ bottom: 16 })

        Row() {
          this.ScoreButton(this.match!.homeTeam.name, 1, () => this.onReportScore(this.match!.homeTeam.id, 1))
          this.ScoreButton(this.match!.homeTeam.name, 2, () => this.onReportScore(this.match!.homeTeam.id, 2))
          this.ScoreButton(this.match!.homeTeam.name, 3, () => this.onReportScore(this.match!.homeTeam.id, 3))
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)
      }
      .width('100%')
      .padding(24)
      .backgroundColor('#1C1C1E')
      .borderRadius(16)
      .margin({ bottom: 16 })

      // 客队得分区域
      Column() {
        Text(this.match!.awayTeam.name)
          .fontSize(18)
          .fontColor('#FFFFFF')
          .margin({ bottom: 16 })

        Row() {
          this.ScoreButton(this.match!.awayTeam.name, 1, () => this.onReportScore(this.match!.awayTeam.id, 1))
          this.ScoreButton(this.match!.awayTeam.name, 2, () => this.onReportScore(this.match!.awayTeam.id, 2))
          this.ScoreButton(this.match!.awayTeam.name, 3, () => this.onReportScore(this.match!.awayTeam.id, 3))
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)
      }
      .width('100%')
      .padding(24)
      .backgroundColor('#1C1C1E')
      .borderRadius(16)
      .margin({ bottom: 24 })

      // 其他操作
      Text('其他操作')
        .fontSize(16)
        .fontColor('#8A8A8A')
        .alignSelf(ItemAlign.Start)
        .margin({ bottom: 12 })

      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.SpaceEvenly }) {
        this.ActionButton('主队犯规', '⚠️', '#FF9500', () => this.onReportFoul(this.match!.homeTeam.id))
        this.ActionButton('客队犯规', '⚠️', '#FF9500', () => this.onReportFoul(this.match!.awayTeam.id))
        this.ActionButton('主队换人', '🔄', '#34C759', () => this.onReportSubstitution(this.match!.homeTeam.id))
        this.ActionButton('客队换人', '🔄', '#34C759', () => this.onReportSubstitution(this.match!.awayTeam.id))
        this.ActionButton('主队暂停', '⏸️', '#AF52DE', () => this.onReportTimeout(this.match!.homeTeam.id))
        this.ActionButton('客队暂停', '⏸️', '#AF52DE', () => this.onReportTimeout(this.match!.awayTeam.id))
        this.ActionButton('主队伤病', '🏥', '#FF3B30', () => this.onReportInjury(this.match!.homeTeam.id))
        this.ActionButton('客队伤病', '🏥', '#FF3B30', () => this.onReportInjury(this.match!.awayTeam.id))
      }
      .width('100%')
    }
  }

  // ============================================
  // 足球操作
  // ============================================
  @Builder
  FootballActions() {
    Column() {
      Text('进球').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ActionButton(`${this.match!.homeTeam.name} 进球`, '⚽', '#5AC8FA', () => this.onReportScore(this.match!.homeTeam.id, 1))
        this.ActionButton(`${this.match!.awayTeam.name} 进球`, '⚽', '#5AC8FA', () => this.onReportScore(this.match!.awayTeam.id, 1))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
      .margin({ bottom: 16 })

      Text('红黄牌').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ActionButton('主队黄牌', '🟨', '#FFD700', () => this.onReportCard(this.match!.homeTeam.id, 'yellow_card'))
        this.ActionButton('主队红牌', '🟥', '#FF3B30', () => this.onReportCard(this.match!.homeTeam.id, 'red_card'))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
      .margin({ bottom: 16 })

      Row() {
        this.ActionButton('客队黄牌', '🟨', '#FFD700', () => this.onReportCard(this.match!.awayTeam.id, 'yellow_card'))
        this.ActionButton('客队红牌', '🟥', '#FF3B30', () => this.onReportCard(this.match!.awayTeam.id, 'red_card'))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
  }

  @Builder
  FootballActionsLarge() {
    Column() {
      // 进球区域
      Column() {
        Text('⚽ 进球')
          .fontSize(16)
          .fontColor('#FFFFFF')
          .margin({ bottom: 16 })

        Row() {
          this.ActionButton(`${this.match!.homeTeam.name}`, '⚽', '#5AC8FA', () => this.onReportScore(this.match!.homeTeam.id, 1))
          this.ActionButton(`${this.match!.awayTeam.name}`, '⚽', '#5AC8FA', () => this.onReportScore(this.match!.awayTeam.id, 1))
        }
        .width('100%')
        .justifyContent(FlexAlign.Center)
      }
      .width('100%')
      .padding(24)
      .backgroundColor('#1C1C1E')
      .borderRadius(16)
      .margin({ bottom: 16 })

      // 红黄牌
      Text('红黄牌')
        .fontSize(16)
        .fontColor('#8A8A8A')
        .alignSelf(ItemAlign.Start)
        .margin({ bottom: 12 })

      Row() {
        Column() {
          Text('主队')
            .fontSize(14)
            .fontColor('#8A8A8A')
            .margin({ bottom: 8 })
          Row() {
            this.ActionButton('黄牌', '🟨', '#FFD700', () => this.onReportCard(this.match!.homeTeam.id, 'yellow_card'))
            this.ActionButton('红牌', '🟥', '#FF3B30', () => this.onReportCard(this.match!.homeTeam.id, 'red_card'))
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)
        }
        .width('48%')
        .padding(16)
        .backgroundColor('#1C1C1E')
        .borderRadius(12)

        Column() {
          Text('客队')
            .fontSize(14)
            .fontColor('#8A8A8A')
            .margin({ bottom: 8 })
          Row() {
            this.ActionButton('黄牌', '🟨', '#FFD700', () => this.onReportCard(this.match!.awayTeam.id, 'yellow_card'))
            this.ActionButton('红牌', '🟥', '#FF3B30', () => this.onReportCard(this.match!.awayTeam.id, 'red_card'))
          }
          .width('100%')
          .justifyContent(FlexAlign.Center)
        }
        .width('48%')
        .padding(16)
        .backgroundColor('#1C1C1E')
        .borderRadius(12)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
    }
  }

  // ============================================
  // 排球操作
  // ============================================
  @Builder
  VolleyballActions() {
    Column() {
      Text('得分').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ActionButton(`${this.match!.homeTeam.name} 得分`, '🏐', '#5AC8FA', () => this.onReportScore(this.match!.homeTeam.id, 1))
        this.ActionButton(`${this.match!.awayTeam.name} 得分`, '🏐', '#5AC8FA', () => this.onReportScore(this.match!.awayTeam.id, 1))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
  }

  @Builder
  VolleyballActionsLarge() {
    Column() {
      Text('🏐 得分')
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFFFFF')
        .margin({ bottom: 24 })

      Row() {
        Column() {
          Text(this.match!.homeTeam.name)
            .fontSize(18)
            .fontColor('#8A8A8A')
            .margin({ bottom: 12 })
          this.ActionButton('得分', '🏐', '#5AC8FA', () => this.onReportScore(this.match!.homeTeam.id, 1))
        }
        .width('40%')
        .alignItems(HorizontalAlign.Center)

        Column() {
          Text(this.match!.awayTeam.name)
            .fontSize(18)
            .fontColor('#8A8A8A')
            .margin({ bottom: 12 })
          this.ActionButton('得分', '🏐', '#5AC8FA', () => this.onReportScore(this.match!.awayTeam.id, 1))
        }
        .width('40%')
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
    .padding(32)
    .backgroundColor('#1C1C1E')
    .borderRadius(20)
  }

  // ============================================
  // 球拍类运动（羽毛球/网球/乒乓球）
  // ============================================
  @Builder
  RacquetSportActions() {
    Column() {
      Text('得分').fontSize(13).fontColor('#8A8A8A').alignSelf(ItemAlign.Start).margin({ left: this.config.padding, bottom: 8 })
      Row() {
        this.ActionButton(`${this.match!.homeTeam.name} 得分`, '🏸', '#5AC8FA', () => this.onReportScore(this.match!.homeTeam.id, 1))
        this.ActionButton(`${this.match!.awayTeam.name} 得分`, '🏸', '#5AC8FA', () => this.onReportScore(this.match!.awayTeam.id, 1))
      }
      .width('92%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
  }

  @Builder
  RacquetSportActionsLarge() {
    Column() {
      Text('🏸 得分')
        .fontSize(20)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFFFFF')
        .margin({ bottom: 24 })

      Row() {
        Column() {
          Text(this.match!.homeTeam.name)
            .fontSize(18)
            .fontColor('#8A8A8A')
            .margin({ bottom: 12 })
          this.ActionButton('得分', '🏸', '#5AC8FA', () => this.onReportScore(this.match!.homeTeam.id, 1))
        }
        .width('40%')
        .alignItems(HorizontalAlign.Center)

        Column() {
          Text(this.match!.awayTeam.name)
            .fontSize(18)
            .fontColor('#8A8A8A')
            .margin({ bottom: 12 })
          this.ActionButton('得分', '🏸', '#5AC8FA', () => this.onReportScore(this.match!.awayTeam.id, 1))
        }
        .width('40%')
        .alignItems(HorizontalAlign.Center)
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
    .padding(32)
    .backgroundColor('#1C1C1E')
    .borderRadius(20)
  }

  // ============================================
  // 历史记录
  // ============================================
  @Builder
  HistoryTab() {
    Column() {
      if (this.events.length === 0) {
        EmptyState({
          config: this.config,
          emoji: '📝',
          message: '暂无事件记录'
        })
      } else {
        List() {
          ForEach(this.events, (event: MatchEvent) => {
            ListItem() {
              this.EventItem(event)
            }
          }, (event: MatchEvent) => event.id)
        }
        .width('100%')
        .layoutWeight(1)
        .padding({ left: this.config.padding, right: this.config.padding })
      }
    }
    .width('100%')
    .height('100%')
  }

  // ============================================
  // 按钮组件
  // ============================================
  @Builder
  ScoreButton(teamName: string, points: number, onClick: () => void) {
    Button(`${points}分`)
      .width(responsiveValue(90, 110, 120, this.config))
      .height(responsiveValue(56, 64, 72, this.config))
      .backgroundColor('#5AC8FA')
      .borderRadius(12)
      .fontSize(responsiveValue(16, 18, 20, this.config))
      .fontWeight(FontWeight.Bold)
      .fontColor('#FFFFFF')
      .shadow({
        radius: 8,
        color: '#5AC8FA40',
        offsetX: 0,
        offsetY: 4
      })
      .onClick(onClick)
  }

  @Builder
  ActionButton(text: string, emoji: string, color: string, onClick: () => void) {
    Button() {
      Column() {
        Text(emoji)
          .fontSize(responsiveValue(20, 24, 28, this.config))
        Text(text)
          .fontSize(responsiveValue(11, 12, 13, this.config))
          .fontColor('#FFFFFF')
          .margin({ top: 4 })
      }
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)
      .width('100%')
      .height('100%')
    }
    .width(responsiveValue(140, 150, 160, this.config))
    .height(responsiveValue(56, 64, 72, this.config))
    .backgroundColor(color)
    .borderRadius(12)
    .shadow({
      radius: 8,
      color: color + '40',
      offsetX: 0,
      offsetY: 4
    })
    .onClick(onClick)
  }

  // ============================================
  // 事件处理
  // ============================================
  onReportScore(teamId: string, points: number): void {
    this.viewModel.reportScore(teamId, points);
  }

  onReportFoul(teamId: string): void {
    this.viewModel.reportFoul(teamId, '普通犯规');
  }

  onReportSubstitution(teamId: string): void {
    this.viewModel.reportSubstitution(teamId);
  }

  onReportTimeout(teamId: string): void {
    this.viewModel.reportTimeout(teamId);
  }

  onReportInjury(teamId: string): void {
    this.viewModel.reportInjury(teamId);
  }

  onReportCard(teamId: string, cardType: string): void {
    this.viewModel.reportCard(teamId, cardType);
  }

  // ============================================
  // 辅助方法
  // ============================================
  getPeriodName(): string {
    if (!this.match || !this.sportRule) return '第1节';
    if (this.match.sportType === 'volleyball') return `第${this.match.currentPeriod}局`;
    if (this.match.sportType === 'football') return this.match.currentPeriod === 1 ? '上半场' : '下半场';
    return `第${this.match.currentPeriod}节`;
  }

  getEventName(type: EventType): string {
    const names: Record<string, string> = {
      'score': '得分',
      'foul': '犯规',
      'substitution': '换人',
      'timeout': '暂停',
      'injury': '伤病',
      'cancel': '取消',
      'yellow_card': '黄牌',
      'red_card': '红牌',
      'corner_kick': '角球',
      'offside': '越位',
      'side_change': '换边',
      'finish': '完赛',
      'dq': '取消资格',
      'withdraw': '退赛'
    };
    return names[type] || type;
  }

  getEventEmoji(type: EventType): string {
    const emojis: Record<string, string> = {
      'score': '🏀',
      'foul': '⚠️',
      'substitution': '🔄',
      'timeout': '⏸️',
      'injury': '🏥',
      'cancel': '❌',
      'yellow_card': '🟨',
      'red_card': '🟥',
      'corner_kick': '⚽',
      'offside': '🚩',
      'side_change': '🔄',
      'finish': '🏁',
      'dq': '🚫',
      'withdraw': '🚪'
    };
    return emojis[type] || '📝';
  }

  getEventColor(type: EventType): string {
    if (type === 'score') return '#5AC8FA';
    if (['foul', 'yellow_card', 'red_card'].includes(type)) return '#FF9500';
    if (type === 'substitution') return '#34C759';
    if (type === 'timeout') return '#AF52DE';
    if (type === 'injury') return '#FF3B30';
    return '#5AC8FA';
  }
}
