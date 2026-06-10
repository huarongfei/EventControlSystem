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

  // 每 30 秒轮询一次（仅作为 WebSocket 断开时的兜底机制）
  // 当 Socket.IO 实时推送正常时，不需要额外 HTTP 轮询
  useEffect(() => {
    if (!matchId) return;
    const interval = setInterval(fetchMatch, 30000);
    return () => clearInterval(interval);
    // 注意：fetchMatch 在 Socket 连接正常时仍会被调用，
    // 但 setCurrentMatch 会幂等更新 store，开销可忽略。
    // 如需严格仅在断线时轮询，需引入 socket 连接状态依赖。
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
