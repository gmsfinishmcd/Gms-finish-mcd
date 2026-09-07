import React from 'react';
import { X, CheckCircle2, AlertTriangle, Truck, ArrowRightLeft, Radio, BellRing } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.js';

export const LiveAlertToast: React.FC = () => {
  const { latestAlert, clearLatestAlert } = useRealtime();

  if (!latestAlert) return null;

  const getIcon = () => {
    switch (latestAlert.type) {
      case 'FABRIC_RECEIVED':
        return <CheckCircle2 className="size-5 text-emerald-600" />;
      case 'DELIVERY_DISPATCHED':
        return <Truck className="size-5 text-blue-600" />;
      case 'TRANSFER_DONE':
        return <ArrowRightLeft className="size-5 text-purple-600" />;
      case 'QUALITY_ALERT':
        return <AlertTriangle className="size-5 text-amber-600" />;
      case 'TASK_UPDATED':
        return <BellRing className="size-5 text-teal-600" />;
      default:
        return <Radio className="size-5 text-emerald-600" />;
    }
  };

  return (
    <aside
      aria-label="Real-time notifications"
      id="live-alert-toast"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-emerald-500/30 p-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-50 shrink-0 border border-emerald-100">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-Time Update
            </span>
            <span className="text-[10px] text-gray-400">Just now</span>
          </div>
          <h4 className="text-xs font-bold text-gray-900 truncate mt-0.5">{latestAlert.title}</h4>
          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
            {latestAlert.description}
          </p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-100 pt-1">
            <span className="truncate">By {latestAlert.author}</span>
            <span className="font-mono text-[9px] text-emerald-600 font-medium">LIVE MCD</span>
          </div>
        </div>
        <button
          onClick={clearLatestAlert}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </aside>
  );
};
