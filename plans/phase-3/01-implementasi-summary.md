# Langkah 1: Implementasi Perintah `/summary`

**Tujuan:** Menambahkan perintah `/summary` agar pengguna bisa melihat ringkasan keuangan (pemasukan vs pengeluaran) pada bulan berjalan.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/index.ts`**.
2. **Tambahkan handler `/summary`**:
   Tambahkan kode ini sebelum `bot.on('text', ...)`:
   ```typescript
   // --- PERINTAH /summary ---
   bot.command('summary', async (ctx) => {
     const telegramId = ctx.message.from.id.toString();
     
     // 1. Ambil data agregasi dari DB untuk bulan ini
     const summaryQuery = \`
       SELECT type, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1 
         AND date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)
       GROUP BY type;
     \`;
     
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
       const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
       
       const replyMsg = 
         \`📊 *Ringkasan Bulan Ini*\n\n\` +
         \`📈 Pemasukan: \*\${formatRp(totalIncome)}\*\n\` +
         \`📉 Pengeluaran: \*\${formatRp(totalExpense)}\*\n\n\` +
         \` sisa Saldo: \*\${formatRp(balance)}\*\n\n\` +
         (balance >= 0 ? \`💡 Mantap! Pertahankan gaya hemat lo.\` : \`⚠️ Waduh, besar pasak daripada tiang nih bos!\`);
         
       await ctx.reply(replyMsg, { parse_mode: 'Markdown' });
       
     } catch (err) {
       console.error("Gagal mengambil summary:", err);
       await ctx.reply("Duh, gagal ngambil data summary. Coba lagi nanti ya.");
     }
   });
   ```
3. **Uji Coba**:
   Jalankan `npm run dev`, ketik `/summary` di bot, dan pastikan balasan berupa ringkasan pengeluaran dan pemasukan bulan ini.
