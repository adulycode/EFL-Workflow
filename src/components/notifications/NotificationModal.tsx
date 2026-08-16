import React, { useEffect, useState } from 'react';
import { NotificationLog } from '../../types';
import { X, Bell, Mail, MessageSquare, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
}

export const NotificationModal: React.FC<Props> = ({ onClose }) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Multi-Channel Notification Dispatcher
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Live delivery audit logs for Email (Resend) & LINE Messaging API
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Logs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              No notifications triggered yet. Move a card to "Review" or "Done" to trigger automatic alerts!
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-neutral-50 dark:bg-neutral-800/40 rounded-xl p-3.5 border border-neutral-200/70 dark:border-neutral-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.channel === 'LINE'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {log.channel === 'LINE' ? <MessageSquare size={10} /> : <Mail size={10} />}
                      {log.channel}
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      To: {log.user?.name}
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-400">
                    {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                  </span>
                </div>

                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                  {log.title}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  {log.message}
                </p>

                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 pt-1">
                  <CheckCircle size={11} />
                  <span>Status: {log.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
