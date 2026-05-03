import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TeamList from '@/pages/TeamList';
import TeamCreate from '@/pages/TeamCreate';
import TeamEdit from '@/pages/TeamEdit';
import PlayerManagement from '@/pages/PlayerManagement';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b border-panel-border bg-panel-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg">
              🏆
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ECS 队伍注册系统</h1>
              <p className="text-xs text-slate-400">Event Control System</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-accent text-white'
                  : 'text-slate-300 hover:bg-panel-bg hover:text-white'
              }`}
            >
              队伍列表
            </Link>
            <Link
              to="/teams/create"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              + 添加队伍
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-panel-border bg-panel-surface/50 py-4">
      <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-500">
        ECS 队伍注册系统 v1.0 · Event Control System
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-panel-bg">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<TeamList />} />
            <Route path="/teams/create" element={<TeamCreate />} />
            <Route path="/teams/:teamId/edit" element={<TeamEdit />} />
            <Route path="/teams/:teamId/players" element={<PlayerManagement />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
