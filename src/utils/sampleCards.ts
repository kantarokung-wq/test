// Sample business card graphic generator (creates realistic visual card images as data URLs)
export interface SampleCardPreset {
  id: string;
  title: string;
  subtitle: string;
  colorScheme: string;
  svgDataUrl: string;
}

function createCardSvgDataUrl(
  company: string,
  personName: string,
  position: string,
  phone: string,
  email: string,
  line: string,
  theme: 'blue' | 'emerald' | 'dark'
): string {
  const bg = theme === 'blue' 
    ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' 
    : theme === 'emerald'
    ? 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)';

  const accentColor = theme === 'emerald' ? '#34d399' : theme === 'blue' ? '#93c5fd' : '#f59e0b';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
    <defs>
      <linearGradient id="bg-${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${theme === 'blue' 
          ? '<stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="#2563eb"/>'
          : theme === 'emerald'
          ? '<stop offset="0%" stop-color="#064e3b"/><stop offset="100%" stop-color="#059669"/>'
          : '<stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/>'
        }
      </linearGradient>
    </defs>
    <rect width="600" height="350" rx="16" fill="url(#bg-${theme})"/>
    <!-- Decorative geometric accent lines -->
    <circle cx="560" cy="40" r="140" fill="white" opacity="0.04" />
    <circle cx="560" cy="40" r="80" fill="white" opacity="0.05" />
    <rect x="0" y="338" width="600" height="12" fill="${accentColor}" />

    <!-- Company Header -->
    <g transform="translate(40, 50)">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="${accentColor}" />
      <path d="M 8 16 L 16 8 L 24 16 L 16 24 Z" fill="#ffffff" />
      <text x="44" y="22" font-family="'Sarabun', sans-serif" font-size="20" font-weight="700" fill="#ffffff">${company}</text>
    </g>

    <!-- Person Name & Position -->
    <g transform="translate(40, 140)">
      <text x="0" y="0" font-family="'Sarabun', sans-serif" font-size="26" font-weight="800" fill="#ffffff">${personName}</text>
      <text x="0" y="28" font-family="'Sarabun', sans-serif" font-size="16" font-weight="500" fill="${accentColor}">${position}</text>
    </g>

    <!-- Contact details -->
    <g transform="translate(40, 220)" font-family="'Sarabun', sans-serif" font-size="14" fill="#f8fafc">
      <!-- Phone -->
      <g transform="translate(0, 0)">
        <text x="0" y="0" font-weight="700" fill="${accentColor}">TEL:</text>
        <text x="45" y="0">${phone}</text>
      </g>
      <!-- Email -->
      <g transform="translate(0, 28)">
        <text x="0" y="0" font-weight="700" fill="${accentColor}">EMAIL:</text>
        <text x="55" y="0">${email}</text>
      </g>
      <!-- LINE -->
      <g transform="translate(0, 56)">
        <text x="0" y="0" font-weight="700" fill="#22c55e">LINE ID:</text>
        <text x="65" y="0">${line}</text>
      </g>
    </g>

    <!-- Mini QR representation placeholder on right -->
    <g transform="translate(480, 210)">
      <rect x="0" y="0" width="75" height="75" rx="8" fill="#ffffff" />
      <rect x="8" y="8" width="20" height="20" fill="#0f172a" />
      <rect x="12" y="12" width="12" height="12" fill="#ffffff" />
      <rect x="47" y="8" width="20" height="20" fill="#0f172a" />
      <rect x="51" y="12" width="12" height="12" fill="#ffffff" />
      <rect x="8" y="47" width="20" height="20" fill="#0f172a" />
      <rect x="12" y="51" width="12" height="12" fill="#ffffff" />
      <rect x="34" y="34" width="8" height="8" fill="#0f172a" />
      <rect x="48" y="48" width="16" height="16" fill="#0f172a" />
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_CARD_PRESETS: SampleCardPreset[] = [
  {
    id: 'sample-1',
    title: 'คุณปกรณ์ วิชิตการกุล',
    subtitle: 'บริษัท ฟิวเจอร์เทค อินโนเวชั่น จำกัด',
    colorScheme: 'Blue Tech',
    svgDataUrl: createCardSvgDataUrl(
      'บริษัท ฟิวเจอร์เทค อินโนเวชั่น จำกัด',
      'คุณปกรณ์ วิชิตการกุล',
      'Chief Technology Officer (CTO)',
      '086-999-8877',
      'pakorn.w@futuretech.in.th',
      'pakorn_ft',
      'blue'
    )
  },
  {
    id: 'sample-2',
    title: 'คุณอลิสา สุวรรณโชติ',
    subtitle: 'บริษัท กรีนฮาร์เวสต์ อะกริดีเวลลอปเมนท์ จำกัด',
    colorScheme: 'Emerald Bio',
    svgDataUrl: createCardSvgDataUrl(
      'บริษัท กรีนฮาร์เวสต์ อะกริดีเวลลอปเมนท์ จำกัด',
      'คุณอลิสา สุวรรณโชติ',
      'ผู้อำนวยการฝ่ายพัฒนาธุรกิจ (Business Development Director)',
      '082-456-7890',
      'alisa.s@greenharvest.co.th',
      'alisa_green',
      'emerald'
    )
  },
  {
    id: 'sample-3',
    title: 'Dr. Robert Tan (ดร. โรเบิร์ต ตัน)',
    subtitle: 'Apex Global Financial Advisory Ltd.',
    colorScheme: 'Dark Executive',
    svgDataUrl: createCardSvgDataUrl(
      'Apex Global Financial Advisory Ltd.',
      'Dr. Robert Tan (ดร. โรเบิร์ต ตัน)',
      'Senior Vice President & Wealth Advisor',
      '094-888-5544',
      'robert.tan@apexadvisor.com',
      'roberttan_apex',
      'dark'
    )
  }
];

// Helper to convert File to base64 with optional client-side downscale if high resolution photo
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Downscale high-res camera captures (e.g. 12MP photos) to 1600px width for fast Gemini inference
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
            return;
          }
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
