import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { CardScannerModal } from './components/CardScannerModal';
import { CardFormModal } from './components/CardFormModal';
import { BusinessCardItem } from './components/BusinessCardItem';
import { CardDetailModal } from './components/CardDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { BusinessCard } from './types/card';
import { fetchCards, createCard, updateCard, deleteCard, resetSeedCards, subscribeToCards, getTelHref, getMailHref, getLineHref, downloadVCard } from './services/api';
import { 
  Camera, 
  Plus, 
  Building2, 
  Phone, 
  MessageSquare, 
  Mail, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Sparkles, 
  Download, 
  RotateCcw, 
  ArrowUpDown, 
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'company'>('newest');

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'review_scan'>('create');
  const [formInitialData, setFormInitialData] = useState<Partial<BusinessCard> | null>(null);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<BusinessCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<BusinessCard | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load cards from backend
  const loadCards = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCards();
      setCards(data);
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    // Subscribe to real-time updates from Firebase Firestore
    const unsubscribe = subscribeToCards(
      (updatedCards) => {
        if (updatedCards && updatedCards.length > 0) {
          setCards(updatedCards);
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Realtime subscription notice:', err);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filter & Sort logic
  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards];

    // Filter by tag
    if (selectedTag) {
      result = result.filter((c) => c.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.lineId.toLowerCase().includes(q) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'th');
      }
      if (sortBy === 'company') {
        return a.companyName.localeCompare(b.companyName, 'th');
      }
      return 0;
    });

    return result;
  }, [cards, selectedTag, searchQuery, sortBy]);

  // Unique tags list from all cards
  const allTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [cards]);

  // Statistics
  const stats = useMemo(() => {
    const uniqueCompanies = new Set(cards.map((c) => c.companyName)).size;
    const withPhone = cards.filter((c) => c.phone && c.phone.trim().length > 0).length;
    const withLine = cards.filter((c) => c.lineId && c.lineId.trim().length > 0).length;
    return {
      total: cards.length,
      companies: uniqueCompanies,
      withPhone,
      withLine,
    };
  }, [cards]);

  // Handle Scan Success: populates form for user to review & adjust before saving
  const handleScanSuccess = (extracted: Partial<BusinessCard>, originalImage: string) => {
    setFormInitialData({
      ...extracted,
      imageUrl: originalImage,
    });
    setFormMode('review_scan');
    setIsFormOpen(true);
    showToast('AI สกัดข้อมูลนามบัตรเรียบร้อยแล้ว ตรวจสอบและบันทึกลงฐานข้อมูล');
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (formData: Omit<BusinessCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (formMode === 'edit' && formInitialData && 'id' in formInitialData && formInitialData.id) {
      // Update
      const updated = await updateCard(formInitialData.id, formData);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast(`อัปเดตข้อมูลของคุณ ${updated.name} เรียบร้อยแล้ว`);
      if (selectedCardForDetail?.id === updated.id) {
        setSelectedCardForDetail(updated);
      }
    } else {
      // Create new
      const created = await createCard(formData);
      setCards((prev) => [created, ...prev]);
      showToast(`บันทึกนามบัตรของ ${created.name} ลงฐานข้อมูลสำเร็จแล้ว`);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCard(cardToDelete.id);
      setCards((prev) => prev.filter((c) => c.id !== cardToDelete.id));
      if (selectedCardForDetail?.id === cardToDelete.id) {
        setSelectedCardForDetail(null);
      }
      showToast(`ลบนามบัตรของ ${cardToDelete.name} ออกจากฐานข้อมูลแล้ว`);
      setCardToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to Demo Seed Cards
  const handleResetDemo = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตฐานข้อมูลเป็นนามบัตรตัวอย่างเริ่มต้นหรือไม่?')) {
      const demoCards = await resetSeedCards();
      setCards(demoCards);
      showToast('รีเซ็ตฐานข้อมูลเป็นตัวอย่างนามบัตรเรียบร้อยแล้ว');
    }
  };

  // Export all contacts as JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cards, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `business_cards_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูลนามบัตรเรียบร้อย');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400/40 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        totalCards={cards.length}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenManualAdd={() => {
          setFormInitialData(null);
          setFormMode('create');
          setIsFormOpen(true);
        }}
        onResetDemo={handleResetDemo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Hero Action Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 pt-6 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>AI Optical Character Recognition (OCR)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                ถ่ายรูปนามบัตร บันทึกลงฐานข้อมูล <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">กดโทรออก หรือ LINE ได้ทันที</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                ระบบสกัดชื่อผู้ถือนามบัตร, บริษัท, ตำแหน่ง, อีเมล, เบอร์โทร และ LINE ID อัตโนมัติ สามารถกดโทรออก ส่งอีเมล หรือเปิด LINE จากข้อมูลที่บันทึกไว้ได้ทันที
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 border border-blue-400/30 transform hover:-translate-y-0.5 active:scale-95 transition"
              >
                <Camera className="w-5 h-5 text-cyan-300" />
                <span>ถ่ายรูป / สแกนนามบัตร</span>
              </button>

              <button
                onClick={() => {
                  setFormInitialData(null);
                  setFormMode('create');
                  setIsFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-sm transition"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>เพิ่มข้อมูลเอง</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">บริษัทในฐานข้อมูล</p>
                <p className="text-lg font-bold text-white">{stats.companies} <span className="text-xs font-normal text-slate-400">แห่ง</span></p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">นามบัตรทั้งหมด</p>
                <p className="text-lg font-bold text-white">{stats.total} <span className="text-xs font-normal text-slate-400">ใบ</span></p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">พร้อมกดโทรออก</p>
                <p className="text-lg font-bold text-emerald-400">{stats.withPhone} <span className="text-xs font-normal text-slate-400">เบอร์</span></p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">พร้อมแชท LINE</p>
                <p className="text-lg font-bold text-green-400">{stats.withLine} <span className="text-xs font-normal text-slate-400">บัญชี</span></p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Controls: Tag filter, sorting, view modes, and export */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          
          {/* Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedTag === null
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              ทั้งหมด ({cards.length})
            </button>
            {allTags.map((tag) => {
              const count = cards.filter((c) => c.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  #{tag} ({count})
                </button>
              );
            })}
          </div>

          {/* Right Toolbar: Sort, View mode, Export */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-slate-900 text-white">ล่าสุด</option>
                <option value="name" className="bg-slate-900 text-white">เรียงตามชื่อ</option>
                <option value="company" className="bg-slate-900 text-white">เรียงตามบริษัท</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                title="มุมมองแบบการ์ดนามบัตร"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="มุมมองแบบตารางรายชื่อ"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Backup export */}
            <button
              onClick={handleExportJSON}
              title="ส่งออกไฟล์สำรองข้อมูล (JSON)"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">สำรองข้อมูล</span>
            </button>

          </div>

        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 h-64 animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                  <div className="h-6 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-slate-800 rounded" />
                  <div className="h-8 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAndSortedCards.length === 0 && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto my-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {searchQuery || selectedTag ? 'ไม่พบนามบัตรที่ตรงกับเงื่อนไข' : 'ยังไม่มีนามบัตรในระบบ'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery || selectedTag
                  ? 'ลองล้างคำค้นหาหรือตัวกรองหมวดหมู่เพื่อดูนามบัตรทั้งหมด'
                  : 'เริ่มต้นด้วยการถ่ายรูปนามบัตร ระบบจะอ่านข้อมูลและบันทึกลงฐานข้อมูลให้อัตโนมัติ หรือโหลดนามบัตรตัวอย่างเพื่อทดสอบ'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" /> ถ่ายรูปสแกนนามบัตร
              </button>
              <button
                onClick={handleResetDemo}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> โหลดข้อมูลตัวอย่าง
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: GRID MODE (Executive Card View) */}
        {!isLoading && filteredAndSortedCards.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedCards.map((card) => (
              <BusinessCardItem
                key={card.id}
                card={card}
                onEdit={(c) => {
                  setFormInitialData(c);
                  setFormMode('edit');
                  setIsFormOpen(true);
                }}
                onDelete={(c) => setCardToDelete(c)}
                onViewDetails={(c) => setSelectedCardForDetail(c)}
              />
            ))}
          </div>
        )}

        {/* VIEW 2: TABLE MODE (Dense Management List) */}
        {!isLoading && filteredAndSortedCards.length > 0 && viewMode === 'table' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/80 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">ผู้ถือนามบัตร</th>
                    <th className="px-4 py-3">บริษัท & ตำแหน่ง</th>
                    <th className="px-4 py-3 text-emerald-400">เบอร์โทร (กดโทรได้)</th>
                    <th className="px-4 py-3 text-cyan-400">อีเมล (กดส่งได้)</th>
                    <th className="px-4 py-3 text-green-400">LINE ID</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAndSortedCards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Name */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedCardForDetail(card)}
                          className="font-bold text-white hover:text-indigo-400 transition text-left"
                        >
                          {card.name}
                        </button>
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {card.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[9px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Company & Position */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{card.companyName}</div>
                        <div className="text-[11px] text-slate-400">{card.position || '-'}</div>
                      </td>

                      {/* Phone with Direct Call */}
                      <td className="px-4 py-3">
                        {card.phone ? (
                          <a
                            href={getTelHref(card.phone)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-lg transition font-medium"
                            title="กดโทรออกทันที"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{card.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Email with Direct Mail */}
                      <td className="px-4 py-3">
                        {card.email ? (
                          <a
                            href={getMailHref(card.email, card.name)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-lg transition font-medium max-w-[200px] truncate"
                            title="กดเขียนอีเมลทันที"
                          >
                            <Mail className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{card.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* LINE ID */}
                      <td className="px-4 py-3">
                        {card.lineId ? (
                          <a
                            href={getLineHref(card.lineId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-950/40 hover:bg-green-900/60 border border-green-500/30 text-green-300 rounded-lg transition font-medium"
                            title="กดเปิด LINE"
                          >
                            <MessageSquare className="w-3 h-3 text-green-400" />
                            <span>{card.lineId}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCardForDetail(card)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
                            title="ดูข้อมูล"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => downloadVCard(card)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700/60 transition"
                            title="ดาวน์โหลด vCard"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setFormInitialData(card);
                              setFormMode('edit');
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-700/60 transition"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCardToDelete(card)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/60 transition"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Smart Card Vault • สแกนนามบัตรและจัดเก็บลงฐานข้อมูลอัจฉริยะด้วย AI Vision</p>
      </footer>

      {/* MODALS */}
      {/* 1. Camera & Scan Modal */}
      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* 2. Card Form Modal (Create / Edit / Review Scan) */}
      <CardFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formInitialData}
        mode={formMode}
      />

      {/* 3. Card Detail Modal */}
      <CardDetailModal
        card={selectedCardForDetail}
        isOpen={!!selectedCardForDetail}
        onClose={() => setSelectedCardForDetail(null)}
        onEdit={(card) => {
          setSelectedCardForDetail(null);
          setFormInitialData(card);
          setFormMode('edit');
          setIsFormOpen(true);
        }}
        onDelete={(card) => {
          setCardToDelete(card);
        }}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteConfirmModal
        card={cardToDelete}
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

    </div>
  );
}
