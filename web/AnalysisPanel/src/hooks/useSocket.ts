import { useEffect, useRef, useState } from 'react';
import socketService from '@/services/socket';
import type { ConnectionStatus } from '@/types';

export function useSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const matchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = socketService.onConnectionChange(setStatus);
    socketService.connect();
    return () => {
      // Only unsubscribe the local listener — do NOT disconnect the global
      // singleton Socket, as other components (e.g. useMatch) may still be
      // using it for real-time data. The connection is managed at app level.
      unsub();
    };
  }, []);

  const joinMatch = (matchId: string) => {
    matchIdRef.current = matchId;
    socketService.joinMatch(matchId);
  };

  const leaveMatch = () => {
    if (matchIdRef.current) {
      socketService.leaveMatch(matchIdRef.current);
      matchIdRef.current = null;
    }
  };

  return { status, joinMatch, leaveMatch };
}
