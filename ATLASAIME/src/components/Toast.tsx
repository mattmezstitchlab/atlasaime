import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
