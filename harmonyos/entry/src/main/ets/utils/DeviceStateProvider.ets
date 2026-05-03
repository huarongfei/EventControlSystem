// DeviceStateProvider - 设备状态管理提供者
import { LayoutConfig, DeviceType, getLayoutConfig, getDeviceType, getCurrentBreakpoint, Breakpoint, foldStateManager } from './DeviceInfo';

// 设备状态观察者接口
export interface DeviceStateObserver {
  onDeviceStateChange(state: DeviceState): void;
}

// 全局设备状态
export class DeviceState {
  config: LayoutConfig;
  deviceType: DeviceType;
  breakpoint: Breakpoint;
  isUnfolded: boolean;
  screenWidth: number;
  screenHeight: number;

  constructor() {
    this.config = {
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
    this.deviceType = DeviceType.PHONE;
    this.breakpoint = Breakpoint.SM;
    this.isUnfolded = false;
    this.screenWidth = 360;
    this.screenHeight = 780;
  }

  async update(): Promise<void> {
    this.config = await getLayoutConfig();
    this.deviceType = await getDeviceType();
    this.breakpoint = await getCurrentBreakpoint();
    this.isUnfolded = foldStateManager.getCurrentState();
  }
}

// 设备状态管理器
class DeviceStateManager {
  private state: DeviceState = new DeviceState();
  private observers: DeviceStateObserver[] = [];
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.state.update();
    await foldStateManager.startListening();

    // 监听折叠状态变化
    foldStateManager.addListener(async (isUnfolded: boolean) => {
      await this.state.update();
      this.notifyObservers();
    });

    this.isInitialized = true;
  }

  getState(): DeviceState {
    return this.state;
  }

  async refresh(): Promise<void> {
    await this.state.update();
    this.notifyObservers();
  }

  addObserver(observer: DeviceStateObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  removeObserver(observer: DeviceStateObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => {
      observer.onDeviceStateChange(this.state);
    });
  }
}

// 全局实例
export const deviceStateManager = new DeviceStateManager();

// ============================================
// 应用级状态存储（AppStorage）
// ============================================

// AppStorage 键名
export const DeviceStateKeys = {
  IS_LARGE_SCREEN: 'device_is_large_screen',
  IS_TABLET: 'device_is_tablet',
  IS_DESKTOP: 'device_is_desktop',
  IS_LANDSCAPE: 'device_is_landscape',
  BREAKPOINT: 'device_breakpoint',
  LAYOUT_CONFIG: 'device_layout_config'
} as const;

// 同步到 AppStorage（供 @StorageProp 使用）
export function syncToAppStorage(state: DeviceState): void {
  try {
    AppStorage.setOrCreate('device_is_large_screen', state.config.isLargeScreen);
    AppStorage.setOrCreate('device_is_tablet', state.config.isTablet);
    AppStorage.setOrCreate('device_is_desktop', state.config.isDesktop);
    AppStorage.setOrCreate('device_is_landscape', state.config.isLandscape);
    AppStorage.setOrCreate('device_breakpoint', state.breakpoint);
  } catch (e) {
    console.warn('Failed to sync to AppStorage:', e);
  }
}
