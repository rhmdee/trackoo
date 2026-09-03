import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { query } from './db';

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
  const firstName = user.first_name || '';
  const username = user.username || '';

  // 1. Simpan atau Update user ke database
  const insertUserQuery = `
    INSERT INTO users (telegram_id, first_name, username) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (telegram_id) DO UPDATE 
    SET first_name = EXCLUDED.first_name, username = EXCLUDED.username;
  `;
  
  try {
    await query(insertUserQuery, [telegramId, firstName, username]);
    console.log(`[DB] User ${firstName} (${telegramId}) disimpan.`);
  } catch (err) {
    console.error("Database error saat menyimpan user:", err);
  }

  // 2. Balas pesan ke pengguna (Gaya santai/akrab)
  await ctx.reply(
    `Yo ${firstName}! Whats up! 👋\n` +
    `Kenalin, gue Trackoo — asisten pribadi lo buat nyatet duit keluar-masuk biar dompet lo gak boncos.\n\n` +
    `Tiap abis jajan atau dapet cuan, lo tinggal chat aja ke gue kayak biasa.\n` +
    `Contoh:\n` +
    `• "Makan siang 50rb"\n` +
    `• "Kopi kenangan 28k"\n` +
    `• "Gajian 5 juta"\n\n` +
    `Mau liat contekannya? Ketik /help aja ya, santai!`
  );
});

// --- PERINTAH /help ---
bot.help((ctx) => {
  ctx.reply(
    `📖 *Panduan Santai Trackoo*\n\n` +
    `Gak usah ribet buka form panjang, lo tinggal chat gue kayak nge-chat temen sendiri:\n\n` +
    `💸 *Catat Pengeluaran:*\n` +
    `• \`Makan padang 25k\`\n` +
    `• \`Beli bensin 50rb\`\n` +
    `• \`Bayar tagihan wifi 350k\`\n\n` +
    `💰 *Catat Pemasukan:*\n` +
    `• \`Gajian kantor 7jt\`\n` +
    `• \`Dapet transferan 500k\`\n\n` +
    `🤝 *Catat Hutang / Piutang:*\n` +
    `• \`Budi minjem duit 100k\` (Piutang)\n` +
    `• \`Utang ke Andi 50rb\` (Hutang)\n\n` +
    `⚡ *Menu Perintah:*\n` +
    `• /start — Sapa ulang bot\n` +
    `• /help — Liat panduan ini lagi\n\n` +
    `Gampang kan? Coba lo ketik sesuatu sekarang! 😉`,
    { parse_mode: 'Markdown' }
  );
});

// Jalankan Bot
console.log("🚀 Trackoo Bot sedang berjalan...");
bot.launch({
  dropPendingUpdates: true,
}).catch((err) => {
  console.error("❌ Gagal menjalankan bot:", err);
});

// Tangkap sinyal terminasi untuk menghentikan bot dengan aman
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
