// DeviceInfo.ets - 设备信息与响应式布局
import window from '@kit.ArkUI';

/** 设备类型枚举 */
export enum DeviceType {
  PHONE = 'phone',
  TABLET = 'tablet',
  FOLDABLE = 'foldable',
  PC = 'pc'
}

/** 断点定义 */
export enum Breakpoint {
  SM = 320,    // 小屏手机
  MD = 520,    // 普通手机 / 折叠屏折叠态
  LG = 840,    // 折叠屏展开态 / 平板
  XL = 1200    // 大平板 / 电脑
}

/** 响应式尺寸配置 */
export interface ResponsiveConfig {
  padding: Length;
  fontSize: Length;
  iconSize: Length;
  buttonHeight: Length;
  cardRadius: Length;
  columnGap: Length;
  rowGap: Length;
}

// 模块级变量替代类的静态属性
let currentBreakpointValue: Breakpoint = Breakpoint.MD;
let currentDeviceTypeValue: DeviceType = DeviceType.PHONE;
let listeners: Array<(bp: Breakpoint) => void> = [];

/** 响应式布局工具函数 */
export class ResponsiveLayout {
  /** 获取当前断点 */
  static getBreakpoint(): Breakpoint {
    return currentBreakpointValue;
  }

  /** 获取当前设备类型 */
  static getDeviceType(): DeviceType {
    return currentDeviceTypeValue;
  }

  /** 是否是大屏设备（折叠屏展开态/平板/电脑） */
  static isLargeScreen(): boolean {
    return currentBreakpointValue >= Breakpoint.LG;
  }

  /** 获取响应式配置 */
  static getConfig(): ResponsiveConfig {
    const isLarge = currentBreakpointValue >= Breakpoint.LG;
    return {
      padding: isLarge ? 32 : 16,
      fontSize: isLarge ? 20 : 16,
      iconSize: isLarge ? 28 : 24,
      buttonHeight: isLarge ? 56 : 48,
      cardRadius: isLarge ? 16 : 12,
      columnGap: isLarge ? 24 : 16,
      rowGap: isLarge ? 16 : 12
    };
  }

  /** 更新断点（根据屏幕宽度） */
  static updateBreakpoint(width: number): Breakpoint {
    let newBreakpoint: Breakpoint;
    
    if (width < Breakpoint.MD) {
      newBreakpoint = Breakpoint.SM;
      currentDeviceTypeValue = DeviceType.PHONE;
    } else if (width < Breakpoint.LG) {
      newBreakpoint = Breakpoint.MD;
      currentDeviceTypeValue = DeviceType.PHONE;
    } else if (width < Breakpoint.XL) {
      newBreakpoint = Breakpoint.LG;
      currentDeviceTypeValue = DeviceType.TABLET;
    } else {
      newBreakpoint = Breakpoint.XL;
      currentDeviceTypeValue = DeviceType.PC;
    }

    if (newBreakpoint !== currentBreakpointValue) {
      currentBreakpointValue = newBreakpoint;
      notifyAllListeners(newBreakpoint);
    }

    return newBreakpoint;
  }

  /** 监听断点变化 */
  static addBreakpointListener(listener: (bp: Breakpoint) => void): void {
    listeners.push(listener);
  }

  /** 移除监听 */
  static removeBreakpointListener(listener: (bp: Breakpoint) => void): void {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /** 获取断点名称 */
  static getBreakpointName(): string {
    switch (currentBreakpointValue) {
      case Breakpoint.SM:
        return 'SM';
      case Breakpoint.MD:
        return 'MD';
      case Breakpoint.LG:
        return 'LG';
      case Breakpoint.XL:
        return 'XL';
    }
  }
}

/** 通知所有监听器 */
function notifyAllListeners(bp: Breakpoint): void {
  for (let i = 0; i < listeners.length; i++) {
    listeners[i](bp);
  }
}
