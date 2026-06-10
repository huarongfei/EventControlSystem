import { useEffect, useCallback, useRef } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { matchApi } from '@/services/api';

export function useMatch(matchId: string | undefined) {
  const {
    currentMatch,
    setCurrentMatch,
    handleScoreUpdate,
    addEvent,
    handleStatusChange,
    isLoading,
    setLoading,
  } = useMatchStore();

  // 用 trackId 替代 fetchedRef，确保 matchId 变化时重新获取
  const trackIdRef = useRef<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const match = await matchApi.getMatchById(matchId);
      setCurrentMatch(match);
    } catch {
      // 获取比赛失败 — isLoading 会自动结束，match 保持 null 触发空状态 UI
    } finally {
      setLoading(false);
    }
  }, [matchId, setCurrentMatch, setLoading]);

  useEffect(() => {
    if (matchId && matchId !== trackIdRef.current) {
      trackIdRef.current = matchId;
      fetchMatch();
    }
  }, [matchId, fetchMatch]);

  // 每 30 秒轮询一次（WebSocket 断开时的兜底）
  useEffect(() => {
    if (!matchId) return;
    const interval = setInterval(fetchMatch, 30000);
    return () => clearInterval(interval);
  }, [matchId, fetchMatch]);

  return {
    match: currentMatch,
    isLoading,
    refresh: fetchMatch,
    handleScoreUpdate,
    addEvent,
    handleStatusChange,
  };
}
