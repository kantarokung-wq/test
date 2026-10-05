export interface BusinessCard {
  id: string;
  name: string;             // ชื่อผู้ถือนามบัตร
  companyName: string;      // ชื่อบริษัท
  position: string;         // ตำแหน่ง
  email: string;            // E-mail
  phone: string;            // เบอร์โทร
  lineId: string;           // LINE ID
  website?: string;         // เว็บไซต์ (ถ้ามี)
  address?: string;         // ที่อยู่บริษัท (ถ้ามี)
  notes?: string;           // บันทึกเพิ่มเติม
  tags: string[];           // ป้ายกำกับ / หมวดหมู่
  imageUrl?: string;        // ภาพถ่ายนามบัตร (Base64 หรือ URL)
  createdAt: string;        // วันที่บันทึก
  updatedAt: string;        // วันที่แก้ไข
}

export interface ScanCardResponse {
  success: boolean;
  data?: Partial<BusinessCard>;
  error?: string;
}
