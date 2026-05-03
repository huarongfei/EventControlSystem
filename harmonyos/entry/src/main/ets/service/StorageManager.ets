// StorageManager - 封装 Preferences 存储（类似 Android DataStore）
import dataPreferences from '@ohos.data.preferences';
import { BusinessError } from '@ohos.base';

const PREFERENCES_NAME = 'referee_config';
const KEY_SERVER_URL = 'server_url';
const KEY_MATCH_ID = 'match_id';
const KEY_DEVICE_ID = 'device_id';

let preferences: dataPreferences.Preferences | null = null;

export class StorageManager {
  private context: any;

  constructor(context: any) {
    this.context = context;
    this.initPreferences();
  }

  private async initPreferences(): Promise<void> {
    try {
      preferences = await dataPreferences.getPreferences(this.context, PREFERENCES_NAME);
    } catch (e) {
      console.error('Init preferences failed:', e);
    }
  }

  async saveServerUrl(url: string): Promise<void> {
    try {
      await preferences?.put(KEY_SERVER_URL, url);
      await preferences?.flush();
    } catch (e) {
      console.error('Save server url failed:', e);
    }
  }

  async getServerUrl(): Promise<string> {
    try {
      return await preferences?.get(KEY_SERVER_URL, '') as string || '';
    } catch (e) {
      return '';
    }
  }

  async saveMatchId(matchId: string): Promise<void> {
    try {
      await preferences?.put(KEY_MATCH_ID, matchId);
      await preferences?.flush();
    } catch (e) {
      console.error('Save match id failed:', e);
    }
  }

  async getMatchId(): Promise<string> {
    try {
      return await preferences?.get(KEY_MATCH_ID, '') as string || '';
    } catch (e) {
      return '';
    }
  }

  getDeviceId(): string {
    // Generate or retrieve device ID
    // For simplicity, use a random ID stored in preferences
    // In real app, use device identifier
    return `device_${Math.random().toString(36).substring(2, 10)}`;
  }

  async clearMatchData(): Promise<void> {
    try {
      await preferences?.delete(KEY_MATCH_ID);
      await preferences?.flush();
    } catch (e) {
      console.error('Clear match data failed:', e);
    }
  }
}
