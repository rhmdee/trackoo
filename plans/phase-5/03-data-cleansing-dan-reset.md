# Langkah 3: Data Cleansing & Reset Transaksi (`/cleardata`)

**Tujuan:** Memberikan opsi pembersihan data testing / reset pembukuan bagi pengguna yang ingin memulai kembali pencatatan dari nol secara aman dengan konfirmasi 2 langkah.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Tambahkan Command Handler `/cleardata`**:
   Tambahkan kode sebelum `bot.on('text')`:
   ```typescript
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
       await ctx.editMessageText("🧹 *Selesai!* Semua transaksi dan cicilan lo berhasil dibersihkan. Pembukuan lo sekarang bersih dan siap dipakai lagi dari awal! ✨", { parse_mode: 'Markdown' });
     } catch (err) {
       console.error("Gagal membersihkan data:", err);
       await ctx.answerCbQuery("Gagal membersihkan data.");
       await ctx.editMessageText("Gagal membersihkan data karena masalah server. Coba lagi nanti ya.");
     }
   });

   // Action pembatalan
   bot.action('cancel_cleardata', async (ctx) => {
     await ctx.answerCbQuery("Dibatalkan.");
     await ctx.editMessageText("Sip, pembersihan data dibatalkan. Data lo tetap aman! 👍");
   });
   ```
3. **Validasi & Uji Coba**:
   - Ketik `/cleardata` di Telegram.
   - Klik tombol "❌ Batalkan" dan pastikan data tidak hilang.
   - Ketik lagi `/cleardata` lalu klik "🔥 Ya, Hapus Semua Data".
   - Ketik `/summary` dan `/tagihan`, pastikan semua saldo dan tagihan kembali ke angka 0 / bersih.
