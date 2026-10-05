import React, { useState } from 'react';
import { X, Building2, User, Briefcase, Phone, Mail, MessageSquare, Globe, MapPin, Tag, FileText, Download, Edit3, Trash2, Copy, Check, ExternalLink, Calendar, QrCode } from 'lucide-react';
import { BusinessCard } from '../types/card';
import { getTelHref, getMailHref, getLineHref, getMapHref, downloadVCard } from '../services/api';

interface CardDetailModalProps {
  card: BusinessCard | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: BusinessCard) => void;
  onDelete: (card: BusinessCard) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);

  if (!isOpen || !card) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Generate QR code URL using public QR code SVG API for crisp contact scanning
  const qrData = `MECARD:N:${card.name};ORG:${card.companyName};TIL:${card.position};TEL:${card.phone};EMAIL:${card.email};NOTE:LINE:${card.lineId};;`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {card.companyName}
              </h2>
              <p className="text-xs text-indigo-300 font-medium">
                {card.position || 'ข้อมูลนามบัตร'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(card)}
              className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
              title="แก้ไข"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(card)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              title="ลบ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Cardholder Big Banner */}
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-800/80 to-slate-900 p-5 rounded-2xl border border-indigo-500/20 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
                <User className="w-3.5 h-3.5" />
                <span>ผู้ถือนามบัตร</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {card.name}
              </h3>
              {card.position && (
                <p className="text-sm font-medium text-indigo-200 mt-1">
                  {card.position}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => downloadVCard(card)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>บันทึกลง Contacts</span>
              </button>

              <button
                onClick={() => setShowQr(!showQr)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'ซ่อน QR Code' : 'แสดง QR Code'}</span>
              </button>
            </div>
          </div>

          {/* Contact QR Code Popout */}
          {showQr && (
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-2 bg-white rounded-xl shadow-lg flex-shrink-0">
                <img src={qrCodeUrl} alt="Contact QR Code" className="w-36 h-36" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  สแกนเพื่อบันทึกรายชื่อลงโทรศัพท์มือถือ
                </h4>
                <p className="text-xs text-slate-300">
                  เปิดแอปกล้องใน iPhone หรือ Android ส่อง QR Code นี้เพื่อเพิ่มเบอร์โทรและข้อมูลของ {card.name} ลงสมุดโทรศัพท์ได้ทันที
                </p>
              </div>
            </div>
          )}

          {/* Quick Action Grid (Large Clickable Buttons for User Execution) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Phone */}
            {card.phone ? (
              <div className="bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Phone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์
                  </span>
                  <button
                    onClick={() => copyToClipboard(card.phone, 'phone')}
                    title="คัดลอกเบอร์"
                    className="hover:text-white"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-bold text-white text-sm tracking-wide truncate mb-2">
                  {card.phone}
                </div>
                <a
                  href={getTelHref(card.phone)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Phone className="w-3 h-3" /> โทรออกทันที
                </a>
              </div>
            ) : null}

            {/* Email */}
            {card.email ? (
              <div className="bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Mail className="w-3.5 h-3.5" /> อีเมล
                  </span>
                  <button
                    onClick={() => copyToClipboard(card.email, 'email')}
                    title="คัดลอกอีเมล"
                    className="hover:text-white"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-bold text-white text-xs truncate mb-2" title={card.email}>
                  {card.email}
                </div>
                <a
                  href={getMailHref(card.email, card.name)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Mail className="w-3 h-3" /> เขียนอีเมล
                </a>
              </div>
            ) : null}

            {/* LINE ID */}
            {card.lineId ? (
              <div className="bg-slate-800/80 hover:bg-slate-800 border border-green-500/30 rounded-xl p-3 flex flex-col justify-between transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-green-400 font-semibold">
                    <MessageSquare className="w-3.5 h-3.5" /> LINE ID
                  </span>
                  <button
                    onClick={() => copyToClipboard(card.lineId, 'line')}
                    title="คัดลอก LINE ID"
                    className="hover:text-white"
                  >
                    {copiedField === 'line' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-bold text-white text-sm truncate mb-2">
                  {card.lineId}
                </div>
                <a
                  href={getLineHref(card.lineId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <MessageSquare className="w-3 h-3" /> เปิดแชท LINE
                </a>
              </div>
            ) : null}

          </div>

          {/* Secondary Details: Website, Address, Notes */}
          <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-xs">
            {/* Website */}
            {card.website && (
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> เว็บไซต์:
                </span>
                <a
                  href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                >
                  {card.website} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Address */}
            {card.address && (
              <div className="flex items-start justify-between py-1 border-b border-slate-800 gap-4">
                <span className="text-slate-400 flex items-center gap-2 flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> ที่อยู่บริษัท:
                </span>
                <a
                  href={getMapHref(card.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-200 hover:text-white text-right hover:underline"
                >
                  {card.address}
                </a>
              </div>
            )}

            {/* Tags */}
            {card.tags && card.tags.length > 0 && (
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> หมวดหมู่:
                </span>
                <div className="flex flex-wrap gap-1">
                  {card.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {card.notes && (
              <div className="pt-2">
                <span className="text-slate-400 flex items-center gap-2 font-medium mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> บันทึกเพิ่มเติม:
                </span>
                <p className="text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                  {card.notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> บันทึกเมื่อ: {new Date(card.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
              </span>
              <span>แก้ไขล่าสุด: {new Date(card.updatedAt).toLocaleDateString('th-TH', { dateStyle: 'short' })}</span>
            </div>
          </div>

          {/* Original Card Photo preview if attached */}
          {card.imageUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">ภาพถ่ายนามบัตรต้นฉบับ:</span>
                <button
                  onClick={() => setShowFullImage(!showFullImage)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {showFullImage ? 'ย่อขนาด' : 'คลิกเพื่อดูภาพเต็ม'}
                </button>
              </div>
              <div
                onClick={() => setShowFullImage(!showFullImage)}
                className={`cursor-pointer rounded-xl overflow-hidden border border-slate-800 bg-black transition ${
                  showFullImage ? 'max-h-[500px]' : 'max-h-56'
                } flex items-center justify-center`}
              >
                <img
                  src={card.imageUrl}
                  alt="Original business card"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => downloadVCard(card)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> ส่งออก vCard
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
