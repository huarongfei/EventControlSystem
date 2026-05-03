// ResponsiveComponents - 响应式布局组件集合
import { LayoutConfig, getLayoutConfig, Breakpoint } from './DeviceInfo';

// ============================================
// 响应式容器组件
// ============================================

// 主布局容器 - 根据屏幕尺寸自动调整
@Component
export struct ResponsiveContainer {
  @Prop config: LayoutConfig;
  @BuilderParam defaultContent: () => void;

  build() {
    Column() {
      this.defaultContent()
    }
    .width('100%')
    .height('100%')
    .padding(this.config.padding)
    .backgroundColor('#000000')
  }
}

// 分栏布局容器 - 大屏时分栏，小屏时纵向堆叠
@Component
export struct SplitContainer {
  @Prop config: LayoutConfig;
  @BuilderParam leftPanel: () => void;
  @BuilderParam rightPanel: () => void;

  build() {
    if (this.config.isLargeScreen) {
      // 大屏：水平分栏
      Row() {
        Column() {
          this.leftPanel()
        }
        .width('50%')
        .height('100%')
        .padding({ right: this.config.gutter / 2 })

        Column() {
          this.rightPanel()
        }
        .width('50%')
        .height('100%')
        .padding({ left: this.config.gutter / 2 })
      }
      .width('100%')
      .height('100%')
    } else {
      // 小屏：垂直堆叠
      Column() {
        this.leftPanel()
      }
      .width('100%')

      Column() {
        this.rightPanel()
      }
      .width('100%')
    }
  }
}

// 侧边栏布局 - 大屏显示侧边栏，小屏隐藏
@Component
export struct SidebarLayout {
  @Prop config: LayoutConfig;
  @Prop showSidebar: boolean = true;
  @State sidebarWidth: string = '280vp';
  @BuilderParam sidebar: () => void;
  @BuilderParam mainContent: () => void;

  build() {
    if (this.config.isLargeScreen && this.showSidebar) {
      Row() {
        // 侧边栏
        Column() {
          this.sidebar()
        }
        .width(this.sidebarWidth)
        .height('100%')

        Divider()
          .width('1vp')
          .height('100%')
          .backgroundColor('#333333')

        // 主内容区
        Column() {
          this.mainContent()
        }
        .layoutWeight(1)
        .height('100%')
      }
      .width('100%')
      .height('100%')
    } else {
      // 小屏模式：只显示主内容
      Column() {
        this.mainContent()
      }
      .width('100%')
      .height('100%')
    }
  }
}

// ============================================
// 响应式卡片组件
// ============================================

// 通用卡片容器
@Component
export struct ResponsiveCard {
  @Prop config: LayoutConfig;
  @Prop title: string = '';
  @Prop cardPadding: number = 16;
  @BuilderParam content: () => void;

  build() {
    Column() {
      if (this.title) {
        Text(this.title)
          .fontSize(16 * this.config.fontScale)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .alignSelf(ItemAlign.Start)
          .margin({ bottom: 12 })
      }

      this.content()
    }
    .width('100%')
    .padding(this.cardPadding)
    .backgroundColor('#1C1C1E')
    .borderRadius(16)
  }
}

// 事件卡片（用于列表）
@Component
export struct EventCard {
  @Prop config: LayoutConfig;
  @BuilderParam icon: () => void;
  @Prop title: string;
  @Prop subtitle: string;
  @Prop time: string;
  @Prop eventColor: string = '#5AC8FA';

  build() {
    Row() {
      // 图标区域
      Column() {
        this.icon()
      }
      .width(this.config.isLargeScreen ? 56 : 44)
      .height(this.config.isLargeScreen ? 56 : 44)
      .backgroundColor(this.eventColor + '20')
      .borderRadius(12)
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)

      // 文字区域
      Column() {
        Text(this.title)
          .fontSize(15 * this.config.fontScale)
          .fontColor('#FFFFFF')
        Text(this.subtitle)
          .fontSize(12 * this.config.fontScale)
          .fontColor('#8A8A8A')
          .margin({ top: 2 })
      }
      .alignItems(HorizontalAlign.Start)
      .margin({ left: 12 })
      .layoutWeight(1)

      // 时间
      Text(this.time)
        .fontSize(12 * this.config.fontScale)
        .fontColor('#8A8A8A')
    }
    .width('100%')
    .padding(12)
    .backgroundColor('#1C1C1E')
    .borderRadius(12)
    .margin({ bottom: 8 })
  }
}

// ============================================
// 响应式按钮组件
// ============================================

// 操作按钮
@Component
export struct ActionButton {
  @Prop config: LayoutConfig;
  @Prop text: string;
  @Prop emoji: string;
  @Prop color: string;
  @Prop disabled: boolean = false;
  onClick: () => void;

  build() {
    Button() {
      Column() {
        Text(this.emoji)
          .fontSize(this.config.isLargeScreen ? 28 : 24)
        Text(this.text)
          .fontSize(12 * this.config.fontScale)
          .fontColor('#FFFFFF')
          .margin({ top: 4 })
      }
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Center)
      .width('100%')
      .height('100%')
    }
    .width(this.config.isLargeScreen ? '100%' : 140)
    .height(this.config.isLargeScreen ? 80 : 64)
    .backgroundColor(this.disabled ? '#666666' : this.color)
    .borderRadius(12)
    .shadow({
      radius: 8,
      color: this.disabled ? '#00000000' : this.color + '40',
      offsetX: 0,
      offsetY: 4
    })
    .enabled(!this.disabled)
    .onClick(this.onClick)
  }
}

// 得分按钮
@Component
export struct ScoreButton {
  @Prop config: LayoutConfig;
  @Prop points: number;
  @Prop teamName: string;
  @Prop color: string = '#5AC8FA';
  @Prop disabled: boolean = false;
  onClick: () => void;

  build() {
    Button() {
      Text(`${this.points}分`)
        .fontSize(this.config.isLargeScreen ? 24 : 20)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFFFFF')
    }
    .width(this.config.isLargeScreen ? 120 : 100)
    .height(this.config.isLargeScreen ? 72 : 64)
    .backgroundColor(this.disabled ? '#666666' : this.color)
    .borderRadius(12)
    .shadow({
      radius: 8,
      color: this.disabled ? '#00000000' : this.color + '40',
      offsetX: 0,
      offsetY: 4
    })
    .enabled(!this.disabled)
    .onClick(this.onClick)
  }
}

// ============================================
// 响应式表单组件
// ============================================

// 输入框
@Component
export struct ResponsiveInput {
  @Prop config: LayoutConfig;
  @Prop label: string;
  @State value: string = '';
  @Prop placeholder: string = '';
  @Prop secure: boolean = false;
  onChange: (value: string) => void;

  build() {
    Column() {
      Text(this.label)
        .fontSize(14 * this.config.fontScale)
        .fontColor('#8A8A8A')
        .alignSelf(ItemAlign.Start)
        .margin({ bottom: 8 })

      TextInput({ text: this.value, placeholder: this.placeholder })
        .width('100%')
        .height(this.config.isLargeScreen ? 56 : 48)
        .backgroundColor('#1C1C1E')
        .borderRadius(12)
        .padding({ left: 16, right: 16 })
        .fontSize(16 * this.config.fontScale)
        .type(this.secure ? InputType.Password : InputType.Normal)
        .onChange((val: string) => {
          this.value = val;
          this.onChange(val);
        })
    }
    .width('100%')
  }
}

// 响应式输入区域
@Component
export struct ResponsiveInputArea {
  @Prop config: LayoutConfig;
  @Prop label: string;
  @State value: string = '';
  @Prop placeholder: string = '';
  @Prop rows: number = 3;
  onChange: (value: string) => void;

  build() {
    Column() {
      Text(this.label)
        .fontSize(14 * this.config.fontScale)
        .fontColor('#8A8A8A')
        .alignSelf(ItemAlign.Start)
        .margin({ bottom: 8 })

      TextArea({ text: this.value, placeholder: this.placeholder })
        .width('100%')
        .height(this.rows * (this.config.isLargeScreen ? 28 : 24))
        .backgroundColor('#1C1C1E')
        .borderRadius(12)
        .padding(12)
        .fontSize(16 * this.config.fontScale)
        .onChange((val: string) => {
          this.value = val;
          this.onChange(val);
        })
    }
    .width('100%')
  }
}

// ============================================
// 响应式状态指示器
// ============================================

// 连接状态徽章
@Component
export struct ConnectionBadge {
  @Prop config: LayoutConfig;
  @Prop isConnected: boolean;

  build() {
    Row() {
      Text(this.isConnected ? '🟢 在线' : '🔴 离线')
        .fontSize(12 * this.config.fontScale)
        .fontColor(this.isConnected ? '#34C759' : '#FF3B30')
    }
    .padding({
      left: this.config.isLargeScreen ? 12 : 8,
      right: this.config.isLargeScreen ? 12 : 8,
      top: this.config.isLargeScreen ? 6 : 4,
      bottom: this.config.isLargeScreen ? 6 : 4
    })
    .backgroundColor(this.isConnected ? '#34C75920' : '#FF3B3020')
    .borderRadius(8)
  }
}

// 离线横幅
@Component
export struct OfflineBanner {
  @Prop config: LayoutConfig;
  @Prop pendingCount: number = 0;
  onSync: () => void;

  build() {
    Row() {
      Text('⚠️ 离线模式')
        .fontSize(13 * this.config.fontScale)
        .fontColor('#FFFFFF')

      if (this.pendingCount > 0) {
        Text(`(${this.pendingCount}条待同步)`)
          .fontSize(12 * this.config.fontScale)
          .fontColor('#FFD700')
          .margin({ left: 4 })
      }

      Blank()

      Text('同步')
        .fontSize(13 * this.config.fontScale)
        .fontColor('#5AC8FA')
        .onClick(this.onSync)
    }
    .width('100%')
    .height(44)
    .backgroundColor('#FF9500')
    .padding({ left: 16, right: 16 })
    .justifyContent(FlexAlign.Start)
    .alignItems(VerticalAlign.Center)
  }
}

// ============================================
// 响应式标题栏
// ============================================

// 页面标题
@Component
export struct PageTitle {
  @Prop config: LayoutConfig;
  @Prop title: string;
  @Prop subtitle: string = '';
  @BuilderParam action?: () => void;

  build() {
    Row() {
      Column() {
        Text(this.title)
          .fontSize(this.config.isLargeScreen ? 24 : 20)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')

        if (this.subtitle) {
          Text(this.subtitle)
            .fontSize(14 * this.config.fontScale)
            .fontColor('#8A8A8A')
            .margin({ top: 4 })
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      if (this.action) {
        this.action()
      }
    }
    .width('100%')
    .margin({ bottom: 16 })
  }
}

// ============================================
// 响应式列表
// ============================================

// 空状态视图
@Component
export struct EmptyState {
  @Prop config: LayoutConfig;
  @Prop emoji: string;
  @Prop message: string;
  @BuilderParam action?: () => void;

  build() {
    Column() {
      Text(this.emoji)
        .fontSize(this.config.isLargeScreen ? 64 : 48)

      Text(this.message)
        .fontSize(14 * this.config.fontScale)
        .fontColor('#8A8A8A')
        .margin({ top: 12 })

      if (this.action) {
        this.action()
          .margin({ top: 16 })
      }
    }
    .width('100%')
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .height('100%')
  }
}

// ============================================
// 布局构建器
// ============================================

// 网格布局 Builder
@Component
export struct GridLayout {
  @Prop config: LayoutConfig;
  @BuilderParam items: () => void;

  build() {
    if (this.config.columns <= 1) {
      Column() {
        this.items()
      }
      .width('100%')
    } else {
      Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.SpaceEvenly }) {
        this.items()
      }
      .width('100%')
    }
  }
}

// 按钮组 Builder
@Component
export struct ButtonGroup {
  @Prop config: LayoutConfig;
  @BuilderParam buttons: () => void;

  build() {
    if (this.config.columns <= 1) {
      // 垂直排列
      Column() {
        this.buttons()
      }
      .width('100%')
      .alignItems(HorizontalAlign.Center)
    } else {
      // 水平排列
      Row() {
        this.buttons()
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceEvenly)
    }
  }
}
