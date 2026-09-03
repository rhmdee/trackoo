# Langkah 1: Setup LLM API (Google Gemini)

**Tujuan:** Mengintegrasikan model AI (LLM) untuk memproses teks natural dari pengguna menjadi data terstruktur (JSON).
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Install SDK Gemini AI**:
   Kita akan menggunakan Google Generative AI (Gemini Flash) karena cepat dan murah.
   ```bash
   npm install @google/genai
   ```
2. **Tambahkan API Key ke `.env`**:
   Buka file `.env` dan tambahkan variabel baru:
   ```env
   # API Key untuk Google Gemini
   GEMINI_API_KEY="masukkan_api_key_gemini_anda_disini"
   ```
   *(Catatan: Anda bisa mendapatkan API key gratis di Google AI Studio)*
3. **Buat Helper LLM (`src/llm.ts`)**:
   Buat file baru bernama `llm.ts` di dalam folder `src/`.
   ```bash
   touch src/llm.ts
   ```
4. **Isi Kode `src/llm.ts`**:
   ```typescript
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
   Anda adalah asisten pencatat keuangan. Ekstrak data dari teks input pengguna menjadi format JSON yang valid.
   Aturan:
   1. type: hanya boleh berisi "EXPENSE", "INCOME", "DEBT", atau "RECEIVABLE".
   2. amount: angka nominal (integer) tanpa titik/koma.
   3. category: kategori transaksi (misal: "Makanan", "Gaji", "Transportasi").
   4. counterparty: nama orang jika ada hutang/piutang (kosongkan jika tidak ada).
   5. description: catatan tambahan (misal: "makan siang padang").
   
   Hanya kembalikan JSON raw tanpa markdown block atau teks tambahan.
   Contoh input: "makan ayam geprek 25rb"
   Contoh output: {"type": "EXPENSE", "amount": 25000, "category": "Makanan", "counterparty": null, "description": "makan ayam geprek"}
   `;
   
   export async function parseTransaction(text: string): Promise<any> {
     try {
       const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: text,
         config: {
           systemInstruction: SYSTEM_PROMPT,
           responseMimeType: 'application/json',
           temperature: 0.1, // Rendah agar konsisten
         }
       });
       
       const rawText = response.text || "{}";
       return JSON.parse(rawText);
     } catch (err) {
       console.error("Gagal memanggil Gemini API:", err);
       return null;
     }
   }
   ```
5. **Uji Coba Script**:
   Untuk mengetes, tambahkan kode ini sementara di bagian bawah `src/llm.ts`:
   ```typescript
   // Hapus atau comment kode ini setelah tes berhasil
   // parseTransaction("budi ngutang 100k").then(console.log);
   ```
   Lalu jalankan `npx ts-node src/llm.ts` dan pastikan outputnya berupa JSON yang benar.
