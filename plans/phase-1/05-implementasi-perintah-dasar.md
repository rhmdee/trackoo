# Langkah 5: Implementasi Perintah Dasar (/start dan /help)

**Tujuan:** Mengaktifkan bot Telegram agar bisa membalas perintah dasar dari pengguna, sekaligus menyimpan data pengguna baru ke dalam database.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Edit File Utama (`src/index.ts`)**:
   Hapus semua isi `src/index.ts` sebelumnya, lalu ganti dengan kerangka Telegraf berikut:

   ```typescript
   import { Telegraf } from 'telegraf';
   import * as dotenv from 'dotenv';
   import { query } from './db'; // Mengambil fungsi query database
   
   dotenv.config();

   const token = process.env.BOT_TOKEN;
   if (!token) {
     throw new Error("BOT_TOKEN tidak ditemukan di .env!");
   }

   const bot = new Telegraf(token);

   // --- PERINTAH /start ---
   bot.start(async (ctx) => {
     const user = ctx.message.from;
     const telegramId = user.id.toString();
     const firstName = user.first_name;
     const username = user.username || '';

     // 1. Simpan atau Update user ke database
     const insertUserQuery = `
       INSERT INTO users (telegram_id, first_name, username) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (telegram_id) DO NOTHING;
     `;
     
     try {
       await query(insertUserQuery, [telegramId, firstName, username]);
     } catch (err) {
       console.error("Database error saat menyimpan user:", err);
     }

     // 2. Balas pesan ke pengguna
     ctx.reply(`Halo ${firstName}! 👋\nSelamat datang di Trackoo.\n\nKetik pengeluaran atau pemasukanmu di sini.\nContoh: "Makan siang 50rb" atau "Gajian 5 juta".\n\nKetik /help untuk panduan lengkap.`);
   });

   // --- PERINTAH /help ---
   bot.help((ctx) => {
     ctx.reply(`📖 **Panduan Trackoo**\n\nAnda bisa mencatat keuangan semudah chatting biasa.\n\nContoh Pengeluaran:\n- Beli kopi 25k\n- Bayar listrik 500rb\n\nContoh Pemasukan:\n- Gajian 5 juta\n\nContoh Hutang/Piutang:\n- Budi pinjam uang 100k\n\nPerintah bot:\n/start - Memulai bot\n/help - Bantuan ini`);
   });

   // Jalankan Bot
   bot.launch();
   console.log("🚀 Trackoo Bot sedang berjalan...");

   // Tangkap sinyal terminasi untuk menghentikan bot dengan aman
   process.once('SIGINT', () => bot.stop('SIGINT'));
   process.once('SIGTERM', () => bot.stop('SIGTERM'));
   ```

2. **Jalankan Bot Anda**:
   Buka terminal, jalankan perintah:
   ```bash
   npm run dev
   ```
   Pastikan muncul tulisan "🚀 Trackoo Bot sedang berjalan..." di terminal.

3. **Uji Coba di Telegram**:
   - Buka Telegram Anda.
   - Cari bot Anda (sesuai username yang dibuat di BotFather).
   - Ketik `/start`. Pastikan bot membalas dengan ramah.
   - Ketik `/help`. Pastikan panduan muncul.
   
**Selamat! Phase 1 (Bot Setup & Infrastructure) telah selesai.**
