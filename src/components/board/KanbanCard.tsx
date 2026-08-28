import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Priority } from '../../types';
import { useBoardStore } from '../../store/useBoardStore';
import { Calendar, MessageSquare, AlertCircle, Paperclip, CheckSquare } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface Props {
  card: Card;
  isOverlay?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string }> = {
  LOW: { label: 'Low', bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400' },
  HIGH: { label: 'High', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
  URGENT: { label: 'Urgent', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400' }
};

export const KanbanCard: React.FC<Props> = ({ card, isOverlay = false }) => {
  const setSelectedCardId = useBoardStore((s) => s.setSelectedCardId);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  };

  const isOverdue = card.dueDate && isPast(new Date(card.dueDate));
  const priority = PRIORITY_CONFIG[card.priority || 'MEDIUM'];

  // Checklist calculations
  const allChecklistItems = card.checklists?.flatMap((c) => c.items) || [];
  const completedChecklistItems = allChecklistItems.filter((i) => i.isCompleted).length;
  const totalChecklistItems = allChecklistItems.length;

  const totalAttachments = (card.attachments?.length || 0) + (card._count?.attachments || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && setSelectedCardId(card.id)}
      className={`group relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/90 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] cursor-grab active:cursor-grabbing transition-all overflow-hidden ${
        isOverlay ? 'rotate-1 scale-105 shadow-2xl ring-2 ring-neutral-900/10 dark:ring-white/10 z-50' : ''
      }`}
    >
      {/* Card Cover Banner (Image or Gradient or Solid Color) */}
      {card.coverBanner ? (
        <div className="w-full h-24 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {card.coverBanner.startsWith('http') ? (
            <img
              src={card.coverBanner}
              alt="Card cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              style={{ background: card.coverBanner }}
              className="w-full h-full"
            />
          )}
        </div>
      ) : card.coverImage ? (
        <div className="w-full h-28 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={card.coverImage}
            alt="Card cover"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : card.coverColor ? (
        <div
          style={{ backgroundColor: card.coverColor }}
          className="w-full h-3"
        />
      ) : null}

      <div className="p-3.5 space-y-2">
        {/* Top Labels & Priority */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex flex-wrap gap-1">
            {card.labels?.map(({ label }) => (
              <span
                key={label.id}
                style={{ backgroundColor: label.colorBg, color: label.colorText }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-tight"
              >
                {label.name}
              </span>
            ))}
          </div>

          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priority.bg} ${priority.text}`}
          >
            {priority.label}
          </span>
        </div>

        {/* Card Title & Emoji Icon */}
        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 flex items-start gap-1.5">
          {card.icon && <span className="text-sm select-none shrink-0">{card.icon}</span>}
          <span>{card.title}</span>
        </h4>

        {/* Description Snippet */}
        {card.description && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Card Footer (Due Date, Checklist Progress, Comments, Attachments, Assignees) */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            {card.dueDate && (
              <span
                className={`flex items-center gap-1 font-medium ${
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
                {format(new Date(card.dueDate), 'MMM d')}
              </span>
            )}

            {/* Checklist Badge */}
            {totalChecklistItems > 0 && (
              <span
                className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  completedChecklistItems === totalChecklistItems
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <CheckSquare size={10} />
                <span>{completedChecklistItems}/{totalChecklistItems}</span>
              </span>
            )}

            {Boolean(card._count?.comments) && (
              <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                <MessageSquare size={11} />
                {card._count?.comments}
              </span>
            )}

            {totalAttachments > 0 && (
              <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                <Paperclip size={11} />
                {totalAttachments}
              </span>
            )}
          </div>

          {/* Stakeholder Avatars (Assignees, Report To, FYI) - Deduplicated */}
          {(() => {
            const uniqueAssignees = Array.from(
              new Map(card.assignees?.map((a: any) => [a.userId, a])).values()
            );
            const visibleAssignees = uniqueAssignees.slice(0, 5);
            const remainingCount = uniqueAssignees.length - 5;

            return (
              <div className="flex -space-x-1.5 overflow-hidden items-center">
                {visibleAssignees.map((a: any) => {
                  const u = a.user;
                  const isReportTo = a.type === 'REPORT_TO';
                  const isFyi = a.type === 'FYI';
                  const roleTitle = isReportTo ? `👑 Report to: ${u.name}` : isFyi ? `📢 FYI: ${u.name}` : `🛠️ Assignee: ${u.name}`;
                  return (
                    <div key={`${card.id}-${u.id}-${a.type || 'assignee'}`} className="relative inline-block" title={roleTitle}>
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className={`inline-block h-5 w-5 rounded-full ring-2 ${
                          isReportTo ? 'ring-amber-400' : isFyi ? 'ring-sky-400' : 'ring-white dark:ring-neutral-900'
                        } object-cover bg-white dark:bg-neutral-800`}
                      />
                      {isReportTo && (
                        <span className="absolute -top-1.5 -right-1 text-[8px]">👑</span>
                      )}
                      {isFyi && (
                        <span className="absolute -bottom-1 -right-0.5 text-[7px]">👁️</span>
                      )}
                    </div>
                  );
                })}
                {remainingCount > 0 && (
                  <span className="text-[10px] font-bold text-neutral-500 pl-2">
                    +{remainingCount}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
