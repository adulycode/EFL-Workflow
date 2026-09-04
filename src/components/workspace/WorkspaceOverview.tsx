import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBoardStore } from '../../store/useBoardStore';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Plus, 
  Search, 
  Users, 
  UserPlus, 
  ArrowRight, 
  FolderKanban, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { EditWorkspaceModal } from './EditWorkspaceModal';
import { InviteMemberModal } from './InviteMemberModal';
import { format } from 'date-fns';

interface Props {
  onSelectWorkspace: (workspaceId: string) => void;
}

export const WorkspaceOverview: React.FC<Props> = ({ onSelectWorkspace }) => {
  const { workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const { currentUser } = useAuthStore();
  const { setSelectedCardId } = useBoardStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'OWNED' | 'MEMBER'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);

  // Global metric aggregations
  const totalWorkspaces = workspaces.length;
  
  let totalTasks = 0;
  let totalDone = 0;
  let totalInProgress = 0;
  const myCrossWorkspaceTasks: Array<{ task: any; workspaceName: string; workspaceId: string }> = [];

  workspaces.forEach((ws) => {
    ws.boards?.forEach((b) => {
      b.columns?.forEach((col) => {
        const count = col.cards?.length || 0;
        totalTasks += count;

        if (col.title === 'Done') totalDone += count;
        if (['In Progress', 'Review'].includes(col.title)) totalInProgress += count;

        col.cards?.forEach((card) => {
          if (currentUser && card.assignees?.some((a) => a.userId === currentUser.id)) {
            myCrossWorkspaceTasks.push({
              task: card,
              workspaceName: ws.name,
              workspaceId: ws.id
            });
          }
        });
      });
    });
  });

  const completionPercentage = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  // Filter workspaces
  const filteredWorkspaces = workspaces.filter((ws) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = ws.name.toLowerCase().includes(q);
      const matchDesc = ws.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    if (filterTab === 'OWNED') {
      return ws.ownerId === currentUser?.id;
    }
    if (filterTab === 'MEMBER') {
      return ws.ownerId !== currentUser?.id && ws.members?.some((m) => m.userId === currentUser?.id);
    }
    return true;
  });

  const handleOpenWorkspace = (ws: any) => {
    setCurrentWorkspace(ws);
    onSelectWorkspace(ws.id);
  };

  const handleOpenTask = (workspaceId: string, cardId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      onSelectWorkspace(workspaceId);
      setTimeout(() => setSelectedCardId(cardId), 100);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Hero Banner & Metrics */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                Organization Hub
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Workspace Overview & Portfolios
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              High-level vision, team workload, and delivery metrics across all 20 team spaces
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={15} /> Create Workspace
          </button>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white leading-none">
                {totalWorkspaces}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                Active Workspaces
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white leading-none">
                {totalInProgress}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                Tasks In Progress
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white leading-none">
                {completionPercentage}%
              </div>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                Completed ({totalDone}/{totalTasks})
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-neutral-900 dark:text-white leading-none">
                {myCrossWorkspaceTasks.length}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                My Assigned Tasks
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-900 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              All Spaces ({workspaces.length})
            </button>
            <button
              onClick={() => setFilterTab('OWNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'OWNED'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Owned by Me
            </button>
            <button
              onClick={() => setFilterTab('MEMBER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'MEMBER'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Shared with Me
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>
        </div>

        {/* Workspaces Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => {
            const isOwner = ws.ownerId === currentUser?.id;
            let wsTotalTasks = 0;
            let wsDoneTasks = 0;
            let wsInProgress = 0;
            let wsToDo = 0;

            ws.boards?.forEach((b) => {
              b.columns?.forEach((col) => {
                const count = col.cards?.length || 0;
                wsTotalTasks += count;
                if (col.title === 'Done') wsDoneTasks += count;
                else if (['In Progress', 'Review'].includes(col.title)) wsInProgress += count;
                else wsToDo += count;
              });
            });

            const wsPercent = wsTotalTasks > 0 ? Math.round((wsDoneTasks / wsTotalTasks) * 100) : 0;

            return (
              <div
                key={ws.id}
                className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorkspace(ws);
                        }}
                        title="คลิกเพื่อเปลี่ยนไอคอนหรือสี Workspace"
                        style={{ backgroundColor: `${ws.color || '#16a34a'}15`, borderColor: ws.color || '#16a34a' }}
                        className="relative h-11 w-11 rounded-2xl flex items-center justify-center text-xl border shadow-inner shrink-0 group/icon hover:scale-105 transition-all cursor-pointer"
                      >
                        {ws.icon || '📁'}
                        <div className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-xs opacity-0 group-hover/icon:opacity-100 transition-opacity">
                          <Pencil size={10} className="text-neutral-600 dark:text-neutral-300" />
                        </div>
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {ws.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                          <FolderKanban size={12} />
                          <span>{ws.boards?.length || 1} board &bull; {wsTotalTasks} tasks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorkspace(ws);
                        }}
                        title="แก้ไข Workspace (ไอคอน, สี, ชื่อ)"
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      {isOwner ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                          Owner
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          Member
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                    {ws.description || 'Dedicated workspace for project delivery and team collaboration.'}
                  </p>

                  {/* Progress Bar & Status Badges */}
                  <div className="space-y-2 bg-neutral-50 dark:bg-neutral-950/60 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                      <span>Delivery Progress</span>
                      <span>{wsPercent}% Done</span>
                    </div>

                    {/* Multi-Segment Visual Progress Bar */}
                    <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${wsTotalTasks > 0 ? (wsDoneTasks / wsTotalTasks) * 100 : 0}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Done: ${wsDoneTasks}`}
                      />
                      <div
                        style={{ width: `${wsTotalTasks > 0 ? (wsInProgress / wsTotalTasks) * 100 : 0}%` }}
                        className="bg-amber-500 h-full"
                        title={`In Progress: ${wsInProgress}`}
                      />
                      <div
                        style={{ width: `${wsTotalTasks > 0 ? (wsToDo / wsTotalTasks) * 100 : 0}%` }}
                        className="bg-blue-500 h-full"
                        title={`To Do: ${wsToDo}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> To Do: {wsToDo}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> In Prog: {wsInProgress}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Done: {wsDoneTasks}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  {/* Member Stack */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2 overflow-hidden">
                      {ws.members?.slice(0, 4).map((m) => (
                        <img
                          key={m.userId}
                          src={m.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}`}
                          alt={m.user.name}
                          title={m.user.name}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 object-cover"
                        />
                      ))}
                    </div>
                    {ws.members?.length > 4 && (
                      <span className="text-[10px] font-semibold text-neutral-400">
                        +{ws.members.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Open Board CTA */}
                  <button
                    onClick={() => handleOpenWorkspace(ws)}
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 rounded-xl transition-all group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-900"
                  >
                    <span>Open Board</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick Create Workspace Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center group transition-all min-h-[220px]"
          >
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center transition-colors mb-3">
              <Plus size={22} />
            </div>
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white">
              Create a new Space
            </h4>
            <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
              Start a fresh project board and invite team collaborators
            </p>
          </button>
        </div>

        {/* My Cross-Workspace Tasks Section */}
        {myCrossWorkspaceTasks.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <Flame size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    My Assigned Tasks Across All Spaces ({myCrossWorkspaceTasks.length})
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Direct access to tasks assigned to {currentUser?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myCrossWorkspaceTasks.map(({ task, workspaceName, workspaceId }) => (
                <div
                  key={task.id}
                  onClick={() => handleOpenTask(workspaceId, task.id)}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-neutral-900 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-neutral-500 uppercase tracking-tight bg-neutral-200/60 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {workspaceName}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {task.priority}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {task.title}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    {task.dueDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    ) : (
                      <span>No due date</span>
                    )}
                    <span className="font-medium text-neutral-600 dark:text-neutral-300 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Open →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />}
      {showInviteModal && <InviteMemberModal onClose={() => setShowInviteModal(false)} />}
      {editingWorkspace && (
        <EditWorkspaceModal
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
        />
      )}
    </>
  );
};
