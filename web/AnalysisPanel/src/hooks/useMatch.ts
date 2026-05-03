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

  const fetchedRef = useRef(false);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const match = await matchApi.getMatchById(matchId);
      setCurrentMatch(match);
    } catch (err) {
      console.error('Failed to fetch match:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId, setCurrentMatch, setLoading]);

  useEffect(() => {
    if (matchId && !fetchedRef.current) {
      fetchedRef.current = true;
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
