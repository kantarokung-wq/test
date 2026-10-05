import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { BusinessCard } from '../types/card';

interface DeleteConfirmModalProps {
  card: BusinessCard | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  card,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center">
        
        <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          ยืนยันการลบนามบัตรนี้หรือไม่?
        </h3>

        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 mb-5 text-left text-xs">
          <p className="font-semibold text-white truncate">{card.name}</p>
          <p className="text-slate-400 truncate">{card.companyName}</p>
          {card.position && <p className="text-indigo-400 truncate">{card.position}</p>}
        </div>

        <p className="text-xs text-slate-400 mb-6">
          เมื่อลบแล้ว ข้อมูลนามบัตรนี้จะถูกลบออกจากฐานข้อมูลอย่างถาวร
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            ยกเลิก
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 transition active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังลบ...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันการลบ</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
