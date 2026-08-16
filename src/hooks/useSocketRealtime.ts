import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useBoardStore } from '../store/useBoardStore';

export const useSocketRealtime = () => {
  const fetchBoard = useBoardStore((s) => s.fetchBoard);

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.io Client] Connected to Realtime WebSocket');
    });

    socket.on('card:created', () => fetchBoard());
    socket.on('card:updated', () => fetchBoard());
    socket.on('card:moved', () => fetchBoard());
    socket.on('card:deleted', () => fetchBoard());
    socket.on('comment:added', () => fetchBoard());

    return () => {
      socket.disconnect();
    };
  }, [fetchBoard]);
};
