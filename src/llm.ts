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
   - "PAY_INSTALLMENT" (membayar angsuran cicilan yang sudah ada, atau mengabarkan sudah bayar cicilan sekian kali, misal: "tagihan kredivo iphone 14 sudah bayar 4x", "bayar cicilan oppo", "kredivo iphone bayar 1x")
2. "amount": Angka nominal (integer murni). Jika cicilan, ini adalah total hutang/harga barang keseluruhan jika disebutkan, atau nominal cicilan. Beri null jika tidak disebutkan pada type "PAY_INSTALLMENT".
   Contoh konversi:
   - 25k / 25rb -> 25000
   - 1.5jt / 1,5 juta -> 1500000
   - 500 perak -> 500
3. "category": Kategori singkat dalam bahasa Indonesia (misal: "Makanan & Minuman", "Transportasi", "Tagihan", "Gaji", "Belanja", "Hiburan", "Lain-lain").
4. "counterparty": Nama orang atau pihak terkait/institusi (misal: "Budi", "Andi", "Kredivo", "ShopeePayLater", "BCA"). Beri null jika tidak ada.
5. "description": Deskripsi singkat transaksi atau nama barang (misal: "makan siang ayam geprek", "kopi kenangan", "hp oppo a92", "iphone 14").
6. "tenor": Khusus untuk type "INSTALLMENT", jumlah total bulan/kali cicilan (integer murni, misal: 12x -> 12). Berikan null jika bukan cicilan.
7. "paid_count": Khusus jika pengguna menyebutkan sudah membayar cicilan berapa kali (contoh: "sudah bayar 4x" -> 4, "bayar cicilan ke-2" -> 2, "bayar 1x" -> 1). Berikan null jika tidak ada.
8. "due_date": Khusus untuk type "INSTALLMENT", tanggal jatuh tempo tiap bulan (integer 1-31) jika disebutkan. Berikan null jika tidak ada.
9. "transaction_date": Tanggal transaksi dalam format ISO string "YYYY-MM-DD" jika pengguna menyebutkan waktu atau tanggal lampau/relatif (contoh: "kemarin", "kemarin lusa", "3 hari lalu", "28 agustus", "tgl 15"). Jika pengguna TIDAK menyebutkan tanggal lampau atau waktu tertentu, berikan null (default transaksi hari ini).
10. PENTING: Jika teks pengguna sama sekali BUKAN atau TIDAK BERKAITAN dengan transaksi keuangan (contoh: ngobrol biasa, cuaca, curhat, sapaan tanpa nominal uang), JANGAN mengarang data. Kembalikan JSON kosong {}.

PENTING:
- Hanya kembalikan objek JSON yang valid.
- Jangan tambahkan format markdown seperti backtick json atau penjelasan lainnya.
`;

export interface ParsedTransaction {
  type: 'EXPENSE' | 'INCOME' | 'DEBT' | 'RECEIVABLE' | 'INSTALLMENT' | 'PAY_INSTALLMENT';
  amount: number | null;
  category: string;
  counterparty: string | null;
  description: string;
  tenor?: number | null;
  paid_count?: number | null;
  due_date?: number | null;
  transaction_date?: string | null;
}

export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  try {
    const todayDate = new Date().toISOString().split('T')[0];
    const dynamicPrompt = `${SYSTEM_PROMPT}\nINFORMASI WAKTU SAAT INI:\nTanggal hari ini adalah ${todayDate}. Gunakan ini sebagai acuan jika pengguna menyebut kata relatif seperti "kemarin", "kemarin lusa", atau nama hari/bulan.`;

    // Timeout 20 detik untuk kehandalan ekstra
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out (20s)")), 20000)
    );

    const apiPromise = ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: text,
      config: {
        systemInstruction: dynamicPrompt,
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
