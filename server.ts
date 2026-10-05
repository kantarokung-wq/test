import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large payload for base64 card photos
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Database file setup
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cards.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface BusinessCard {
  id: string;
  name: string;
  companyName: string;
  position: string;
  email: string;
  phone: string;
  lineId: string;
  website?: string;
  address?: string;
  notes?: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial realistic seed cards (Thai business cards)
const SEED_CARDS: BusinessCard[] = [
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
  }
];

function readCards(): BusinessCard[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(SEED_CARDS, null, 2), 'utf8');
      return SEED_CARDS;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return SEED_CARDS;
  } catch (err) {
    console.error('Error reading database file:', err);
    return SEED_CARDS;
  }
}

function writeCards(cards: BusinessCard[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cards, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Ensure database is initialized
readCards();

// API Endpoints
// 1. Scan business card image using Gemini Vision
app.post('/api/scan', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Missing imageBase64' });
    }

    // Clean base64 data prefix if present (e.g., data:image/png;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const prompt = `Analyze this business card image and accurately extract all contact and company information.
Extract the following fields carefully:
- companyName: The full official company, business, or organization name in Thai and/or English.
- name: Full name of the person (cardholder) including honorific / title if present (e.g. คุณ, ดร., นาย, นางสาว, Dr., Mr., etc.).
- position: Job title, position, or division (e.g. Managing Director, กรรมการผู้จัดการ, Senior Developer, ผู้จัดการฝ่ายขาย).
- email: Clean email address.
- phone: Telephone or mobile phone number (format cleanly with hyphens, e.g., 081-234-5678 or +66 2 123 4567).
- lineId: LINE ID or contact ID (remove @ if followed by alphanumeric, or keep ID without URL prefix). If a LINE QR or LINE label is visible, extract the ID.
- website: Official website URL (include https:// if not present).
- address: Physical address of the company if visible.
- notes: Any memorable slogans, products, services, or additional info visible on the card.
- tags: 2 to 4 appropriate category tags in Thai, such as ["ผู้บริหาร", "เทคโนโลยี", "ลูกค้า", "ฝ่ายขาย"].

If any field is not found in the card, return an empty string "" for string fields, or empty array [] for tags.
Do not hallucinate info that is not on the card.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            name: { type: Type.STRING },
            position: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            lineId: { type: Type.STRING },
            website: { type: Type.STRING },
            address: { type: Type.STRING },
            notes: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['companyName', 'name', 'position', 'email', 'phone', 'lineId'],
        },
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error during card scan:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to scan business card',
    });
  }
});

// 2. GET all cards with optional search & filter
app.get('/api/cards', (req: Request, res: Response) => {
  const cards = readCards();
  const { q, tag } = req.query;

  let filtered = [...cards];

  if (typeof tag === 'string' && tag.trim()) {
    filtered = filtered.filter((c) => c.tags?.includes(tag));
  }

  if (typeof q === 'string' && q.trim()) {
    const query = q.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.companyName.toLowerCase().includes(query) ||
        c.position.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.lineId.toLowerCase().includes(query) ||
        (c.notes && c.notes.toLowerCase().includes(query))
    );
  }

  // Sort latest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ success: true, data: filtered });
});

// 3. POST new card
app.post('/api/cards', (req: Request, res: Response) => {
  try {
    const { name, companyName, position, email, phone, lineId, website, address, notes, tags, imageUrl } = req.body;

    if (!name || !companyName) {
      return res.status(400).json({ success: false, error: 'Name and Company Name are required' });
    }

    const cards = readCards();
    const newCard: BusinessCard = {
      id: 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: (name || '').trim(),
      companyName: (companyName || '').trim(),
      position: (position || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      lineId: (lineId || '').trim(),
      website: (website || '').trim(),
      address: (address || '').trim(),
      notes: (notes || '').trim(),
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      imageUrl: imageUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cards.unshift(newCard);
    writeCards(cards);

    return res.status(201).json({ success: true, data: newCard });
  } catch (err: any) {
    console.error('Error creating card:', err);
    return res.status(500).json({ success: false, error: 'Failed to create business card' });
  }
});

// 4. PUT update existing card
app.put('/api/cards/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cards = readCards();
    const index = cards.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    const current = cards[index];
    const { name, companyName, position, email, phone, lineId, website, address, notes, tags, imageUrl } = req.body;

    const updatedCard: BusinessCard = {
      ...current,
      name: name !== undefined ? String(name).trim() : current.name,
      companyName: companyName !== undefined ? String(companyName).trim() : current.companyName,
      position: position !== undefined ? String(position).trim() : current.position,
      email: email !== undefined ? String(email).trim() : current.email,
      phone: phone !== undefined ? String(phone).trim() : current.phone,
      lineId: lineId !== undefined ? String(lineId).trim() : current.lineId,
      website: website !== undefined ? String(website).trim() : current.website,
      address: address !== undefined ? String(address).trim() : current.address,
      notes: notes !== undefined ? String(notes).trim() : current.notes,
      tags: tags !== undefined && Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : current.tags,
      imageUrl: imageUrl !== undefined ? imageUrl : current.imageUrl,
      updatedAt: new Date().toISOString(),
    };

    cards[index] = updatedCard;
    writeCards(cards);

    return res.json({ success: true, data: updatedCard });
  } catch (err: any) {
    console.error('Error updating card:', err);
    return res.status(500).json({ success: false, error: 'Failed to update card' });
  }
});

// 5. DELETE card
app.delete('/api/cards/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cards = readCards();
    const filtered = cards.filter((c) => c.id !== id);

    if (filtered.length === cards.length) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    writeCards(filtered);
    return res.json({ success: true, message: 'Card deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting card:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete card' });
  }
});

// 6. Reset to seed demo cards
app.post('/api/cards/reset-seed', (_req: Request, res: Response) => {
  writeCards(SEED_CARDS);
  return res.json({ success: true, data: SEED_CARDS });
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Card Vault server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
