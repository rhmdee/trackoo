# Langkah 3: Implementasi Perintah `/tagihan`

**Tujuan:** Membuat perintah khusus bagi pengguna untuk melihat sisa cicilan aktif mereka.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Update Daftar Bantuan (`/help`)**:
   Tambahkan `• /tagihan — Liat daftar cicilan aktif lo` di bagian `Menu Perintah`.
3. **Tambahkan Command Handler `/tagihan`**:
   Tambahkan kode berikut sebelum `bot.on('text')`:
   ```typescript
   // --- PERINTAH /tagihan ---
   bot.command('tagihan', async (ctx) => {
     const telegramId = ctx.message.from.id.toString();
     
     const tagihanQuery = \`
       SELECT counterparty, description, total_amount, monthly_amount, tenor, paid_count, due_date
       FROM installments
       WHERE user_id = $1 AND status = 'ACTIVE';
     \`;
     
     try {
       const res = await query(tagihanQuery, [telegramId]);
       
       if (res.rows.length === 0) {
         return ctx.reply("Wuih, mantap! Lo lagi gak punya tanggungan cicilan aktif. Merdeka! 🎉");
       }
       
       const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
       
       let replyMsg = \`🧾 *Daftar Cicilan Aktif Lo:*\n\n\`;
       
       res.rows.forEach((row, i) => {
         const sisaBulan = row.tenor - row.paid_count;
         const jatuhTempo = row.due_date ? \` (Tgl \${row.due_date})\` : "";
         replyMsg += \`\${i+1}. *\${row.description}* (\${row.counterparty})\n\`;
         replyMsg += \`   • Per bulan: \${formatRp(row.monthly_amount)}\${jatuhTempo}\n\`;
         replyMsg += \`   • Sisa cicilan: \${sisaBulan}x lagi dari total \${row.tenor}x\n\n\`;
       });
       
       await ctx.reply(replyMsg, { parse_mode: 'Markdown' });
       
     } catch (err) {
       console.error("Gagal mengambil tagihan:", err);
       await ctx.reply("Aduh, gagal ngecek data tagihan nih. Coba lagi nanti ya.");
     }
   });
   ```
4. **Validasi & Uji Coba**:
   Jalankan `npm run dev`. Kirim perintah `/tagihan`. Pastikan bot membalas dengan daftar cicilan yang dimasukkan pada Langkah 2, menunjukkan sisa cicilan (contoh: 12x lagi dari total 12x).
