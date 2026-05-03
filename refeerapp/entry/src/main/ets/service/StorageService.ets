// StorageService.ets - 本地存储服务
import { preferences } from '@kit.ArkData';

const PREF_NAME = 'referee_app_prefs';

/** 存储键 */
enum StorageKey {
  SERVER_URL = 'server_url',
  MATCH_ID = 'match_id',
  USER_NAME = 'user_name',
  DEVICE_ID = 'device_id',
  OFFLINE_QUEUE = 'offline_queue',
  HISTORY_URLS = 'history_urls'
}

const MAX_HISTORY_URLS = 10;

/** 存储服务类 */
class StorageService {
  private pref: preferences.Preferences | null = null;

  /** 初始化 */
  async init(): Promise<void> {
    try {
      const context = getContext();
      if (!context) {
        throw new Error('无法获取应用上下文');
      }
      this.pref = await preferences.getPreferences(context, PREF_NAME);
      console.log('StorageService 初始化成功');
    } catch (err) {
      console.error('StorageService 初始化失败:', err);
      throw new Error(`存储服务初始化失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** 确保已初始化 */
  private async ensureInitialized(): Promise<void> {
    if (!this.pref) {
      await this.init();
    }
    if (!this.pref) {
      throw new Error('存储服务未正确初始化');
    }
  }

  /** 获取字符串 */
  async getString(key: StorageKey): Promise<string> {
    try {
      await this.ensureInitialized();
      const value = await this.pref!.get(key, '');
      return value as string;
    } catch (err) {
      console.error(`获取存储键 ${key} 失败:`, err);
      return '';
    }
  }

  /** 设置字符串 */
  async setString(key: StorageKey, value: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.pref!.put(key, value);
      await this.pref!.flush();
      console.log(`存储键 ${key} 已保存`);
    } catch (err) {
      console.error(`保存存储键 ${key} 失败:`, err);
      throw new Error(`保存数据失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** 获取服务器地址 */
  async getServerUrl(): Promise<string> {
    return this.getString(StorageKey.SERVER_URL);
  }

  /** 保存服务器地址 */
  async saveServerUrl(url: string): Promise<void> {
    return this.setString(StorageKey.SERVER_URL, url);
  }

  /** 获取比赛ID */
  async getMatchId(): Promise<string> {
    return this.getString(StorageKey.MATCH_ID);
  }

  /** 保存比赛ID */
  async saveMatchId(matchId: string): Promise<void> {
    return this.setString(StorageKey.MATCH_ID, matchId);
  }

  /** 清除所有数据 */
  async clear(): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.pref!.clear();
      console.log('存储数据已清除');
    } catch (err) {
      console.error('清除存储数据失败:', err);
      throw new Error(`清除数据失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** 检查键是否存在 */
  async has(key: StorageKey): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const value = await this.pref!.get(key, '');
      return value !== '';
    } catch (err) {
      console.error(`检查存储键 ${key} 失败:`, err);
      return false;
    }
  }

  /** 删除指定键 */
  async delete(key: StorageKey): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.pref!.delete(key);
      await this.pref!.flush();
      console.log(`存储键 ${key} 已删除`);
    } catch (err) {
      console.error(`删除存储键 ${key} 失败:`, err);
      throw new Error(`删除数据失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** 获取所有键 */
  async getAllKeys(): Promise<string[]> {
    try {
      await this.ensureInitialized();
      const allData = await this.pref!.getAll();
      return Object.keys(allData);
    } catch (err) {
      console.error('获取所有存储键失败:', err);
      return [];
    }
  }

  /** 检查存储服务是否可用 */
  isAvailable(): boolean {
    return this.pref !== null;
  }

  /** 获取历史服务器地址列表 */
  async getHistoryUrls(): Promise<string[]> {
    try {
      await this.ensureInitialized();
      const data = await this.pref!.get(StorageKey.HISTORY_URLS, '[]');
      const urls = JSON.parse(data as string) as string[];
      return urls;
    } catch (err) {
      console.error('获取历史URL失败:', err);
      return [];
    }
  }

  /** 添加服务器地址到历史记录 */
  async addHistoryUrl(url: string): Promise<void> {
    try {
      const urls = await this.getHistoryUrls();
      // 移除已存在的相同URL
      const filtered = urls.filter(u => u !== url);
      // 添加到开头
      filtered.unshift(url);
      // 限制数量
      const limited = filtered.slice(0, MAX_HISTORY_URLS);
      await this.pref!.put(StorageKey.HISTORY_URLS, JSON.stringify(limited));
      await this.pref!.flush();
    } catch (err) {
      console.error('添加历史URL失败:', err);
    }
  }

  /** 清除历史记录 */
  async clearHistoryUrls(): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.pref!.put(StorageKey.HISTORY_URLS, '[]');
      await this.pref!.flush();
    } catch (err) {
      console.error('清除历史URL失败:', err);
    }
  }

  /** 保存用户名 */
  async saveUserName(name: string): Promise<void> {
    return this.setString(StorageKey.USER_NAME, name);
  }

  /** 获取用户名 */
  async getUserName(): Promise<string> {
    return this.getString(StorageKey.USER_NAME);
  }
}

/** 导出单例 */
export const storageService = new StorageService();
export { StorageKey };
