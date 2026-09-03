# Langkah 2: Implementasi Perintah `/hutang`

**Tujuan:** Menambahkan perintah `/hutang` agar pengguna bisa melihat daftar orang yang berhutang padanya dan hutangnya pada orang lain.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Tambahkan handler `/hutang`**:
   Tambahkan kode ini setelah perintah `/summary`:
   ```typescript
   // --- PERINTAH /hutang ---
   bot.command('hutang', async (ctx) => {
     const telegramId = ctx.message.from.id.toString();
     
     // 1. Ambil daftar hutang & piutang dari DB
     const debtQuery = \`
       SELECT type, counterparty, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1 AND type IN ('DEBT', 'RECEIVABLE')
       GROUP BY type, counterparty
       HAVING SUM(amount) > 0;
     \`;
     
     try {
       const res = await query(debtQuery, [telegramId]);
       
       if (res.rows.length === 0) {
         return ctx.reply("Wah bersih nih, lo gak punya utang/piutang yang tercatat! 🙌");
       }
       
       const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
       
       let hutangList = "";
       let piutangList = "";
       
       res.rows.forEach(row => {
         const name = row.counterparty || "Orang lain";
         const amount = formatRp(Number(row.total));
         
         if (row.type === 'DEBT') {
           hutangList += \`• Utang ke \*\${name}\*: \${amount}\n\`;
         } else if (row.type === 'RECEIVABLE') {
           piutangList += \`• Piutang di \*\${name}\*: \${amount}\n\`;
         }
       });
       
       let replyMsg = \`📋 *Rekap Hutang & Piutang*\n\n\`;
       
       if (hutangList) {
         replyMsg += \`💔 *Lo ngutang ke:*\n\${hutangList}\n\`;
       }
       if (piutangList) {
         replyMsg += \`🤝 *Orang ngutang ke lo:*\n\${piutangList}\n\`;
       }
       
       await ctx.reply(replyMsg, { parse_mode: 'Markdown' });
       
     } catch (err) {
       console.error("Gagal mengambil data hutang:", err);
       await ctx.reply("Duh, gagal ngambil data hutang. Coba lagi nanti ya.");
     }
   });
   ```
3. **Uji Coba**:
   Jalankan `npm run dev`, lalu ketik `/hutang`. Pastikan bot mengembalikan daftar piutang/hutang dengan format yang mudah dibaca.
