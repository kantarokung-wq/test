import React from 'react';
import { Camera, Plus, CreditCard, RotateCcw, Search, Sparkles } from 'lucide-react';

interface NavbarProps {
  totalCards: number;
  onOpenScanner: () => void;
  onOpenManualAdd: () => void;
  onResetDemo: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCards,
  onOpenScanner,
  onOpenManualAdd,
  onResetDemo,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand & Stats */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Smart Card Vault
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" /> AI Vision
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Firebase
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ระบบสแกนและจัดการนามบัตรอัจฉริยะ • Firebase Firestore • จัดเก็บแล้ว <span className="font-semibold text-cyan-400">{totalCards}</span> ใบ
                </p>
              </div>
            </div>

            {/* Mobile Scan Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs px-3 py-2 rounded-lg shadow-md active:scale-95 transition"
              >
                <Camera className="w-4 h-4" />
                ถ่ายรูปนามบัตร
              </button>
            </div>
          </div>

          {/* Search Input in Navbar */}
          <div className="w-full md:max-w-md relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาชื่อ, บริษัท, ตำแหน่ง, เบอร์โทร, LINE..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onResetDemo}
              title="รีเซ็ตเป็นข้อมูลตัวอย่าง"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ข้อมูลตัวอย่าง
            </button>

            <button
              onClick={onOpenManualAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/70 rounded-xl shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              เพิ่มข้อมูลเอง
            </button>

            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>ถ่ายรูปสแกนนามบัตร</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
