import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuthStore } from '../../store/useAuthStore';
import { X, ArrowRightLeft, Folder, Layout, Columns, AlertCircle, Sparkles } from 'lucide-react';

interface MoveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string;
  cardTitle?: string;
  cardIds?: string[];
  currentColumnId?: string;
  currentBoardId?: string;
  currentWorkspaceId?: string;
  onSuccess?: (targetWorkspaceId: string, targetBoardId: string) => void;
}

export const MoveCardModal: React.FC<MoveCardModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardTitle,
  cardIds,
  currentColumnId,
  currentBoardId,
  currentWorkspaceId,
  onSuccess
}) => {
  const { workspaces, setCurrentWorkspace } = useWorkspaceStore();
  const { moveCardToBoard, batchMoveCards } = useBoardStore();
  const { currentUser } = useAuthStore();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen && workspaces.length > 0) {
      const activeWs = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];
      setSelectedWorkspaceId(activeWs.id);

      const activeBoard = activeWs.boards?.find(b => b.id === currentBoardId) || activeWs.boards?.[0];
      if (activeBoard) {
        setSelectedBoardId(activeBoard.id);
        const col = activeBoard.columns?.find(c => c.id !== currentColumnId) || activeBoard.columns?.[0];
        if (col) setSelectedColumnId(col.id);
      }
      setErrorMsg(null);
    }
  }, [isOpen, workspaces, currentWorkspaceId, currentBoardId, currentColumnId]);

  if (!isOpen) return null;

  // Selected Workspace and its Boards
  const currentSelectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const availableBoards = currentSelectedWorkspace?.boards || [];

  // Selected Board and its Columns
  const currentSelectedBoard = availableBoards.find(b => b.id === selectedBoardId);
  const availableColumns = currentSelectedBoard?.columns || [];

  const handleWorkspaceChange = (wsId: string) => {
    setSelectedWorkspaceId(wsId);
    const ws = workspaces.find(w => w.id === wsId);
    const firstBoard = ws?.boards?.[0];
    if (firstBoard) {
      setSelectedBoardId(firstBoard.id);
      const firstCol = firstBoard.columns?.[0];
      if (firstCol) setSelectedColumnId(firstCol.id);
    } else {
      setSelectedBoardId('');
      setSelectedColumnId('');
    }
    setErrorMsg(null);
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    const brd = availableBoards.find(b => b.id === boardId);
    const firstCol = brd?.columns?.[0];
    if (firstCol) {
      setSelectedColumnId(firstCol.id);
    } else {
      setSelectedColumnId('');
    }
    setErrorMsg(null);
  };

  const isBatch = Boolean(cardIds && cardIds.length > 0);
  const isSameLocation = !isBatch && selectedColumnId === currentColumnId;

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumnId || isSameLocation) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (isBatch && cardIds && cardIds.length > 0) {
        await batchMoveCards(cardIds, selectedColumnId, position);
      } else if (cardId) {
        await moveCardToBoard(cardId, selectedColumnId, position);
      }

      // If moved to a different workspace/board, notify parent
      if (onSuccess && selectedWorkspaceId && selectedBoardId) {
        onSuccess(selectedWorkspaceId, selectedBoardId);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถย้ายการ์ดได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {isBatch ? `ย้ายการ์ดชุด (${cardIds?.length} รายการ)` : 'ย้ายการ์ด (Move Card)'}
              </h3>
              <p className="text-[11px] text-neutral-500 truncate max-w-[260px]">
                {isBatch ? 'ย้ายการ์ดที่เลือกไปยังบอร์ดหรือคอลัมน์เป้าหมาย' : cardTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleMove} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Workspace Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Folder size={13} className="text-emerald-600" />
              <span>Workspace / แผนกปลายทาง</span>
            </label>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.icon || '📁'} {ws.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Board Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Layout size={13} className="text-blue-600" />
              <span>บอร์ดปลายทาง (Board)</span>
            </label>
            {availableBoards.length > 0 ? (
              <select
                value={selectedBoardId}
                onChange={(e) => handleBoardChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {availableBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon || '📋'} {b.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-neutral-400 italic py-1">
                Workspace นี้ยังไม่มีบอร์ด
              </p>
            )}
          </div>

          {/* Target Column Selector & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Columns size={13} className="text-purple-600" />
                <span>คอลัมน์ (Column)</span>
              </label>
              {availableColumns.length > 0 ? (
                <select
                  value={selectedColumnId}
                  onChange={(e) => {
                    setSelectedColumnId(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                >
                  {availableColumns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-neutral-400 italic py-1">
                  บอร์ดนี้ไม่มีคอลัมน์
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                ตำแหน่ง (Position)
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as 'top' | 'bottom')}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-500 font-medium"
              >
                <option value="bottom">ล่างสุด (Bottom)</option>
                <option value="top">บนสุด (Top)</option>
              </select>
            </div>
          </div>

          {/* Same location hint */}
          {isSameLocation && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ การ์ดนี้อยู่ในคอลัมน์นี้อยู่แล้ว กรุณาเลือกคอลัมน์หรือบอร์ดอื่นที่ต้องการย้ายไป
            </p>
          )}

          {/* Audit Log Security Note */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-500 shrink-0" />
            <span>ระบบจะบันทึกประวัติ (Audit Log) การย้ายการ์ดไว้ให้อัตโนมัติ</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedColumnId || isSameLocation}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>กำลังย้าย...</span>
              ) : (
                <>
                  <ArrowRightLeft size={13} />
                  <span>{isBatch ? `ย้ายทั้งหมด (${cardIds?.length}) ทันที` : 'ย้ายการ์ดทันที'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
