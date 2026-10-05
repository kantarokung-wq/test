import { BusinessCard } from '../types/card';
import {
  getCardsFromFirestore,
  saveCardToFirestore,
  updateCardInFirestore,
  deleteCardFromFirestore,
  subscribeToFirestoreCards,
  seedFirestoreCardsIfEmpty,
} from './firebase';

const STORAGE_KEY = 'smart_card_vault_local_cache';

const INITIAL_SEED_CARDS: BusinessCard[] = [
  {
    id: 'card-1',
    name: 'คุณสมชาย วัฒนพาณิชย์',
    companyName: 'บริษัท สยามนวัตกรรม เทคโนโลยี จำกัด',
    position: 'กรรมการผู้จัดการ (Managing Director)',
    email: 'somchai.w@siaminnovation.co.th',
    phone: '081-234-5678',
    lineId: 'somchai_si',
    website: 'https://www.siaminnovation.co.th',
    address: 'อาคารเอ็กเชน ทาวเวอร์ ชั้น 24 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    notes: 'ติดต่อเรื่องพัฒนาระบบ AI และซอฟต์แวร์องค์กร นัดประชุมได้วันอังคาร-พฤหัส',
    tags: ['ผู้บริหาร', 'คู่ค้า', 'เทคโนโลยี'],
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'card-2',
    name: 'คุณนภัสสร อัครเดชา',
    companyName: 'บมจ. บียอนด์ ดิจิทัล โซลูชั่นส์',
    position: 'ผู้อำนวยการฝ่ายการตลาด (Head of Marketing)',
    email: 'napassorn.a@beyonddigital.th',
    phone: '089-876-5432',
    lineId: 'napas_beyond',
    website: 'https://beyonddigital.th',
    address: '999/9 อาคารเดอะไนน์ ทาวเวอร์ส พระราม 9 ห้วยขวาง กรุงเทพฯ 10310',
    notes: 'สนใจแคมเปญ Digital Marketing และ Influencer Outreach ไตรมาส 4',
    tags: ['การตลาด', 'ลูกค้า', 'VIP'],
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'card-3',
    name: 'คุณกิตติศักดิ์ พงศ์พิสุทธิ์',
    companyName: 'หจก. ออริจินัล ดีไซน์ แอนด์ สตูดิโอ',
    position: 'หัวหน้าทีมออกแบบสถาปัตยกรรม (Senior Architect)',
    email: 'kittisak@original-design.com',
    phone: '092-345-6789',
    lineId: 'kitti_arch',
    website: 'https://original-design.com',
    address: '45/8 ถนนนิมมานเหมินท์ ซอย 11 ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200',
    notes: 'ผู้เชี่ยวชาญการออกแบบอาคารสำนักงานที่เป็นมิตรกับสิ่งแวดล้อม (LEED Certified)',
    tags: ['สถาปนิก', 'พาร์ทเนอร์'],
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Fetch all cards from Firebase Firestore (with fallback)
export async function fetchCards(q?: string, tag?: string): Promise<BusinessCard[]> {
  try {
    let cards = await getCardsFromFirestore();
    
    // If Firestore is empty initially, seed it with sample cards
    if (cards.length === 0) {
      cards = await seedFirestoreCardsIfEmpty(INITIAL_SEED_CARDS);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      // Ignore quota errors
    }

    if (tag) {
      cards = cards.filter((c) => c.tags?.includes(tag));
    }
    if (q) {
      const query = q.toLowerCase().trim();
      cards = cards.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.companyName.toLowerCase().includes(query) ||
          c.position.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.lineId.toLowerCase().includes(query)
      );
    }

    return cards;
  } catch (err) {
    console.warn('Firestore fetch error, falling back to server API:', err);
    // Fallback to server /api/cards
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tag) params.set('tag', tag);
      const res = await fetch(`/api/cards?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
    } catch (apiErr) {
      console.warn('Fallback to local storage cache:', apiErr);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    return INITIAL_SEED_CARDS;
  }
}

// Subscribe to real-time updates from Firebase
export function subscribeToCards(
  onUpdate: (cards: BusinessCard[]) => void,
  onError?: (err: any) => void
) {
  return subscribeToFirestoreCards(onUpdate, onError);
}

// Create new card in Firebase Firestore
export async function createCard(
  card: Omit<BusinessCard, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessCard> {
  try {
    const savedCard = await saveCardToFirestore(card);
    // Also sync to backend server DB for redundancy
    fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    }).catch(() => {});
    return savedCard;
  } catch (err) {
    console.warn('Firestore write failed, falling back to server API:', err);
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    const data = await res.json();
    return data.data;
  }
}

// Update card in Firebase Firestore
export async function updateCard(
  id: string,
  card: Partial<BusinessCard>
): Promise<BusinessCard> {
  try {
    const updated = await updateCardInFirestore(id, card);
    fetch(`/api/cards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    }).catch(() => {});
    return updated;
  } catch (err) {
    console.warn('Firestore update failed, falling back to server API:', err);
    const res = await fetch(`/api/cards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    const data = await res.json();
    return data.data;
  }
}

// Delete card from Firebase Firestore
export async function deleteCard(id: string): Promise<boolean> {
  try {
    await deleteCardFromFirestore(id);
    fetch(`/api/cards/${id}`, { method: 'DELETE' }).catch(() => {});
    return true;
  } catch (err) {
    console.warn('Firestore delete failed, falling back to server API:', err);
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  }
}

// AI Card Vision Scan (proxies through secure server-side route)
export async function scanCard(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<Partial<BusinessCard>> {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to scan card');
  }
  return data.data;
}

// Reset seed cards into Firebase Firestore
export async function resetSeedCards(): Promise<BusinessCard[]> {
  for (const card of INITIAL_SEED_CARDS) {
    await saveCardToFirestore(card).catch(() => {});
  }
  return INITIAL_SEED_CARDS;
}

// Action helpers
export function getCleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function getTelHref(phone: string): string {
  const clean = getCleanPhone(phone);
  return `tel:${clean || phone}`;
}

export function getMailHref(email: string, name?: string): string {
  const subject = encodeURIComponent(`สวัสดีคุณ ${name || ''} - ติดต่อจากนามบัตร`);
  return `mailto:${email}?subject=${subject}`;
}

export function getLineHref(lineId: string): string {
  const cleanId = lineId.replace(/^@/, '').trim();
  return `https://line.me/ti/p/~${cleanId}`;
}

export function getMapHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// vCard (.vcf) generator for iOS & Android contacts
export function downloadVCard(card: BusinessCard) {
  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.name}`,
    `ORG:${card.companyName}`,
    `TITLE:${card.position}`,
    `TEL;TYPE=CELL,VOICE:${card.phone}`,
    `EMAIL;TYPE=WORK,INTERNET:${card.email}`,
  ];

  if (card.website) {
    vcardLines.push(`URL:${card.website}`);
  }
  if (card.address) {
    vcardLines.push(`ADR;TYPE=WORK:;;${card.address};;;;`);
  }
  if (card.lineId) {
    vcardLines.push(`X-LINE-ID:${card.lineId}`);
    vcardLines.push(`NOTE:LINE ID: ${card.lineId}${card.notes ? ' \\n' + card.notes : ''}`);
  } else if (card.notes) {
    vcardLines.push(`NOTE:${card.notes}`);
  }

  vcardLines.push('END:VCARD');

  const blob = new Blob([vcardLines.join('\r\n')], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${card.name.replace(/\s+/g, '_')}_contact.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
