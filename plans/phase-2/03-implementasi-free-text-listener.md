# Langkah 3: Implementasi Listener Pesan Teks (Free-text)

**Tujuan:** Mengatur bot agar menangkap semua pesan teks biasa (bukan perintah berawalan `/`) dari pengguna, lalu meneruskannya ke fungsi NLP.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Edit File `src/index.ts`**:
   Buka file utama bot. Kita akan menambahkan listener untuk semua pesan teks.
2. **Gunakan `bot.on('text')`**:
   Tambahkan kode berikut **SEBELUM** bagian `bot.launch()`:
   ```typescript
   import { parseTransaction } from './llm'; // Pastikan Anda mengimpor fungsi ini
   
   // --- LISTENER PESAN TEKS BEBAS ---
   bot.on('text', async (ctx) => {
     // Abaikan pesan jika diawali dengan "/" (karena itu adalah command)
     if (ctx.message.text.startsWith('/')) {
       return;
     }
     
     const text = ctx.message.text;
     const telegramId = ctx.message.from.id.toString();
     
     // Kirim feedback 'mengetik...' agar bot terlihat responsif
     await ctx.sendChatAction('typing');
     
     // (Proses LLM akan dilanjutkan di Langkah 4)
     // Untuk sekarang, kita console.log saja
     console.log(`Pesan masuk dari ${telegramId}: ${text}`);
     
     // ctx.reply("Lagi diproses bentar ya...");
   });
   ```
3. **Uji Coba**:
   Jalankan bot dengan:
   ```bash
   npm run dev
   ```
   Lalu kirim pesan sembarang ke bot (misal: "Halo bot"). 
   Pastikan di terminal (log) muncul tulisan `Pesan masuk dari ... : Halo bot`.
