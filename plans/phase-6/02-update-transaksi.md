# Langkah 2: Update Transaksi (`/edit`)

**Tujuan:** Memungkinkan pengguna mengoreksi transaksi yang salah ketik nominal atau keterangannya tanpa harus menghapus dan membuat baru.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Tambahkan Command Handler `/edit`**:
   Tambahkan kode sebelum `bot.on('text')`:
   ```typescript
   // --- PERINTAH /edit [id] [koreksi] ---
   // Contoh pemakaian:
   // /edit 42 35rb
   // /edit 42 Kopi susu 30k
   bot.command('edit', async (ctx) => {
     const telegramId = ctx.message.from.id.toString();
     const text = ctx.message.text.trim();
     const parts = text.split(' ');

     if (parts.length < 3 || isNaN(Number(parts[1]))) {
       return ctx.reply(
         "Format salah bro! Gunakan format:\n" +
         "`/edit [ID] [koreksi baru]`\n\n" +
         "Contoh koreksi nominal:\n" +
         "• `/edit 15 35rb`\n" +
         "• `/edit 15 Beli bensin pertamax 50k`\n\n" +
         "Cek ID transaksi lo pakai /riwayat",
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
   ```

3. **Validasi & Uji Coba**:
   - Ketik `/riwayat` untuk melihat salah satu ID transaksi (contoh: ID 5).
   - Ketik `/edit 5 50rb makan soto`.
   - Pastikan bot membalas bahwa data berhasil diperbarui.
   - Ketik `/summary` dan pastikan nominal baru sudah terhitung dengan benar.
