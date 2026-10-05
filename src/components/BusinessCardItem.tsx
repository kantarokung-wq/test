import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Globe, MapPin, Download, Edit3, Trash2, Eye, Building2, User, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { BusinessCard } from '../types/card';
import { getTelHref, getMailHref, getLineHref, getMapHref, downloadVCard } from '../services/api';

interface BusinessCardItemProps {
  card: BusinessCard;
  onEdit: (card: BusinessCard) => void;
  onDelete: (card: BusinessCard) => void;
  onViewDetails: (card: BusinessCard) => void;
}

export const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="group relative bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between">
      
      {/* Top Bar: Company & Image Badge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition truncate" title={card.companyName}>
                {card.companyName}
              </h3>
              {card.website && (
                <a
                  href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 truncate"
                >
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{card.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>
          </div>

          {/* Photo indicator */}
          {card.imageUrl ? (
            <button
              onClick={() => onViewDetails(card)}
              title="คลิกเพื่อดูรูปภาพนามบัตรต้นฉบับ"
              className="flex items-center gap-1 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-700 transition flex-shrink-0"
            >
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span>ดูรูปจริง</span>
            </button>
          ) : null}
        </div>

        {/* Cardholder Name & Position */}
        <div className="mb-4 bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
              <span>{card.name}</span>
            </h4>
          </div>
          {card.position && (
            <p className="text-xs font-medium text-indigo-300/90 mt-0.5">
              {card.position}
            </p>
          )}
        </div>

        {/* Actionable Contact Items (The core requirement!) */}
        <div className="space-y-2 mb-4">
          
          {/* 1. Phone with Call & Copy */}
          {card.phone ? (
            <div className="flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700/60 transition group/row">
              <a
                href={getTelHref(card.phone)}
                title="กดเพื่อโทรออกทันที"
                className="flex items-center gap-2.5 text-xs text-slate-200 hover:text-emerald-400 font-medium flex-1 min-w-0"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="truncate tracking-wide">{card.phone}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold ml-auto sm:ml-0">
                  โทรออก
                </span>
              </a>
              <button
                onClick={(e) => copyToClipboard(card.phone, 'phone', e)}
                title="คัดลอกเบอร์โทร"
                className="text-slate-400 hover:text-white p-1 ml-2 transition"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic px-1">ไม่ได้ระบุเบอร์โทร</div>
          )}

          {/* 2. Email with Send & Copy */}
          {card.email ? (
            <div className="flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700/60 transition group/row">
              <a
                href={getMailHref(card.email, card.name)}
                title="กดเพื่อเขียนอีเมลทันที"
                className="flex items-center gap-2.5 text-xs text-slate-200 hover:text-cyan-400 font-medium flex-1 min-w-0"
              >
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{card.email}</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded font-semibold ml-auto sm:ml-0">
                  ส่งอีเมล
                </span>
              </a>
              <button
                onClick={(e) => copyToClipboard(card.email, 'email', e)}
                title="คัดลอกอีเมล"
                className="text-slate-400 hover:text-white p-1 ml-2 transition"
              >
                {copiedField === 'email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : null}

          {/* 3. LINE ID with Open & Copy */}
          {card.lineId ? (
            <div className="flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700/60 transition group/row">
              <a
                href={getLineHref(card.lineId)}
                target="_blank"
                rel="noopener noreferrer"
                title="กดเพื่อเปิด LINE หรือเพิ่มเพื่อน"
                className="flex items-center gap-2.5 text-xs text-slate-200 hover:text-green-400 font-medium flex-1 min-w-0"
              >
                <div className="w-6 h-6 rounded-md bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">LINE: <span className="font-semibold text-white">{card.lineId}</span></span>
                <span className="text-[10px] text-green-400 bg-green-950/60 border border-green-500/30 px-1.5 py-0.2 rounded font-semibold ml-auto sm:ml-0">
                  เปิด LINE
                </span>
              </a>
              <button
                onClick={(e) => copyToClipboard(card.lineId, 'line', e)}
                title="คัดลอก LINE ID"
                className="text-slate-400 hover:text-white p-1 ml-2 transition"
              >
                {copiedField === 'line' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : null}

        </div>

        {/* Address if available */}
        {card.address && (
          <div className="mb-3 text-[11px] text-slate-400 flex items-start gap-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <a
              href={getMapHref(card.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition truncate"
              title={card.address}
            >
              {card.address}
            </a>
          </div>
        )}

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium bg-slate-800 text-indigo-300 border border-slate-700/80 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 text-slate-400">
        
        {/* Left: View Details & Download vCard */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetails(card)}
            title="ดูรายละเอียดข้อมูลทั้งหมด"
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700/80 transition"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>ดูข้อมูล</span>
          </button>

          <button
            onClick={() => downloadVCard(card)}
            title="ดาวน์โหลด vCard บันทึกลงมือถือ (Contacts)"
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-emerald-300 bg-slate-800/80 hover:bg-slate-700 px-2 py-1.5 rounded-lg border border-slate-700/80 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">บันทึกลงเครื่อง (.vcf)</span>
          </button>
        </div>

        {/* Right: Edit & Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(card)}
            title="แก้ไขข้อมูลนามบัตร"
            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(card)}
            title="ลบนามบัตร"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
