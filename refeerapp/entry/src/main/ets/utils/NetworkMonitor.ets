// NetworkMonitor.ets - 网络状态监控工具
import connection from '@ohos.net.connection';

/** 网络类型 */
export enum NetworkType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  UNKNOWN = 'unknown',
  NONE = 'none'
}

/** 网络状态 */
export interface NetworkStatus {
  isConnected: boolean;
  networkType: NetworkType;
  isMetered: boolean;
}

/** 网络状态变更监听器 */
export type NetworkStatusListener = (status: NetworkStatus) => void;

/** 网络监控类 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: NetworkStatusListener[] = [];
  private netConnection: connection.NetConnection | null = null;
  private currentStatus: NetworkStatus = {
    isConnected: false,
    networkType: NetworkType.NONE,
    isMetered: false
  };

  /** 获取单例 */
  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  /** 开始监控网络状态 */
  startMonitoring(): void {
    try {
      // 创建网络连接对象
      this.netConnection = connection.createNetConnection();

      // 监听网络可用性变化
      this.netConnection.on('netAvailable', () => {
        this.updateNetworkStatus();
      });

      // 监听网络不可用
      this.netConnection.on('netUnavailable', () => {
        this.currentStatus = {
          isConnected: false,
          networkType: NetworkType.NONE,
          isMetered: false
        };
        this.notifyListeners();
      });

      // 监听网络能力变化
      this.netConnection.on('netCapabilitiesChange', (data: connection.NetCapabilityInfo) => {
        this.parseNetworkCapabilities(data);
      });

      // 注册网络监听
      this.netConnection.register((err) => {
        if (err) {
          console.error('网络监听注册失败:', err);
        } else {
          console.log('网络监听已启动');
        }
      });

      // 获取初始状态
      this.updateNetworkStatus();
    } catch (err) {
      console.error('启动网络监控失败:', err);
    }
  }

  /** 停止监控 */
  stopMonitoring(): void {
    if (this.netConnection) {
      this.netConnection.unregister((err) => {
        if (err) {
          console.error('取消网络监听失败:', err);
        }
      });
      this.netConnection = null;
    }
  }

  /** 更新网络状态 */
  private async updateNetworkStatus(): Promise<void> {
    try {
      const netHandle = connection.getDefaultNetSync();
      if (!netHandle) {
        this.currentStatus = {
          isConnected: false,
          networkType: NetworkType.NONE,
          isMetered: false
        };
        this.notifyListeners();
        return;
      }

      const capabilities = connection.getNetCapabilitiesSync(netHandle);
      const capInfo: connection.NetCapabilityInfo = { netHandle: netHandle, netCap: capabilities };
      this.parseNetworkCapabilities(capInfo);
    } catch (err) {
      console.error('获取网络状态失败:', err);
    }
  }

  /** 解析网络能力 */
  private parseNetworkCapabilities(data: connection.NetCapabilityInfo): void {
    try {
      const capabilities = data.netCap;

      // 判断网络类型
      let networkType = NetworkType.UNKNOWN;
      if (capabilities.bearerTypes) {
        if (capabilities.bearerTypes.includes(0)) {
          networkType = NetworkType.CELLULAR;
        } else if (capabilities.bearerTypes.includes(1)) {
          networkType = NetworkType.WIFI;
        } else if (capabilities.bearerTypes.includes(3)) {
          networkType = NetworkType.ETHERNET;
        }
      }

      this.currentStatus = {
        isConnected: true,
        networkType: networkType,
        isMetered: capabilities.networkCap?.includes(11) || false
      };

      this.notifyListeners();
    } catch (err) {
      console.error('解析网络能力失败:', err);
    }
  }

  /** 添加监听器 */
  addListener(listener: NetworkStatusListener): void {
    this.listeners.push(listener);
    // 立即通知当前状态
    listener(this.currentStatus);
  }

  /** 移除监听器 */
  removeListener(listener: NetworkStatusListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /** 通知所有监听器 */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentStatus);
    }
  }

  /** 获取当前网络状态 */
  getCurrentStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /** 是否已连接 */
  isConnected(): boolean {
    return this.currentStatus.isConnected;
  }

  /** 是否使用WiFi */
  isWifi(): boolean {
    return this.currentStatus.networkType === NetworkType.WIFI;
  }

  /** 是否使用移动数据 */
  isCellular(): boolean {
    return this.currentStatus.networkType === NetworkType.CELLULAR;
  }
}

/** 导出单例 */
export const networkMonitor = NetworkMonitor.getInstance();
