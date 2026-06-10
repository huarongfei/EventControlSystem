import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teamApi } from '@/services/api';
import type { Team } from '@/types';

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const data = await teamApi.getTeams();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取队伍列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (team: Team) => {
    const confirmed = window.confirm(
      `确定要删除队伍"${team.name}"吗？\n\n⚠️ 注意：删除队伍将同时删除所有队员信息！`
    );
    if (!confirmed) return;

    setDeletingId(team.id);
    setError('');

    try {
      await teamApi.deleteTeam(team.id);
      setDeletingId(null);  // 重置删除状态
      fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 text-7xl">🏆</div>
          <h2 className="mb-2 text-2xl font-bold text-white">暂无队伍</h2>
          <p className="mb-6 text-slate-400">点击下方按钮添加第一支队伍</p>
          <Link
            to="/teams/create"
            className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent/80"
          >
            + 添加队伍
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">队伍列表</h2>
            <span className="text-sm text-slate-400">{teams.length} 支队伍</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="group rounded-2xl border border-panel-border bg-gradient-to-br from-panel-surface to-panel-bg p-5 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="mb-4 flex items-center gap-4">
                  {team.logo ? (
                    <img src={team.logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-2xl font-bold text-blue-400">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-base font-semibold text-white">{team.name}</h3>
                    {team.shortName && (
                      <p className="text-sm text-slate-400">{team.shortName}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4 rounded-lg bg-panel-bg/50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">队员数量</span>
                    <span className="font-medium text-white">
                      {team.players?.length || 0} 人
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/teams/${team.id}/players`}
                    className="flex-1 rounded-lg bg-green-600/20 px-3 py-2 text-center text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30"
                  >
                    管理队员
                  </Link>
                  <Link
                    to={`/teams/${team.id}/edit`}
                    className="flex-1 rounded-lg bg-blue-600/20 px-3 py-2 text-center text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(team)}
                    disabled={deletingId === team.id}
                    className="flex-1 rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                  >
                    {deletingId === team.id ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
