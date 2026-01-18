
import React from 'react';
import { useToast, ToastType } from '../contexts/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-500 border-green-600';
      case 'error': return 'bg-red-500 border-red-600';
      case 'warning': return 'bg-amber-500 border-amber-600';
      case 'info': return 'bg-blue-500 border-blue-600';
      default: return 'bg-slate-800 border-slate-900';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none p-4 md:p-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getBackgroundColor(toast.type)} text-white px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 animate-slideIn pointer-events-auto transition-all`}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">
            {getIcon(toast.type)}
          </div>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
