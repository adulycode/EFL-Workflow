import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useBoardStore } from '../store/useBoardStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAuthStore } from '../store/useAuthStore';

export const useSocketRealtime = () => {
  const fetchBoard = useBoardStore((s) => s.fetchBoard);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const fetchUsers = useAuthStore((s) => s.fetchUsers);

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

    // User Real-time Events from Central SSO
    socket.on('user:created', () => fetchUsers());
    socket.on('user:updated', () => fetchUsers());
    socket.on('users:synced', () => fetchUsers());

    return () => {
      socket.disconnect();
    };
  }, [fetchBoard, fetchWorkspaces, fetchUsers]);
};
