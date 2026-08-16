import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useBoardStore } from '../store/useBoardStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

export const useSocketRealtime = () => {
  const fetchBoard = useBoardStore((s) => s.fetchBoard);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);

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

    socket.on('workspace:created', () => fetchWorkspaces());
    socket.on('workspace:member_added', () => fetchWorkspaces());
    socket.on('workspace:member_removed', () => fetchWorkspaces());

    return () => {
      socket.disconnect();
    };
  }, [fetchBoard, fetchWorkspaces]);
};
