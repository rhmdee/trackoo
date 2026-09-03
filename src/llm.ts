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
   - "INSTALLMENT" (pendaftaran cicilan baru, kredit barang, pinjaman berjangka)
2. "amount": Angka nominal (integer murni). Jika cicilan, ini adalah total hutang/harga barang keseluruhan jika disebutkan, atau nominal cicilan.
   Contoh konversi:
   - 25k / 25rb -> 25000
   - 1.5jt / 1,5 juta -> 1500000
   - 500 perak -> 500
3. "category": Kategori singkat dalam bahasa Indonesia (misal: "Makanan & Minuman", "Transportasi", "Tagihan", "Gaji", "Belanja", "Hiburan", "Lain-lain").
4. "counterparty": Nama orang atau pihak terkait/institusi (misal: "Budi", "Andi", "Kredivo", "ShopeePayLater", "BCA"). Beri null jika tidak ada.
5. "description": Deskripsi singkat transaksi (misal: "makan siang ayam geprek", "kopi kenangan", "hp oppo a92").
6. "tenor": Khusus untuk type "INSTALLMENT", jumlah bulan/kali cicilan (integer murni, misal: 12x -> 12). Berikan null jika bukan cicilan.
7. "due_date": Khusus untuk type "INSTALLMENT", tanggal jatuh tempo tiap bulan (integer 1-31) jika disebutkan. Berikan null jika tidak ada.
8. PENTING: Jika teks pengguna sama sekali BUKAN atau TIDAK BERKAITAN dengan transaksi keuangan (contoh: ngobrol biasa, cuaca, curhat, sapaan tanpa nominal uang), JANGAN mengarang data. Kembalikan JSON kosong {}.

PENTING:
- Hanya kembalikan objek JSON yang valid.
- Jangan tambahkan format markdown seperti backtick json atau penjelasan lainnya.
`;

export interface ParsedTransaction {
  type: 'EXPENSE' | 'INCOME' | 'DEBT' | 'RECEIVABLE' | 'INSTALLMENT';
  amount: number;
  category: string;
  counterparty: string | null;
  description: string;
  tenor?: number | null;
  due_date?: number | null;
}

export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  try {
    // Timeout 10 detik untuk respon cepat
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out (10s)")), 10000)
    );

    const apiPromise = ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as any;
    if (!response) return null;

    const rawText = response.text || "{}";
    return JSON.parse(rawText) as ParsedTransaction;
  } catch (err) {
    console.error("Gagal memanggil Gemini API:", err);
    return null;
  }
}
