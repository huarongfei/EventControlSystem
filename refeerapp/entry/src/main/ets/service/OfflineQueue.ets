// OfflineQueue.ets - 离线事件队列
import { MatchEvent, EventType } from '../model/MatchModels';
import { storageService, StorageKey } from './StorageService';

/** 离线队列服务类 */
class OfflineQueue {
  private queue: MatchEvent[] = [];
  private readonly QUEUE_KEY = 'offline_queue';
  private isOnline: boolean = true;

  /** 初始化，从存储恢复未同步的事件 */
  async init(): Promise<void> {
    try {
      // 检查网络状态
      this.isOnline = await this.checkNetwork();
      
      // 从存储恢复队列数据
      const savedData = await storageService.getString(StorageKey.OFFLINE_QUEUE);
      if (savedData) {
        try {
          this.queue = JSON.parse(savedData) as MatchEvent[];
          // 确保队列中的事件都有正确的类型
          this.queue = this.queue.map(event => ({
            ...event,
            timestamp: event.timestamp || Date.now(),
            synced: event.synced || false
          }));
        } catch (parseError) {
          console.error('解析离线队列数据失败:', parseError);
          this.queue = [];
        }
      }
    } catch (error) {
      console.error('初始化离线队列失败:', error);
      this.queue = [];
    }
  }

  /** 检查网络状态 */
  private async checkNetwork(): Promise<boolean> {
    // 网络状态检查由外部管理
    return this.isOnline;
  }

  /** 添加事件到队列 */
  async addEvent(event: MatchEvent): Promise<void> {
    if (!event.id) {
      event.id = Date.now().toString() + Math.random().toString(36).slice(2);
    }
    event.timestamp = Date.now();
    event.synced = false;
    this.queue.push(event);
    await this.saveQueue();
  }

  /** 获取队列中所有未同步事件 */
  getPendingEvents(): MatchEvent[] {
    return this.queue.filter(e => !e.synced);
  }

  /** 标记事件已同步 */
  markSynced(eventId: string): void {
    const event = this.queue.find(e => e.id === eventId);
    if (event) {
      event.synced = true;
    }
    // 移除已同步的事件
    this.queue = this.queue.filter(e => !e.synced);
    this.saveQueue();
  }

  /** 清除队列 */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /** 保存队列到本地存储 */
  private async saveQueue(): Promise<void> {
    try {
      // 使用 StorageService 保存队列数据
      const dataStr = JSON.stringify(this.queue);
      await storageService.setString(StorageKey.OFFLINE_QUEUE, dataStr);
    } catch (error) {
      console.error('保存离线队列失败:', error);
      // 保存失败，但队列仍然在内存中
    }
  }

  /** 设置在线状态 */
  setOnline(online: boolean): void {
    this.isOnline = online;
  }

  /** 获取当前在线状态 */
  getOnline(): boolean {
    return this.isOnline;
  }
}

/** 导出单例 */
export const offlineQueue = new OfflineQueue();