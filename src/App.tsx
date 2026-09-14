import React, { useEffect, Suspense, lazy } from 'react';
import { BoardHeader } from './components/board/BoardHeader';
import { BoardFilters } from './components/board/BoardFilters';
import { KanbanBoard } from './components/board/KanbanBoard';
import { SsoLoginGate } from './components/auth/SsoLoginGate';
import { useAuthStore } from './store/useAuthStore';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { useBoardStore } from './store/useBoardStore';
import { useSocketRealtime } from './hooks/useSocketRealtime';

// Code-split heavy views and modals for fast initial load
const CalendarView = lazy(() => import('./components/calendar/CalendarView').then((m) => ({ default: m.CalendarView })));
const TableView = lazy(() => import('./components/table/TableView').then((m) => ({ default: m.TableView })));
const CardDetailModal = lazy(() => import('./components/board/CardDetailModal').then((m) => ({ default: m.CardDetailModal })));
const WorkspaceOverview = lazy(() => import('./components/workspace/WorkspaceOverview').then((m) => ({ default: m.WorkspaceOverview })));
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then((m) => ({ default: m.SettingsModal })));

export const App: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const fetchUsers = useAuthStore((s) => s.fetchUsers);
  const loginWithSsoToken = useAuthStore((s) => s.loginWithSsoToken);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const { viewMode, setViewMode } = useBoardStore();

  // Initialize socket realtime listener
  useSocketRealtime();

  useEffect(() => {
    // Check for SSO Token in URL query parameters (e.g. ?sso_token=... or ?token=...)
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('sso_token') || params.get('token');

    if (ssoToken) {
      loginWithSsoToken(ssoToken).then((success) => {
        if (success) {
          console.log('[SSO Handshake] Successfully logged in via EFL Central SSO');
          const uid = useAuthStore.getState().currentUser?.id;
          if (uid) useBoardStore.getState().initLandingPreferences(uid);
        }
        // Remove token from address bar for security & cleanliness
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        fetchWorkspaces();
        checkCardDeepLink();
      });
    } else {
      const uid = useAuthStore.getState().currentUser?.id;
      if (uid) useBoardStore.getState().initLandingPreferences(uid);
      fetchUsers();
      fetchWorkspaces();
      checkCardDeepLink();
    }

    function checkCardDeepLink() {
      const cardMatch = window.location.pathname.match(/\/cards\/([^/]+)/);
      const targetCardId = cardMatch ? cardMatch[1] : params.get('cardId') || params.get('card');

      if (targetCardId) {
        fetch(`/api/cards/${targetCardId}/details`)
          .then((res) => (res.ok ? res.json() : null))
          .then((cardData) => {
            if (cardData) {
              const ws = cardData.column?.board?.workspace;
              if (ws) {
                useWorkspaceStore.getState().setCurrentWorkspace(ws);
              }
              useBoardStore.getState().setSelectedCardId(targetCardId);
            }
          })
          .catch((err) => console.error('Failed to deep link card:', err));
      }
    }
  }, [fetchUsers, fetchWorkspaces, loginWithSsoToken]);

  // If user is not authenticated via SSO, display the SSO Login Gate
  if (!currentUser) {
    return <SsoLoginGate />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <BoardHeader />

      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-neutral-400 text-xs">Loading view...</div>}>
        {viewMode === 'overview' ? (
          <WorkspaceOverview onSelectWorkspace={() => setViewMode('board')} />
        ) : viewMode === 'table' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <BoardFilters />
            <TableView />
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            <BoardFilters />
            <div className="flex-1 min-h-0">
              <CalendarView />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <BoardFilters />
            <KanbanBoard />
          </div>
        )}

        <CardDetailModal />
        <SettingsModal />
      </Suspense>
    </div>
  );
};

export default App;
