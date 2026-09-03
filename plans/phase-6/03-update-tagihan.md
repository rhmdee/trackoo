# Langkah 3: Update Tagihan dan Bayar Angsuran (`/edittagihan`)

**Tujuan:** Memungkinkan pengguna memperbarui status cicilan (misal mencatat bahwa angsuran ke-1 sudah dibayar, atau mengubah tanggal jatuh tempo) tanpa mendaftarkan cicilan baru dari nol.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Tambahkan Command Handler `/edittagihan`**:
   Tambahkan kode sebelum `bot.on('text')`:
   ```typescript
   // --- PERINTAH /edittagihan [id] bayar / jatuhtempo ---
   // Contoh:
   // /edittagihan 2 bayar (menambah 1x angsuran terbayar)
   // /edittagihan 2 jatuhtempo 10 (mengubah tanggal jatuh tempo ke tgl 10)
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
         await ctx.reply(`✅ Berhasil mencatat 1x pembayaran untuk *${inst.description}*!\nSisa cicilan: *${inst.tenor - newPaidCount}x* lagi.`, { parse_mode: 'Markdown' });
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
   ```

3. **Validasi & Uji Coba**:
   - Ketik `/tagihan` untuk melihat salah satu ID cicilan (misal ID: 1).
   - Ketik `/edittagihan 1 bayar`.
   - Ketik `/tagihan` lagi dan pastikan sisa cicilannya berkurang dari 12x menjadi 11x.
   - Ketik `/edittagihan 1 jatuhtempo 10` dan pastikan tanggal jatuh tempo berubah.
