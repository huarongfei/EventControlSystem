// ============================================================
// ECS 赛况分析面板 - 配置文件
// ============================================================

/** 动态读取 API 地址（优先 localStorage，其次 env，最后默认值） */
const getApiBase = () =>
  localStorage.getItem('ecs_api_url') ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001';

const config = {
  /** API 基础地址 */
  get apiBaseUrl() { return getApiBase(); },

  /** Socket.IO 连接地址 */
  get socketUrl() { return getApiBase(); },

  /** Socket.IO 路径 */
  socketPath: '/socket.io/',

  /** Socket.IO 传输方式 */
  socketTransports: ['websocket', 'polling'] as const,

  /** Socket.IO 重连配置 */
  socketReconnection: {
    attempts: 10,
    delay: 1000,
  },

  /** 应用标题 */
  appTitle: 'ECS 赛况分析',

  /** 默认每页比赛数量 */
  pageSize: 20,

  /** 事件时间线最大显示条数 */
  maxTimelineEvents: 50,
};

export default config;
