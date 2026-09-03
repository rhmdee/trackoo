# Langkah 1: Hapus dan Lunasi Tagihan (`/hapustagihan`)

**Tujuan:** Memungkinkan pengguna menghapus atau menandai lunas cicilan aktif di tabel `installments`, baik lewat tombol klik di `/tagihan` maupun perintah `/hapustagihan [id]`.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Update Command Handler `/tagihan`**:
   Tambahkan ID pada setiap cicilan dan buat tombol inline keyboard untuk hapus:
   ```typescript
   // Update tampilan di dalam bot.command('tagihan'):
   const inlineButtons = res.rows.map((row) => {
     return [{
       text: `🗑️ Hapus ID: ${row.id} (${row.description.substring(0, 15)})`,
       callback_data: `delete_inst_${row.id}`
     }];
   });

   await ctx.reply(replyMsg, {
     parse_mode: 'Markdown',
     reply_markup: { inline_keyboard: inlineButtons }
   });
   ```
   *(Pastikan query `tagihanQuery` menyertakan kolom `id`)*

3. **Tambahkan Command Handler `/hapustagihan [id]` dan Action Listener**:
   ```typescript
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
     const args = ctx.message.text.split(' ');

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
   ```

4. **Validasi & Uji Coba**:
   - Ketik `/tagihan`, pastikan setiap item memiliki nomor ID dan tombol hapus.
   - Klik tombol hapus atau ketik `/hapustagihan [id]`, pastikan cicilan terhapus dan tidak muncul lagi saat `/tagihan`.
