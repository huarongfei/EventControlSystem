// DeviceInfo - 设备信息与响应式布局工具
import display from '@ohos.display';
import window from '@ohos.window';
import { AsyncCallback } from '@kit.BasicServicesKit';

// 设备类型枚举
export enum DeviceType {
  PHONE = 'phone',           // 手机（竖屏）
  PHONE_LANDSCAPE = 'phone_landscape',  // 手机（横屏）
  FOLDABLE_FOLDED = 'foldable_folded',  // 折叠屏（折叠态）
  FOLDABLE_UNFOLDED = 'foldable_unfolded', // 折叠屏（展开态）
  TABLET = 'tablet',         // 平板
  PC = '2in1'               // 鸿蒙电脑/二合一设备
}

// 断点定义（单位：vp）
export enum Breakpoint {
  SM = 320,     // 小屏手机
  MD = 520,     // 普通手机/折叠屏折叠态
  LG = 840,     // 大屏手机/折叠屏展开态
  XL = 1200    // 平板/电脑
}

// 布局配置
export interface LayoutConfig {
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isLargeScreen: boolean;
  columns: number;
  gutter: number;
  padding: number;
  cardWidth: string;
  fontScale: number;
}

// 获取当前设备类型
export async function getDeviceType(): Promise<DeviceType> {
  try {
    const displayInfo = await display.getDefaultDisplaySync();
    const width = displayInfo.width / displayInfo.densityDPI * 160; // 转换为 vp
    const height = displayInfo.height / displayInfo.densityDPI * 160;
    const aspectRatio = width / height;

    // 判断是否为折叠屏（需要监听折叠状态）
    const isLarge = width >= Breakpoint.LG;

    if (aspectRatio > 1) {
      // 横屏模式
      if (width >= Breakpoint.XL) {
        return DeviceType.PC;
      } else if (width >= Breakpoint.LG) {
        return DeviceType.TABLET;
      } else {
        return DeviceType.PHONE_LANDSCAPE;
      }
    } else {
      // 竖屏模式
      if (width >= Breakpoint.XL) {
        return DeviceType.TABLET;
      } else if (width >= Breakpoint.LG) {
        return DeviceType.FOLDABLE_UNFOLDED;
      } else if (width >= Breakpoint.MD) {
        return DeviceType.FOLDABLE_FOLDED;
      } else {
        return DeviceType.PHONE;
      }
    }
  } catch (e) {
    return DeviceType.PHONE;
  }
}

// 获取当前断点
export async function getCurrentBreakpoint(): Promise<Breakpoint> {
  try {
    const displayInfo = await display.getDefaultDisplaySync();
    const width = displayInfo.width / displayInfo.densityDPI * 160;

    if (width >= Breakpoint.XL) return Breakpoint.XL;
    if (width >= Breakpoint.LG) return Breakpoint.LG;
    if (width >= Breakpoint.MD) return Breakpoint.MD;
    return Breakpoint.SM;
  } catch (e) {
    return Breakpoint.MD;
  }
}

// 获取布局配置
export async function getLayoutConfig(): Promise<LayoutConfig> {
  const deviceType = await getDeviceType();
  const breakpoint = await getCurrentBreakpoint();

  const isPhone = deviceType === DeviceType.PHONE || deviceType === DeviceType.PHONE_LANDSCAPE;
  const isTablet = deviceType === DeviceType.TABLET || deviceType === DeviceType.FOLDABLE_UNFOLDED;
  const isDesktop = deviceType === DeviceType.PC;
  const isLandscape = deviceType === DeviceType.PHONE_LANDSCAPE;
  const isLargeScreen = isTablet || isDesktop;

  // 根据设备类型确定列数
  let columns = 1;
  let gutter = 12;
  let padding = 16;
  let cardWidth = '90%';
  let fontScale = 1.0;

  if (isDesktop) {
    columns = 3;
    gutter = 24;
    padding = 32;
    cardWidth = '100%';
    fontScale = 1.15;
  } else if (isTablet) {
    columns = 2;
    gutter = 20;
    padding = 24;
    cardWidth = '100%';
    fontScale = 1.1;
  } else if (isLandscape) {
    columns = 2;
    gutter = 16;
    padding = 20;
    cardWidth = '45%';
    fontScale = 1.0;
  }

  return {
    isPhone,
    isTablet,
    isDesktop,
    isLandscape,
    isLargeScreen,
    columns,
    gutter,
    padding,
    cardWidth,
    fontScale
  };
}

// 获取窗口尺寸信息
export interface WindowSize {
  width: number;
  height: number;
  density: number;
  densityDPI: number;
}

export async function getWindowSize(): Promise<WindowSize> {
  try {
    const displayInfo = await display.getDefaultDisplaySync();
    return {
      width: displayInfo.width,
      height: displayInfo.height,
      density: displayInfo.density,
      densityDPI: displayInfo.densityDPI
    };
  } catch (e) {
    return {
      width: 360,
      height: 780,
      density: 2.0,
      densityDPI: 320
    };
  }
}

// 屏幕方向
export enum ScreenOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
  UNKNOWN = 'unknown'
}

export async function getScreenOrientation(): Promise<ScreenOrientation> {
  try {
    const displayInfo = await display.getDefaultDisplaySync();
    const orientation = displayInfo.orientation;

    if (orientation === display.Orientation.PORTRAIT || orientation === display.Orientation.PORTRAIT_INVERTED) {
      return ScreenOrientation.PORTRAIT;
    } else {
      return ScreenOrientation.LANDSCAPE;
    }
  } catch (e) {
    return ScreenOrientation.UNKNOWN;
  }
}

// 折叠屏状态监听器
export type FoldStateCallback = (isUnfolded: boolean) => void;

class FoldStateManager {
  private listeners: FoldStateCallback[] = [];
  private currentState: boolean = false;
  private isListening: boolean = false;

  async startListening(): Promise<void> {
    if (this.isListening) return;

    try {
      // 获取初始折叠状态
      const displayInfo = await display.getDefaultDisplaySync();
      const width = displayInfo.width / displayInfo.densityDPI * 160;
      this.currentState = width >= Breakpoint.LG;

      // 监听屏幕折叠状态变化
      display.on('change', (data) => {
        this.handleDisplayChange();
      });

      this.isListening = true;
    } catch (e) {
      console.error('Failed to start fold state listening:', e);
    }
  }

  private async handleDisplayChange(): Promise<void> {
    const displayInfo = await display.getDefaultDisplaySync();
    const width = displayInfo.width / displayInfo.densityDPI * 160;
    const isUnfolded = width >= Breakpoint.LG;

    if (isUnfolded !== this.currentState) {
      this.currentState = isUnfolded;
      this.notifyListeners(isUnfolded);
    }
  }

  private notifyListeners(isUnfolded: boolean): void {
    this.listeners.forEach(callback => callback(isUnfolded));
  }

  addListener(callback: FoldStateCallback): void {
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  removeListener(callback: FoldStateCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  getCurrentState(): boolean {
    return this.currentState;
  }
}

export const foldStateManager = new FoldStateManager();

// 响应式数值工具
export function responsiveValue(phone: number, tablet: number, desktop: number, config: LayoutConfig): number {
  if (config.isDesktop) return desktop;
  if (config.isTablet) return tablet;
  return phone;
}

export function responsiveString(phone: string, tablet: string, desktop: string, config: LayoutConfig): string {
  if (config.isDesktop) return desktop;
  if (config.isTablet) return tablet;
  return phone;
}

// 栅格布局帮助类
export class GridHelper {
  constructor(private config: LayoutConfig) {}

  // 获取列宽百分比
  getColumnWidth(columnSpan: number = 1): string {
    const totalGutter = this.config.gutter * (this.config.columns - 1);
    const availableWidth = 100 - (this.config.padding * 2 / (this.config.isLargeScreen ? 1 : 10));
    const columnWidth = (availableWidth - totalGutter) / this.config.columns * columnSpan;
    return `${columnWidth}%`;
  }

  // 获取间距
  getGutter(): number {
    return this.config.gutter;
  }

  getPadding(): number {
    return this.config.padding;
  }

  // 是否应该显示网格视图
  shouldUseGrid(): boolean {
    return this.config.columns > 1;
  }
}
