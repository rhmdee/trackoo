import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY tidak ditemukan di .env!");
}

// Inisialisasi Gemini Client
const ai = new GoogleGenAI({ apiKey });

// Definisi prompt sistem agar Gemini selalu mengembalikan JSON
const SYSTEM_PROMPT = `
Anda adalah asisten pencatat keuangan pribadi bernama Trackoo.
Tugas Anda adalah mengekstrak data dari pesan teks bahasa Indonesia (bisa bahasa sehari-hari, gaul, slang, atau singkatan) menjadi format JSON terstruktur.

Aturan Ekstraksi:
1. "type": WAJIB salah satu dari:
   - "EXPENSE" (pengeluaran/jajan/bayar sesuatu)
   - "INCOME" (pemasukan/gajian/dapat transferan/nemu uang)
   - "DEBT" (kita berhutang ke orang lain / minjam uang orang)
   - "RECEIVABLE" (orang lain berhutang ke kita / minjem uang kita)
2. "amount": Angka nominal (integer murni).
   Contoh konversi:
   - 25k / 25rb -> 25000
   - 1.5jt / 1,5 juta -> 1500000
   - 500 perak -> 500
3. "category": Kategori singkat dalam bahasa Indonesia (misal: "Makanan & Minuman", "Transportasi", "Tagihan", "Gaji", "Belanja", "Hiburan", "Lain-lain").
4. "counterparty": Nama orang atau pihak terkait khusus untuk DEBT dan RECEIVABLE (misal: "Budi", "Andi"). Beri null jika tidak ada.
5. "description": Deskripsi singkat transaksi (misal: "makan siang ayam geprek", "kopi kenangan").

PENTING:
- Hanya kembalikan objek JSON yang valid.
- Jangan tambahkan format markdown seperti \`\`\`json atau penjelasan lainnya.
`;

export interface ParsedTransaction {
  type: 'EXPENSE' | 'INCOME' | 'DEBT' | 'RECEIVABLE';
  amount: number;
  category: string;
  counterparty: string | null;
  description: string;
}

export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const rawText = response.text || "{}";
    return JSON.parse(rawText) as ParsedTransaction;
  } catch (err) {
    console.error("Gagal memanggil Gemini API:", err);
    return null;
  }
}
