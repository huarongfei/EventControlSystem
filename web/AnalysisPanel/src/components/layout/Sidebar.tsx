import { NavLink } from 'react-router-dom';
import config from '@/config';

const navItems = [
  { to: '/', label: '比赛列表', icon: '📋' },
  { to: '/settings', label: '设置', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-panel-border bg-panel-surface/80 backdrop-blur-md">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-panel-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
          E
        </div>
        <span className="text-base font-semibold tracking-tight text-white">
          {config.appTitle}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-panel-border p-4 text-xs text-slate-500">
        ECS Analysis Panel v1.0
      </div>
    </aside>
  );
}
