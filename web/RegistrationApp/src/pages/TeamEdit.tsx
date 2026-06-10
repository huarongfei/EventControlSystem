import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teamApi } from '@/services/api';
import type { Team } from '@/types';

export default function TeamEdit() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    logoUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;

      try {
        const data = await teamApi.getTeamById(teamId);
        setTeam(data);
        setFormData({
          name: data.name || '',
          shortName: data.shortName || '',
          logoUrl: data.logo || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取队伍信息失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('请输入队伍名称');
      return;
    }

    if (!teamId) {
      setError('缺少队伍ID');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await teamApi.updateTeam(teamId, {
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新队伍失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 text-slate-400">队伍不存在</div>
        <button
          onClick={() => navigate('/')}
          className="rounded-xl border border-panel-border px-4 py-2 text-sm text-slate-300 hover:bg-panel-bg/50"
        >
          返回队伍列表
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <span>←</span> 返回队伍列表
      </button>

      <div className="rounded-2xl border border-panel-border bg-panel-surface p-8">
        <h1 className="mb-6 text-2xl font-bold text-white">编辑队伍</h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              队伍名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-panel-border bg-panel-bg px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              placeholder="请输入队伍名称"
              maxLength={50}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              队伍简称
            </label>
            <input
              type="text"
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              className="w-full rounded-xl border border-panel-border bg-panel-bg px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              placeholder="请输入队伍简称（选填，最多10个字符）"
              maxLength={10}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full rounded-xl border border-panel-border bg-panel-bg px-4 py-3 text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              placeholder="请输入Logo图片URL（选填）"
            />
          </div>

          {formData.logoUrl && (
            <div className="rounded-xl border border-panel-border p-4">
              <p className="mb-3 text-sm text-slate-400">Logo 预览：</p>
              <div className="flex justify-center">
                <img
                  src={formData.logoUrl}
                  alt="Logo 预览"
                  className="h-24 w-24 rounded-xl object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-panel-border">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-xl border border-panel-border px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-panel-bg/50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/80 disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}