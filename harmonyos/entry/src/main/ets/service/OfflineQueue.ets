// OfflineQueue - 离线事件队列（类似 Android OfflineQueue）
import { MatchEvent, EventType } from '../model/MatchModels';
import dataPreferences from '@ohos.data.preferences';

const QUEUE_KEY = 'offline_queue';
const PREFERENCES_NAME = 'offline_queue_config';
let preferences: dataPreferences.Preferences | null = null;

export class OfflineQueue {
  private context: any;

  constructor(context: any) {
    this.context = context;
    this.initPreferences();
  }

  private async initPreferences(): Promise<void> {
    try {
      preferences = await dataPreferences.getPreferences(this.context, PREFERENCES_NAME);
    } catch (e) {
      console.error('Init offline queue preferences failed:', e);
    }
  }

  async addEvent(event: MatchEvent): Promise<void> {
    try {
      const queue = await this.getQueue();
      queue.push(event);
      await this.saveQueue(queue);
    } catch (e) {
      console.error('Add event to queue failed:', e);
    }
  }

  async getQueue(): Promise<MatchEvent[]> {
    try {
      const json = await preferences?.get(QUEUE_KEY, '[]') as string;
      return JSON.parse(json);
    } catch (e) {
      return [];
    }
  }

  async removeEvents(ids: string[]): Promise<void> {
    try {
      let queue = await this.getQueue();
      queue = queue.filter(e => !ids.includes(e.id));
      await this.saveQueue(queue);
    } catch (e) {
      console.error('Remove events failed:', e);
    }
  }

  async clear(): Promise<void> {
    try {
      await preferences?.put(QUEUE_KEY, '[]');
      await preferences?.flush();
    } catch (e) {
      console.error('Clear queue failed:', e);
    }
  }

  private async saveQueue(queue: MatchEvent[]): Promise<void> {
    try {
      await preferences?.put(QUEUE_KEY, JSON.stringify(queue));
      await preferences?.flush();
    } catch (e) {
      console.error('Save queue failed:', e);
    }
  }
}
