# Langkah 1: Implementasi Perintah `/riwayat` dan `/hapus [id]`

**Tujuan:** Memungkinkan pengguna melihat daftar transaksi terakhir beserta ID-nya, dan menghapus transaksi tertentu berdasarkan ID tersebut (baik via command maupun tombol klik).
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Update Daftar Panduan `/help`**:
   Tambahkan:
   - `• /riwayat — Liat 5 transaksi terakhir lo & ID-nya`
   - `• /hapus <id> — Hapus transaksi berdasarkan ID`
3. **Tambahkan Command Handler `/riwayat`**:
   Tambahkan kode berikut sebelum `bot.on('text')`:
   ```typescript
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
   ```
4. **Tambahkan Command Handler `/hapus <id>` dan Action Listener**:
   ```typescript
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
   ```
5. **Validasi & Uji Coba**:
   - Jalankan `npm run dev`.
   - Ketik `/riwayat` di Telegram, pastikan muncul daftar transaksi dan tombol hapus.
   - Coba klik tombol hapus atau ketik `/hapus <id>`, pastikan transaksi berhasil dihapus dan tidak muncul lagi saat `/summary`.
