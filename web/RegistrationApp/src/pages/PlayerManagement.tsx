import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teamApi } from '@/services/api';
import type { Team, Player } from '@/types';

export default function PlayerManagement() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeamAndPlayers = async () => {
    if (!teamId) return;

    try {
      const [teamData, playersData] = await Promise.all([
        teamApi.getTeamById(teamId),
        teamApi.getPlayers(teamId),
      ]);
      setTeam(teamData);
      setPlayers(playersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndPlayers();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('请输入队员姓名');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const playerData = {
        name: formData.name.trim(),
        ...(formData.number && { number: parseInt(formData.number) }),
        ...(formData.position && { position: formData.position.trim() }),
      };

      if (editingPlayer) {
        await teamApi.updatePlayer(editingPlayer.id, playerData);
      } else {
        await teamApi.addPlayer(teamId!, playerData);
      }

      setShowForm(false);
      setEditingPlayer(null);
      setFormData({ name: '', number: '', position: '' });
      fetchTeamAndPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      number: player.number?.toString() || '',
      position: player.position || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (player: Player) => {
    const confirmed = window.confirm(`确定要删除队员"${player.name}"吗？`);
    if (!confirmed) return;

    setDeletingId(player.id);
    try {
      await teamApi.deletePlayer(player.id);
      fetchTeamAndPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <span>←</span> 返回队伍列表
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {team?.name || '队伍'} - 队员管理
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            共 {players.length} 名队员
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlayer(null);
            setFormData({ name: '', number: '', position: '' });
            setShowForm(true);
          }}
          className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          + 添加队员
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-panel-border bg-panel-surface py-16">
          <div className="mb-4 text-6xl">👥</div>
          <h2 className="mb-2 text-lg font-semibold text-white">暂无队员</h2>
          <p className="mb-6 text-sm text-slate-400">点击"添加队员"开始登记</p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/80"
          >
            + 添加队员
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-panel-border bg-panel-surface overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-panel-border bg-panel-bg/50">
              <tr className="text-left text-sm text-slate-400">
                <th className="px-6 py-4 font-medium">号码</th>
                <th className="px-6 py-4 font-medium">姓名</th>
                <th className="px-6 py-4 font-medium">位置</th>
                <th className="px-6 py-4 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-b border-panel-border/50 transition-colors hover:bg-panel-bg/30 ${
                    index === players.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
                      {player.number || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {player.name}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {player.position || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(player)}
                      className="mr-2 rounded-lg bg-blue-600/20 px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(player)}
                      disabled={deletingId === player.id}
                      className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                    >
                      {deletingId === player.id ? '删除中...' : '删除'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加/编辑队员表单 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-panel-border bg-panel-surface p-6">
            <h2 className="mb-6 text-xl font-bold text-white">
              {editingPlayer ? '编辑队员' : '添加队员'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-panel-border bg-panel-bg px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                  placeholder="请输入队员姓名"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  号码
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full rounded-xl border border-panel-border bg-panel-bg px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                  placeholder="请输入号码（0-99，选填）"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  位置
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full rounded-xl border border-panel-border bg-panel-bg px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:outline-none"
                  placeholder="如：前锋、后卫、中锋等（选填）"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlayer(null);
                  }}
                  className="flex-1 rounded-xl border border-panel-border px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-panel-bg/50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/80 disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : editingPlayer ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
