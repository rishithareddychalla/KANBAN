import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300
        ${isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div
        className={`glass-modal w-full max-w-md rounded-2xl border p-6 shadow-2xl relative z-10 transition-all duration-300 transform
          ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="flex gap-4 items-start">
          {/* Icon */}
          <div
            className={`p-3 rounded-xl border shrink-0
              ${isDanger 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
          >
            {isDanger ? <Trash size={20} /> : <AlertTriangle size={20} />}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-1.5">
            <h3 className="font-display font-bold text-slate-100 text-base tracking-wide">
              {title}
            </h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200
              ${isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_4px_16px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.45)]'
                : 'bg-amber-600 hover:bg-amber-500 shadow-[0_4px_16px_rgba(217,119,6,0.3)] hover:shadow-[0_4px_20px_rgba(217,119,6,0.45)]'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
