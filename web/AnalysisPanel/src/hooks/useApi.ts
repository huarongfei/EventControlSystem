import { useCallback } from 'react';
import { matchApi } from '@/services/api';
import { useMatchStore } from '@/store/matchStore';

export function useApi() {
  const setMatches = useMatchStore((s) => s.setMatches);
  const setLoading = useMatchStore((s) => s.setLoading);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const matches = await matchApi.getMatches();
      setMatches(matches);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, [setMatches, setLoading]);

  return { fetchMatches };
}
