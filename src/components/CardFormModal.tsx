import React, { useState, useEffect } from 'react';
import { X, Building2, User, Briefcase, Phone, Mail, MessageSquare, Globe, MapPin, Tag, FileText, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { BusinessCard } from '../types/card';

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: Omit<BusinessCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Partial<BusinessCard> | null;
  mode: 'create' | 'edit' | 'review_scan';
}

const COMMON_TAGS = ['ผู้บริหาร', 'ลูกค้า', 'คู่ค้า', 'ฝ่ายขาย', 'ไอที/เทคโนโลยี', 'การตลาด', 'VIP', 'ซัพพลายเออร์'];

export const CardFormModal: React.FC<CardFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    position: '',
    phone: '',
    email: '',
    lineId: '',
    website: '',
    address: '',
    notes: '',
    tags: [] as string[],
    imageUrl: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        companyName: initialData.companyName || '',
        position: initialData.position || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        lineId: initialData.lineId || '',
        website: initialData.website || '',
        address: initialData.address || '',
        notes: initialData.notes || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        imageUrl: initialData.imageUrl || '',
      });
    } else {
      setFormData({
        name: '',
        companyName: '',
        position: '',
        phone: '',
        email: '',
        lineId: '',
        website: '',
        address: '',
        notes: '',
        tags: ['ลูกค้า'],
        imageUrl: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อผู้ถือนามบัตร';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'กรุณาระบุชื่อบริษัท / องค์กร';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              {mode === 'review_scan' ? <Sparkles className="w-4 h-4 text-cyan-300" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {mode === 'edit'
                  ? 'แก้ไขข้อมูลนามบัตร'
                  : mode === 'review_scan'
                  ? 'ตรวจสอบข้อมูลที่ AI สแกนได้'
                  : 'เพิ่มข้อมูลนามบัตรใหม่'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'review_scan'
                  ? 'AI สกัดข้อมูลจากภาพเรียบร้อยแล้ว ตรวจสอบหรือแก้ไขก่อนบันทึกลงฐานข้อมูล'
                  : 'กรอกรายละเอียดข้อมูลติดต่อและข้อมูลบริษัท'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-sm">
          
          {/* Card Snapshot thumbnail if available */}
          {formData.imageUrl && (
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-20 h-12 rounded-lg overflow-hidden border border-slate-700 bg-black flex-shrink-0">
                <img src={formData.imageUrl} alt="Card preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> มีรูปภาพนามบัตรแนบอยู่
                </span>
                <p className="text-[11px] text-slate-400 truncate">บันทึกรูปนี้ไว้ดูต้นฉบับได้ตลอดเวลา</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, imageUrl: '' }))}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-950/30 rounded transition"
              >
                ลบรูป
              </button>
            </div>
          )}

          {/* Row 1: Cardholder Name & Company Name (REQUIRED) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>ชื่อผู้ถือนามบัตร <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="เช่น คุณสมชาย วัฒนพาณิชย์"
                className={`w-full bg-slate-800/90 border rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.name ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>ชื่อบริษัท / องค์กร <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="เช่น บริษัท สยามนวัตกรรม จำกัด"
                className={`w-full bg-slate-800/90 border rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.companyName ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>}
            </div>
          </div>

          {/* Row 2: Position */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>ตำแหน่ง (Position)</span>
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="เช่น กรรมการผู้จัดการ, Head of Sales, Senior Architect"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Row 3: Phone, Email, LINE ID (Direct action triggers!) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>เบอร์โทร (โทรออกได้)</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="081-234-5678"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>อีเมล (ส่งเมลได้)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="somchai@company.com"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>

            {/* LINE ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                <span>LINE ID (เปิดแชทได้)</span>
              </label>
              <input
                type="text"
                name="lineId"
                value={formData.lineId}
                onChange={handleChange}
                placeholder="เช่น somchai_line"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
            </div>
          </div>

          {/* Row 4: Website & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>เว็บไซต์</span>
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.company.com"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>ที่อยู่บริษัท</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="เลขที่ ถนน เขต จังหวัด"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>หมวดหมู่ / ป้ายกำกับ (Tags)</span>
            </label>
            
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[11px] text-slate-400">เลือกด่วน:</span>
              {COMMON_TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleAddTag(t)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    formData.tags.includes(t)
                      ? 'bg-slate-700 text-slate-400 border-slate-700 opacity-60 cursor-default'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500 hover:text-white'
                  }`}
                >
                  +{t}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="พิมพ์ป้ายกำกับใหม่ แล้วกด Enter"
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl border border-slate-700 transition"
              >
                เพิ่ม
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>บันทึกเพิ่มเติม (Notes)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="เช่น ข้อมูลที่คุยกัน, โปรเจกต์ที่สนใจ, วันเวลาที่สะดวกติดต่อ..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-xs"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกลงฐานข้อมูล</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
