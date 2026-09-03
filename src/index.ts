import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import cron from 'node-cron';
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
    `• /help — Liat panduan ini lagi\n` +
    `• /summary — Cek rekapan pengeluaran & pemasukan bulan ini\n` +
    `• /hutang — Cek daftar hutang & piutang lo\n` +
    `• /tagihan — Liat daftar cicilan aktif lo\n` +
    `• /riwayat — Liat 5 transaksi terakhir & ID-nya\n` +
    `• /hapus <id> — Hapus transaksi tertentu\n\n` +
    `Gampang kan? Coba lo ketik sesuatu sekarang! 😉`,
    { parse_mode: 'Markdown' }
  );
});

// --- PERINTAH /summary ---
bot.command('summary', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();

  // 1. Ambil data agregasi dari DB untuk bulan ini
  const summaryQuery = `
    SELECT type, SUM(amount) as total
    FROM transactions
    WHERE user_id = $1 
      AND date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)
    GROUP BY type;
  `;

  try {
    const res = await query(summaryQuery, [telegramId]);

    let totalIncome = 0;
    let totalExpense = 0;

    res.rows.forEach(row => {
      if (row.type === 'INCOME') totalIncome = Number(row.total);
      if (row.type === 'EXPENSE') totalExpense = Number(row.total);
    });

    const balance = totalIncome - totalExpense;

    // 2. Format balasan
    const formatRp = (num: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(num);

    const replyMsg =
      `📊 *Ringkasan Bulan Ini*\n\n` +
      `📈 Pemasukan: *${formatRp(totalIncome)}*\n` +
      `📉 Pengeluaran: *${formatRp(totalExpense)}*\n\n` +
      `💰 Sisa Saldo: *${formatRp(balance)}*\n\n` +
      (balance >= 0
        ? `💡 Mantap! Pertahankan gaya hemat lo.`
        : `⚠️ Waduh, besar pasak daripada tiang nih bos!`);

    await ctx.reply(replyMsg, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error("Gagal mengambil summary:", err);
    await ctx.reply("Duh, gagal ngambil data summary. Coba lagi nanti ya. 🛠️");
  }
});

// --- PERINTAH /hutang ---
bot.command('hutang', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();

  // 1. Ambil daftar hutang & piutang dari DB
  const debtQuery = `
    SELECT type, counterparty, SUM(amount) as total
    FROM transactions
    WHERE user_id = $1 AND type IN ('DEBT', 'RECEIVABLE')
    GROUP BY type, counterparty
    HAVING SUM(amount) > 0;
  `;

  try {
    const res = await query(debtQuery, [telegramId]);

    if (res.rows.length === 0) {
      return ctx.reply("Wah bersih nih, lo gak punya catatan utang/piutang sama sekali! 🙌");
    }

    const formatRp = (num: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(num);

    let hutangList = "";
    let piutangList = "";

    res.rows.forEach(row => {
      const name = row.counterparty || "Orang lain";
      const amount = formatRp(Number(row.total));

      if (row.type === 'DEBT') {
        hutangList += `• Utang ke *${name}*: ${amount}\n`;
      } else if (row.type === 'RECEIVABLE') {
        piutangList += `• Piutang di *${name}*: ${amount}\n`;
      }
    });

    let replyMsg = `📋 *Rekap Hutang & Piutang*\n\n`;

    if (hutangList) {
      replyMsg += `💔 *Lo ngutang ke:*\n${hutangList}\n`;
    }
    if (piutangList) {
      replyMsg += `🤝 *Orang ngutang ke lo:*\n${piutangList}\n`;
    }

    await ctx.reply(replyMsg, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error("Gagal mengambil data hutang:", err);
    await ctx.reply("Duh, gagal ngambil data hutang. Coba lagi nanti ya. 🛠️");
  }
});

// --- PERINTAH /tagihan ---
bot.command('tagihan', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();

  const tagihanQuery = `
    SELECT counterparty, description, total_amount, monthly_amount, tenor, paid_count, due_date
    FROM installments
    WHERE user_id = $1 AND status = 'ACTIVE';
  `;

  try {
    const res = await query(tagihanQuery, [telegramId]);

    if (res.rows.length === 0) {
      return ctx.reply("Wuih, mantap! Lo lagi gak punya tanggungan cicilan aktif. Merdeka! 🎉");
    }

    const formatRp = (num: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(num);

    let replyMsg = `🧾 *Daftar Cicilan Aktif Lo:*\n\n`;

    res.rows.forEach((row, i) => {
      const sisaBulan = row.tenor - row.paid_count;
      const jatuhTempo = row.due_date ? ` (Tiap tgl ${row.due_date})` : "";
      replyMsg += `${i + 1}. *${row.description}* (${row.counterparty})\n`;
      replyMsg += `   • Per bulan: *${formatRp(row.monthly_amount)}*${jatuhTempo}\n`;
      replyMsg += `   • Sisa cicilan: *${sisaBulan}x* lagi dari total ${row.tenor}x\n\n`;
    });

    await ctx.reply(replyMsg, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error("Gagal mengambil tagihan:", err);
    await ctx.reply("Aduh, gagal ngecek data tagihan nih. Coba lagi nanti ya. 🛠️");
  }
});

// Fungsi pembantu untuk hapus transaksi
async function deleteTransactionById(userId: string, txId: string): Promise<boolean> {
  const deleteQuery = `
    DELETE FROM transactions
    WHERE id = $1 AND user_id = $2
    RETURNING id, description, amount;
  `;
  const res = await query(deleteQuery, [txId, userId]);
  return res.rowCount !== null && res.rowCount > 0;
}

// --- PERINTAH /riwayat ---
bot.command('riwayat', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();

  const historyQuery = `
    SELECT id, amount, type, category, description, transaction_date
    FROM transactions
    WHERE user_id = $1
    ORDER BY transaction_date DESC, id DESC
    LIMIT 5;
  `;

  try {
    const res = await query(historyQuery, [telegramId]);

    if (res.rows.length === 0) {
      return ctx.reply("Belum ada riwayat transaksi yang tercatat nih. Masih kosong! 📭");
    }

    const formatRp = (num: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(num);

    let replyMsg = `📋 *5 Transaksi Terakhir Lo:*\n\n`;

    // Buat keyboard inline buttons untuk opsi klik hapus langsung
    const inlineButtons = res.rows.map((row) => {
      const typeIcon = row.type === 'EXPENSE' ? '💸' : row.type === 'INCOME' ? '📈' : '🤝';
      const dateStr = new Date(row.transaction_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });

      replyMsg += `• *[ID: ${row.id}]* ${typeIcon} *${formatRp(row.amount)}* - ${row.description} (${dateStr})\n`;

      return [{
        text: `🗑️ Hapus ID: ${row.id} (${row.description.substring(0, 15)})`,
        callback_data: `delete_tx_${row.id}`
      }];
    });

    replyMsg += `\n_Ketik \`/hapus [ID]\` atau langsung klik tombol di bawah untuk menghapus:_`;

    await ctx.reply(replyMsg, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineButtons }
    });
  } catch (err) {
    console.error("Gagal mengambil riwayat:", err);
    await ctx.reply("Aduh, gagal ngambil riwayat transaksi. Coba lagi bentar ya! 🛠️");
  }
});

// --- PERINTAH /hapus [id] ---
bot.command('hapus', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();
  const args = ctx.message.text.split(' ');

  if (args.length < 2 || isNaN(Number(args[1]))) {
    return ctx.reply("Format salah bro! Gunakan format: `/hapus [ID]`\nContoh: `/hapus 42`\n\nCek ID transaksi lo pakai perintah /riwayat", { parse_mode: 'Markdown' });
  }

  const txId = args[1];
  const isDeleted = await deleteTransactionById(telegramId, txId);

  if (isDeleted) {
    await ctx.reply(`✅ Transaksi [ID: ${txId}] berhasil dihapus dari pembukuan lo! 🗑️`);
  } else {
    await ctx.reply(`❌ Transaksi [ID: ${txId}] gak ketemu atau bukan punya lo.`);
  }
});

// --- ACTION HANDLER UNTUK TOMBOL INLINE DELETE ---
bot.action(/^delete_tx_(\d+)$/, async (ctx) => {
  const txId = ctx.match[1];
  const telegramId = ctx.from?.id.toString();

  if (!telegramId) return;

  const isDeleted = await deleteTransactionById(telegramId, txId);

  if (isDeleted) {
    await ctx.answerCbQuery("Transaksi berhasil dihapus!");
    await ctx.editMessageText(`✅ Transaksi [ID: ${txId}] sudah dihapus! 🗑️`);
  } else {
    await ctx.answerCbQuery("Transaksi tidak ditemukan.");
  }
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

  // Validasi nilai nominal tidak boleh nol atau negatif
  if (data.amount <= 0) {
    return ctx.reply("Masa iya jumlah transaksinya nol? Yang bener aja dong! 😅");
  }

  // Khusus Pendaftaran Cicilan Baru (INSTALLMENT)
  if (data.type === 'INSTALLMENT') {
    const tenor = data.tenor && data.tenor > 0 ? data.tenor : 1;
    const monthlyAmount = Math.ceil(data.amount / tenor);

    const insertInstQuery = `
      INSERT INTO installments (user_id, counterparty, description, total_amount, monthly_amount, tenor, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

    try {
      await query(insertInstQuery, [
        telegramId,
        data.counterparty || 'Lain-lain',
        data.description || text,
        data.amount,
        monthlyAmount,
        tenor,
        data.due_date || null
      ]);

      const formatRp = (num: number) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(num);

      const jatuhTempoInfo = data.due_date ? `\n• Jatuh Tempo: *Tiap tgl ${data.due_date}*` : '';

      const replyInst =
        `📝 *Cicilan Baru Berhasil Dicatat!*\n\n` +
        `• Pihak: *${data.counterparty || 'Lain-lain'}*\n` +
        `• Keterangan: *${data.description}*\n` +
        `• Total Tagihan: *${formatRp(data.amount)}*\n` +
        `• Tenor: *${tenor}x* cicilan\n` +
        `• Angsuran/bulan: *${formatRp(monthlyAmount)}*` +
        jatuhTempoInfo +
        `\n\nSemangat bayarnya bosku, biar cepet lunas! 💪`;

      return ctx.reply(replyInst, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error("Gagal mencatat cicilan:", err);
      return ctx.reply("Waduh, gagal nyimpen data cicilannya ke database. Coba lagi ya! 🛠️");
    }
  }

  // 2. Simpan ke tabel transactions di database (untuk EXPENSE, INCOME, DEBT, RECEIVABLE)
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

// --- PENGINGAT JATUH TEMPO CICILAN HARIAN ---
// Berjalan setiap jam 08:00 pagi setiap hari
cron.schedule('0 8 * * *', async () => {
  console.log("⏰ Menjalankan cron pengecekan jatuh tempo cicilan...");
  const todayDate = new Date().getDate(); // 1-31

  // Cari cicilan yang due_date-nya hari ini dan berstatus ACTIVE
  const dueQuery = `
    SELECT user_id, counterparty, description, monthly_amount
    FROM installments
    WHERE due_date = $1 AND status = 'ACTIVE';
  `;

  try {
    const res = await query(dueQuery, [todayDate]);

    for (const row of res.rows) {
      const formatRp = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(row.monthly_amount);

      const msg =
        `🚨 *PENGINGAT JATUH TEMPO!* 🚨\n\n` +
        `Bro, hari ini waktunya bayar cicilan *${row.description}* ke *${row.counterparty}*.\n` +
        `Nominal: *${formatRp}*\n\n` +
        `Jangan sampai telat biar gak kena denda ya! 💸`;

      // Kirim notifikasi chat Telegram langsung ke pengguna
      await bot.telegram.sendMessage(row.user_id, msg, { parse_mode: 'Markdown' });
      console.log(`[REMINDER] Notifikasi jatuh tempo terkirim ke user ${row.user_id}`);
    }
  } catch (err) {
    console.error("Gagal menjalankan cron pengingat cicilan:", err);
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
