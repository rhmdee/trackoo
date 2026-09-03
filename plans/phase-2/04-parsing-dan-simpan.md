# Langkah 4 & 5: Parsing Data, Simpan ke DB, dan Beri Konfirmasi

**Tujuan:** Menerima pesan teks, mem-parsing-nya dengan Gemini AI, menyimpannya ke database `transactions`, lalu membalas konfirmasi santai ke pengguna.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Lengkapi Listener di `src/index.ts`**:
   Ubah bagian `bot.on('text')` yang kita buat di Langkah 3 menjadi seperti ini:
   ```typescript
   bot.on('text', async (ctx) => {
     if (ctx.message.text.startsWith('/')) return;
     
     const text = ctx.message.text;
     const telegramId = ctx.message.from.id.toString();
     
     await ctx.sendChatAction('typing');
     
     // 1. Parsing dengan Gemini
     const data = await parseTransaction(text);
     
     if (!data || !data.amount || !data.type) {
       return ctx.reply("Sori, gue kurang paham nih. Coba ketik lebih jelas, misal: 'Beli kopi 25rb'. 🤔");
     }
     
     // 2. Simpan ke Database
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
       
       // 3. Format Balasan Konfirmasi yang Santai
       let replyMsg = "";
       const formatRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.amount);
       
       if (data.type === 'EXPENSE') {
         replyMsg = \`💸 Sip, pengeluaran \*\${formatRp}\* buat \*\${data.category}\* udah gue catat ya.\`;
       } else if (data.type === 'INCOME') {
         replyMsg = \`💰 Asik! Pemasukan \*\${formatRp}\* (\${data.category}) udah masuk buku.\`;
       } else if (data.type === 'DEBT') {
         replyMsg = \`🤝 Oke, utang lo ke \*\${data.counterparty}\* sebesar \*\${formatRp}\* udah dicatat.\`;
       } else if (data.type === 'RECEIVABLE') {
         replyMsg = \`📝 Mantap, piutang \*\${data.counterparty}\* sebesar \*\${formatRp}\* ke lo udah gue ingat.\`;
       }
       
       await ctx.reply(replyMsg, { parse_mode: 'Markdown' });
       
     } catch (err) {
       console.error("Gagal simpan transaksi:", err);
       await ctx.reply("Duh, server lagi gangguan dikit. Gagal nyimpen data. Coba lagi nanti ya! 🛠️");
     }
   });
   ```
2. **Uji Coba Menyeluruh**:
   - Pastikan bot berjalan (`npm run dev`).
   - Chat bot: "Beli ayam geprek 20rb"
   - Pastikan bot membalas dengan konfirmasi sukses: `💸 Sip, pengeluaran Rp 20.000,00 buat Makanan udah gue catat ya.`
   
**Selamat! Phase 2 (NLP Integration & Core Logging) telah selesai.**
