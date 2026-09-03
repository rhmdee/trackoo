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
    `• /hapustagihan <id> — Hapus atau lunasi cicilan\n` +
    `• /edittagihan <id> bayar — Catat bayar angsuran 1x\n` +
    `• /riwayat — Liat 5 transaksi terakhir & ID-nya\n` +
    `• /edit <id> <koreksi> — Koreksi nominal/keterangan transaksi\n` +
    `• /hapus <id> — Hapus transaksi tertentu\n` +
    `• /cleardata — Reset & bersihkan semua data transaksi\n\n` +
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
    SELECT id, counterparty, description, total_amount, monthly_amount, tenor, paid_count, due_date
    FROM installments
    WHERE user_id = $1 AND status = 'ACTIVE'
    ORDER BY id ASC;
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

    const inlineButtons = res.rows.map((row, i) => {
      const sisaBulan = row.tenor - row.paid_count;
      const jatuhTempo = row.due_date ? ` (Tiap tgl ${row.due_date})` : "";
      replyMsg += `${i + 1}. *[ID: ${row.id}]* *${row.description}* (${row.counterparty})\n`;
      replyMsg += `   • Per bulan: *${formatRp(row.monthly_amount)}*${jatuhTempo}\n`;
      replyMsg += `   • Sisa cicilan: *${sisaBulan}x* lagi dari total ${row.tenor}x\n\n`;

      return [{
        text: `🗑️ Hapus ID: ${row.id} (${row.description.substring(0, 15)})`,
        callback_data: `delete_inst_${row.id}`
      }];
    });

    replyMsg += `_Ketik \`/hapustagihan [ID]\` atau klik tombol di bawah untuk menghapus cicilan:_`;

    await ctx.reply(replyMsg, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: inlineButtons }
    });

  } catch (err) {
    console.error("Gagal mengambil tagihan:", err);
    await ctx.reply("Aduh, gagal ngecek data tagihan nih. Coba lagi nanti ya. 🛠️");
  }
});

// Fungsi pembantu hapus cicilan
async function deleteInstallmentById(userId: string, instId: string): Promise<boolean> {
  const deleteQuery = `
    DELETE FROM installments
    WHERE id = $1 AND user_id = $2
    RETURNING id, description;
  `;
  const res = await query(deleteQuery, [instId, userId]);
  return res.rowCount !== null && res.rowCount > 0;
}

// --- PERINTAH /hapustagihan [id] ---
bot.command('hapustagihan', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();
  const args = ctx.message.text.trim().split(' ');

  if (args.length < 2 || isNaN(Number(args[1]))) {
    return ctx.reply("Format salah bro! Gunakan format: `/hapustagihan [ID]`\nContoh: `/hapustagihan 2`\n\nCek ID tagihan lo di perintah /tagihan", { parse_mode: 'Markdown' });
  }

  const instId = args[1];
  const isDeleted = await deleteInstallmentById(telegramId, instId);

  if (isDeleted) {
    await ctx.reply(`✅ Cicilan [ID: ${instId}] berhasil dihapus dari daftar tagihan lo! 🗑️`);
  } else {
    await ctx.reply(`❌ Cicilan [ID: ${instId}] gak ditemukan atau bukan punya lo.`);
  }
});

// Action handler tombol inline delete cicilan
bot.action(/^delete_inst_(\d+)$/, async (ctx) => {
  const instId = ctx.match[1];
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  const isDeleted = await deleteInstallmentById(telegramId, instId);
  if (isDeleted) {
    await ctx.answerCbQuery("Cicilan berhasil dihapus!");
    await ctx.editMessageText(`✅ Cicilan [ID: ${instId}] sudah dihapus dari daftar tagihan! 🗑️`);
  } else {
    await ctx.answerCbQuery("Cicilan tidak ditemukan.");
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

// --- PERINTAH /cleardata ---
bot.command('cleardata', async (ctx) => {
  await ctx.reply(
    "⚠️ *PERINGATAN PEMBERSIHAN DATA!*\n\n" +
    "Semua riwayat transaksi dan catatan cicilan lo bakal dihapus permanen dari database.\n\n" +
    "Apakah lo yakin mau membersihkan semua data?",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔥 Ya, Hapus Semua Data", callback_data: "confirm_cleardata" },
            { text: "❌ Batalkan", callback_data: "cancel_cleardata" }
          ]
        ]
      }
    }
  );
});

// Action konfirmasi hapus semua
bot.action('confirm_cleardata', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  try {
    await query("DELETE FROM transactions WHERE user_id = $1;", [telegramId]);
    await query("DELETE FROM installments WHERE user_id = $1;", [telegramId]);

    await ctx.answerCbQuery("Semua data berhasil dibersihkan!");
    await ctx.editMessageText(
      "🧹 *Selesai!* Semua transaksi dan cicilan lo berhasil dibersihkan.\n\nPembukuan lo sekarang bersih dan siap dipakai lagi dari awal! ✨",
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error("Gagal membersihkan data:", err);
    await ctx.answerCbQuery("Gagal membersihkan data.");
    await ctx.editMessageText("Gagal membersihkan data karena masalah server. Coba lagi nanti ya. 🛠️");
  }
});

// Action pembatalan
bot.action('cancel_cleardata', async (ctx) => {
  await ctx.answerCbQuery("Dibatalkan.");
  await ctx.editMessageText("Sip, pembersihan data dibatalkan. Data lo tetap aman! 👍");
});

// --- PERINTAH /edit [id] [koreksi baru] ---
bot.command('edit', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();
  const text = ctx.message.text.trim();
  const parts = text.split(' ');

  if (parts.length < 3 || isNaN(Number(parts[1]))) {
    return ctx.reply(
      "Format salah bro! Gunakan format:\n" +
      "`/edit [ID] [koreksi baru]`\n\n" +
      "Contoh koreksi nominal / keterangan:\n" +
      "• `/edit 15 35rb`\n" +
      "• `/edit 15 Beli bensin pertamax 50k`\n\n" +
      "Cek ID transaksi lo pakai perintah /riwayat",
      { parse_mode: 'Markdown' }
    );
  }

  const txId = parts[1];
  const correctionText = parts.slice(2).join(' ');

  // Pastikan transaksi ada dan milik user
  const checkQuery = `SELECT id, amount, description, category FROM transactions WHERE id = $1 AND user_id = $2;`;
  const checkRes = await query(checkQuery, [txId, telegramId]);

  if (checkRes.rows.length === 0) {
    return ctx.reply(`❌ Transaksi [ID: ${txId}] gak ketemu atau bukan punya lo.`);
  }

  await ctx.sendChatAction('typing');

  // Gunakan AI untuk parsing teks koreksi
  const data = await parseTransaction(correctionText);

  if (!data || !data.amount) {
    return ctx.reply("Sori bro, nominal koreksinya gak kebaca. Coba ketik yang jelas ya, misal: `/edit 15 50rb`", { parse_mode: 'Markdown' });
  }

  const newAmount = data.amount;
  const newDesc = data.description || checkRes.rows[0].description;
  const newCat = data.category || checkRes.rows[0].category;

  const updateQuery = `
    UPDATE transactions
    SET amount = $1, description = $2, category = $3
    WHERE id = $4 AND user_id = $5;
  `;

  try {
    await query(updateQuery, [newAmount, newDesc, newCat, txId, telegramId]);

    const formatRp = (num: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    await ctx.reply(
      `✏️ *Transaksi [ID: ${txId}] Berhasil Diperbarui!*\n\n` +
      `• Nominal Baru: *${formatRp(newAmount)}*\n` +
      `• Keterangan: *${newDesc}*\n` +
      `• Kategori: *${newCat}*`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error("Gagal update transaksi:", err);
    await ctx.reply("Duh, gagal ngupdate transaksi di database. Coba lagi bentar ya! 🛠️");
  }
});

// --- PERINTAH /edittagihan [id] bayar / jatuhtempo ---
bot.command('edittagihan', async (ctx) => {
  const telegramId = ctx.message.from.id.toString();
  const args = ctx.message.text.trim().split(' ');

  if (args.length < 3 || isNaN(Number(args[1]))) {
    return ctx.reply(
      "Format salah bro! Gunakan format:\n\n" +
      "1. Catat pembayaran 1x angsuran:\n" +
      "`/edittagihan [ID] bayar`\n\n" +
      "2. Ubah tanggal jatuh tempo:\n" +
      "`/edittagihan [ID] jatuhtempo [tanggal 1-31]`\n" +
      "Contoh: `/edittagihan 2 jatuhtempo 15`\n\n" +
      "Cek ID cicilan lo di /tagihan",
      { parse_mode: 'Markdown' }
    );
  }

  const instId = args[1];
  const actionType = args[2].toLowerCase();

  // Cek cicilan di DB
  const checkQuery = `SELECT * FROM installments WHERE id = $1 AND user_id = $2;`;
  const checkRes = await query(checkQuery, [instId, telegramId]);

  if (checkRes.rows.length === 0) {
    return ctx.reply(`❌ Cicilan [ID: ${instId}] gak ditemukan atau bukan punya lo.`);
  }

  const inst = checkRes.rows[0];

  if (actionType === 'bayar') {
    const newPaidCount = inst.paid_count + 1;
    const isCompleted = newPaidCount >= inst.tenor;
    const newStatus = isCompleted ? 'COMPLETED' : 'ACTIVE';

    const updateQuery = `
      UPDATE installments
      SET paid_count = $1, status = $2
      WHERE id = $3 AND user_id = $4;
    `;
    await query(updateQuery, [newPaidCount, newStatus, instId, telegramId]);

    if (isCompleted) {
      await ctx.reply(`🎉 *SELAMAT BRO!* Cicilan *${inst.description}* (${inst.counterparty}) sudah LUNAS seluruhnya (${inst.tenor}/${inst.tenor})! Bebas tanggungan! 🥳`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`✅ Berhasil mencatat 1x pembayaran untuk *${inst.description}*!\nSisa cicilan: *${inst.tenor - newPaidCount}x* lagi dari total ${inst.tenor}x.`, { parse_mode: 'Markdown' });
    }
  } else if (actionType === 'jatuhtempo' && args[3]) {
    const newDueDate = parseInt(args[3], 10);
    if (isNaN(newDueDate) || newDueDate < 1 || newDueDate > 31) {
      return ctx.reply("Tanggal jatuh tempo harus antara 1 sampai 31 ya!");
    }

    await query(`UPDATE installments SET due_date = $1 WHERE id = $2 AND user_id = $3;`, [newDueDate, instId, telegramId]);
    await ctx.reply(`📅 Tanggal jatuh tempo untuk *${inst.description}* berhasil diubah ke tiap tanggal *${newDueDate}*!`, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply("Perintah tidak dikenali. Pilih antara `bayar` atau `jatuhtempo`.");
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
  const txDate = data.transaction_date ? new Date(data.transaction_date) : new Date();

  const insertTxQuery = `
    INSERT INTO transactions (user_id, amount, type, category, counterparty, description, transaction_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;
  `;

  try {
    await query(insertTxQuery, [
      telegramId,
      data.amount,
      data.type,
      data.category || 'Lain-lain',
      data.counterparty || null,
      data.description || text,
      txDate
    ]);

    // 3. Format Balasan Konfirmasi Santai (Format Rupiah)
    const formatRp = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(data.amount);

    const dateNotice = data.transaction_date
      ? ` (tanggal: *${new Date(data.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}*)`
      : '';

    let replyMsg = "";
    if (data.type === 'EXPENSE') {
      replyMsg = `💸 Sip, pengeluaran *${formatRp}* buat *${data.category}* udah gue catat ya${dateNotice}.`;
    } else if (data.type === 'INCOME') {
      replyMsg = `💰 Asik! Pemasukan *${formatRp}* (${data.category}) udah masuk buku${dateNotice}.`;
    } else if (data.type === 'DEBT') {
      replyMsg = `🤝 Oke, utang lo ke *${data.counterparty || 'temen'}* sebesar *${formatRp}* udah dicatat${dateNotice}.`;
    } else if (data.type === 'RECEIVABLE') {
      replyMsg = `📝 Mantap, piutang *${data.counterparty || 'temen'}* sebesar *${formatRp}* ke lo udah gue ingat${dateNotice}.`;
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
