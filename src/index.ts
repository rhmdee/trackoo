import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { query } from './db';
import { parseTransaction } from './llm';

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

// --- LISTENER PESAN TEKS BEBAS (NLP PARSING & DATABASE SAVE) ---
bot.on('text', async (ctx) => {
  // Abaikan pesan jika diawali dengan "/" (karena itu adalah command)
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  const text = ctx.message.text;
  const user = ctx.message.from;
  const telegramId = user.id.toString();
  const firstName = user.first_name || '';
  const username = user.username || '';

  console.log(`[CHAT] Pesan masuk dari ${firstName} (${telegramId}): "${text}"`);

  // Pastikan user terdaftar di tabel users terlebih dahulu
  const ensureUserQuery = `
    INSERT INTO users (telegram_id, first_name, username)
    VALUES ($1, $2, $3)
    ON CONFLICT (telegram_id) DO UPDATE
    SET first_name = EXCLUDED.first_name, username = EXCLUDED.username;
  `;
  try {
    await query(ensureUserQuery, [telegramId, firstName, username]);
  } catch (err) {
    console.error("Gagal memastikan user:", err);
  }

  // Kirim action 'typing' agar bot terlihat sedang memproses
  await ctx.sendChatAction('typing');

  // 1. Parsing dengan Gemini AI
  const data = await parseTransaction(text);

  if (!data || !data.amount || !data.type) {
    return ctx.reply("Sori, gue kurang paham nih. Coba ketik lebih jelas ya, misal: 'Beli kopi 25rb'. 🤔");
  }

  // 2. Simpan ke tabel transactions di database
  const insertTxQuery = `
    INSERT INTO transactions (user_id, amount, type, category, counterparty, description)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;
  `;

  try {
    await query(insertTxQuery, [
      telegramId,
      data.amount,
      data.type,
      data.category || 'Lain-lain',
      data.counterparty || null,
      data.description || text
    ]);

    // 3. Format Balasan Konfirmasi Santai (Format Rupiah)
    const formatRp = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(data.amount);

    let replyMsg = "";
    if (data.type === 'EXPENSE') {
      replyMsg = `💸 Sip, pengeluaran *${formatRp}* buat *${data.category}* udah gue catat ya.`;
    } else if (data.type === 'INCOME') {
      replyMsg = `💰 Asik! Pemasukan *${formatRp}* (${data.category}) udah masuk buku.`;
    } else if (data.type === 'DEBT') {
      replyMsg = `🤝 Oke, utang lo ke *${data.counterparty || 'temen'}* sebesar *${formatRp}* udah dicatat.`;
    } else if (data.type === 'RECEIVABLE') {
      replyMsg = `📝 Mantap, piutang *${data.counterparty || 'temen'}* sebesar *${formatRp}* ke lo udah gue ingat.`;
    }

    await ctx.reply(replyMsg, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error("Gagal simpan transaksi:", err);
    await ctx.reply("Duh, server lagi gangguan dikit nih. Gagal nyimpen data. Coba lagi bentar ya! 🛠️");
  }
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
