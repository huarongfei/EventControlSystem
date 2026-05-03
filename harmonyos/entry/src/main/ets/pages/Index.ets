// Index.ets - 入口页面（连接服务器 + 输入比赛ID）- 响应式布局
import { getViewModel } from '../viewmodel/RefereeViewModel';
import { getLayoutConfig, LayoutConfig } from '../utils/DeviceInfo';
import { ResponsiveInput, ConnectionBadge } from '../components/ResponsiveComponents';
import router from '@ohos.router';

@Entry
@Component
struct Index {
  @State serverUrl: string = 'http://192.168.1.100:3001';
  @State matchId: string = '';
  @State isConnecting: boolean = false;
  @State errorMsg: string = '';
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
  @State matchListVisible: boolean = false;
  @State availableMatches: number = 0;

  private viewModel = getViewModel(getContext(this));

  aboutToAppear() {
    // 初始化布局配置
    this.initLayout();
  }

  async initLayout(): Promise<void> {
    this.config = await getLayoutConfig();
  }

  async onConnect(): Promise<void> {
    if (!this.serverUrl.trim()) {
      this.errorMsg = '请输入服务器地址';
      return;
    }
    if (!this.matchId.trim()) {
      this.errorMsg = '请输入比赛ID';
      return;
    }

    this.isConnecting = true;
    this.errorMsg = '';

    try {
      await this.viewModel.connectToMatch(this.matchId.trim(), this.serverUrl.trim());
      router.pushUrl({ url: 'pages/MainPage' });
    } catch (e) {
      this.errorMsg = e instanceof Error ? e.message : '连接失败';
    } finally {
      this.isConnecting = false;
    }
  }

  async onLoadMatches(): Promise<void> {
    if (!this.serverUrl.trim()) {
      this.errorMsg = '请输入服务器地址';
      return;
    }

    this.isConnecting = true;
    this.errorMsg = '';

    try {
      this.viewModel.disconnect();
      this.viewModel['apiService']?.setBaseUrl?.(this.serverUrl.trim());
      await this.viewModel.loadMatches();
      this.availableMatches = this.viewModel.matchList.length;

      if (this.availableMatches > 0) {
        // 跳转到比赛列表页面
        router.pushUrl({ url: 'pages/MatchListPage' });
      } else {
        this.errorMsg = '未找到比赛';
      }
    } catch (e) {
      this.errorMsg = '加载比赛列表失败';
    } finally {
      this.isConnecting = false;
    }
  }

  build() {
    if (this.config.isLargeScreen) {
      // 大屏/平板/电脑：居中大卡片布局
      this.LargeScreenLayout()
    } else {
      // 手机：紧凑布局
      this.PhoneLayout()
    }
  }

  @Builder
  PhoneLayout() {
    Column() {
      // 顶部间距
      Row().height('8%')

      // Logo 和标题
      Text('🏆 EventControl')
        .fontSize(28)
        .fontWeight(FontWeight.Bold)
        .fontColor('#5AC8FA')

      Text('裁判端')
        .fontSize(16)
        .fontColor('#8A8A8A')
        .margin({ top: 4 })

      // 连接卡片
      Column() {
        // 服务器地址输入
        Text('服务器地址')
          .fontSize(14)
          .fontColor('#8A8A8A')
          .alignSelf(ItemAlign.Start)
          .margin({ bottom: 8 })

        TextInput({ text: this.serverUrl, placeholder: 'http://服务器IP:3001' })
          .width('100%')
          .height(48)
          .backgroundColor('#1C1C1E')
          .borderRadius(12)
          .padding({ left: 16 })
          .fontColor('#FFFFFF')
          .onChange((value: string) => {
            this.serverUrl = value;
          })

        // 比赛ID输入
        Text('比赛ID')
          .fontSize(14)
          .fontColor('#8A8A8A')
          .alignSelf(ItemAlign.Start)
          .margin({ top: 20, bottom: 8 })

        TextInput({ text: this.matchId, placeholder: '输入比赛ID' })
          .width('100%')
          .height(48)
          .backgroundColor('#1C1C1E')
          .borderRadius(12)
          .padding({ left: 16 })
          .fontColor('#FFFFFF')
          .onChange((value: string) => {
            this.matchId = value;
          })

        // 错误提示
        if (this.errorMsg) {
          Text(this.errorMsg)
            .fontSize(14)
            .fontColor('#FF3B30')
            .margin({ top: 12 })
            .width('100%')
            .textAlign(TextAlign.Center)
        }

        // 连接按钮
        Button(this.isConnecting ? '连接中...' : '连接比赛')
          .width('100%')
          .height(50)
          .backgroundColor(this.isConnecting ? '#666666' : '#5AC8FA')
          .borderRadius(25)
          .margin({ top: 32 })
          .fontSize(16)
          .fontColor('#FFFFFF')
          .enabled(!this.isConnecting)
          .onClick(() => this.onConnect())

        // 加载比赛列表按钮
        Button('从列表选择比赛')
          .width('100%')
          .height(50)
          .backgroundColor('#1C1C1E')
          .borderRadius(25)
          .margin({ top: 12 })
          .fontSize(14)
          .fontColor('#8A8A8A')
          .onClick(() => this.onLoadMatches())
      }
      .width('90%')
      .padding(24)
      .backgroundColor('#1C1C1E')
      .borderRadius(20)

      // 底部信息
      Text('支持多设备 · 离线模式')
        .fontSize(12)
        .fontColor('#666666')
        .margin({ top: 40, bottom: 20 })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#000000')
    .alignItems(HorizontalAlign.Center)
  }

  @Builder
  LargeScreenLayout() {
    Column() {
      Row() {
        // 左侧：欢迎区域
        Column() {
          Text('🏆 EventControl')
            .fontSize(36)
            .fontWeight(FontWeight.Bold)
            .fontColor('#5AC8FA')

          Text('专业裁判端')
            .fontSize(20)
            .fontColor('#8A8A8A')
            .margin({ top: 8 })

          Column() {
            this.FeatureItem('⚡', '实时同步', '毫秒级事件上报')
            this.FeatureItem('📱', '多设备支持', '手机/平板/电脑自适应')
            this.FeatureItem('🔄', '离线模式', '网络中断数据不丢失')
            this.FeatureItem('🎯', '多运动类型', '篮球/足球/排球等')
          }
          .margin({ top: 48 })
          .alignItems(HorizontalAlign.Start)
        }
        .width('45%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .alignItems(HorizontalAlign.Center)
        .padding(48)

        // 右侧：登录表单
        Column() {
          Text('连接比赛')
            .fontSize(24)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
            .alignSelf(ItemAlign.Start)

          Text('输入服务器地址和比赛ID开始裁判工作')
            .fontSize(14)
            .fontColor('#8A8A8A')
            .margin({ top: 8, bottom: 32 })
            .alignSelf(ItemAlign.Start)

          // 服务器地址输入
          Text('服务器地址')
            .fontSize(14)
            .fontColor('#8A8A8A')
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 8 })

          TextInput({ text: this.serverUrl, placeholder: 'http://192.168.1.100:3001' })
            .width('100%')
            .height(56)
            .backgroundColor('#1C1C1E')
            .borderRadius(12)
            .padding({ left: 16 })
            .fontColor('#FFFFFF')
            .fontSize(16)
            .onChange((value: string) => {
              this.serverUrl = value;
            })

          // 比赛ID输入
          Text('比赛ID')
            .fontSize(14)
            .fontColor('#8A8A8A')
            .alignSelf(ItemAlign.Start)
            .margin({ top: 24, bottom: 8 })

          TextInput({ text: this.matchId, placeholder: '输入比赛ID' })
            .width('100%')
            .height(56)
            .backgroundColor('#1C1C1E')
            .borderRadius(12)
            .padding({ left: 16 })
            .fontColor('#FFFFFF')
            .fontSize(16)
            .onChange((value: string) => {
              this.matchId = value;
            })

          // 错误提示
          if (this.errorMsg) {
            Text(this.errorMsg)
              .fontSize(14)
              .fontColor('#FF3B30')
              .margin({ top: 16 })
              .width('100%')
              .textAlign(TextAlign.Center)
          }

          // 按钮组
          Row() {
            Button(this.isConnecting ? '连接中...' : '连接比赛')
              .width('48%')
              .height(52)
              .backgroundColor(this.isConnecting ? '#666666' : '#5AC8FA')
              .borderRadius(26)
              .fontSize(16)
              .fontColor('#FFFFFF')
              .enabled(!this.isConnecting)
              .onClick(() => this.onConnect())

            Button('从列表选择')
              .width('48%')
              .height(52)
              .backgroundColor('#1C1C1E')
              .borderRadius(26)
              .fontSize(14)
              .fontColor('#FFFFFF')
              .onClick(() => this.onLoadMatches())
          }
          .width('100%')
          .margin({ top: 32 })
          .justifyContent(FlexAlign.SpaceBetween)
        }
        .width('40%')
        .height('100%')
        .padding(48)
        .justifyContent(FlexAlign.Center)
      }
      .width('100%')
      .height('100%')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#000000')
  }

  @Builder
  FeatureItem(emoji: string, title: string, desc: string) {
    Row() {
      Text(emoji)
        .fontSize(28)
        .width(48)

      Column() {
        Text(title)
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor('#FFFFFF')
        Text(desc)
          .fontSize(13)
          .fontColor('#8A8A8A')
          .margin({ top: 2 })
      }
      .alignItems(HorizontalAlign.Start)
    }
    .margin({ bottom: 20 })
  }
}
