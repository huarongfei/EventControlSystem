import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import DashboardPage from '@/pages/DashboardPage';
import MatchDetailPage from '@/pages/MatchDetailPage';
import SettingsPage from '@/pages/SettingsPage';

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 比赛详情页 — 全屏独立布局 */}
        <Route path="/match/:matchId" element={<MatchDetailPage />} />
        {/* 其他页面 — 侧边栏布局 */}
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
