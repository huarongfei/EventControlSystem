import { useState } from 'react';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('ecs_api_url') || 'http://localhost:3001',
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('ecs_api_url', apiUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-panel-border px-8 py-5">
        <h1 className="text-2xl font-bold text-white">设置</h1>
        <p className="mt-1 text-sm text-slate-400">配置赛况分析面板</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-xl space-y-8">
          {/* API 地址 */}
          <div className="rounded-2xl border border-panel-border bg-panel-surface/60 p-6 backdrop-blur-lg">
            <h2 className="mb-1 text-lg font-semibold text-white">API 地址</h2>
            <p className="mb-4 text-sm text-slate-400">
              后端 API 服务的基础地址（修改后刷新页面生效）
            </p>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded-lg border border-panel-border bg-panel-bg px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent"
              placeholder="http://localhost:3001"
            />
            <button
              onClick={handleSave}
              className={`mt-3 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-accent text-white hover:bg-accent-dark'
              }`}
            >
              {saved ? '✓ 已保存' : '保存'}
            </button>
          </div>

          {/* 关于 */}
          <div className="rounded-2xl border border-panel-border bg-panel-surface/60 p-6 backdrop-blur-lg">
            <h2 className="mb-2 text-lg font-semibold text-white">关于</h2>
            <div className="space-y-1 text-sm text-slate-400">
              <p>ECS 赛况分析面板 v1.0.0</p>
              <p>基于 React 18 + TypeScript + Vite 构建</p>
              <p>实时数据通过 WebSocket 推送</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
