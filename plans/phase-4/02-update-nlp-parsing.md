# Langkah 2: Update NLP Parsing untuk Deteksi Cicilan

**Tujuan:** Membuat Gemini AI bisa mendeteksi bahwa pesan pengguna adalah sebuah pendaftaran cicilan baru, lengkap dengan tenor dan total tagihan.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/llm.ts`**.
2. **Ubah `SYSTEM_PROMPT` dan `ParsedTransaction`**:
   Ubah tipe data dan instruksi untuk menambahkan *type* `INSTALLMENT`.
   ```typescript
   // Pada bagian Aturan Ekstraksi di SYSTEM_PROMPT tambahkan:
   // - "INSTALLMENT" (pendaftaran cicilan baru, kredit barang, pinjaman berjangka)
   
   // Tambahkan aturan properti baru:
   // 7. Khusus untuk type "INSTALLMENT", berikan properti tambahan "tenor" (berapa kali cicilan) jika ada, jika tidak null.
   // 8. Khusus untuk type "INSTALLMENT", berikan properti tambahan "due_date" (tanggal jatuh tempo tiap bulan) berupa angka 1-31 jika disebutkan, jika tidak null.
   
   // Update interface ParsedTransaction
   export interface ParsedTransaction {
     type: 'EXPENSE' | 'INCOME' | 'DEBT' | 'RECEIVABLE' | 'INSTALLMENT';
     amount: number;
     category: string;
     counterparty: string | null;
     description: string;
     tenor?: number | null;
     due_date?: number | null;
   }
   ```
3. **Buka file `src/index.ts`**.
4. **Update Listener Pesan Teks untuk Simpan Cicilan**:
   Di dalam `bot.on('text')`, setelah mendapatkan `data`, tambahkan blok kondisi untuk `INSTALLMENT`:
   ```typescript
   if (data.type === 'INSTALLMENT') {
     const tenor = data.tenor || 1;
     const monthlyAmount = Math.ceil(data.amount / tenor);
     
     const insertInstQuery = \`
       INSERT INTO installments (user_id, counterparty, description, total_amount, monthly_amount, tenor, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id;
     \`;
     await query(insertInstQuery, [
       telegramId,
       data.counterparty || 'Lain-lain',
       data.description,
       data.amount,
       monthlyAmount,
       tenor,
       data.due_date || null
     ]);
     
     const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
     
     const replyInst = 
       \`📝 *Cicilan Baru Tercatat!*\n\n\` +
       \`• Pihak: *\${data.counterparty}*\n\` +
       \`• Barang/Keterangan: *\${data.description}*\n\` +
       \`• Total: *\${formatRp(data.amount)}*\n\` +
       \`• Tenor: *\${tenor}x*\n\` +
       \`• Angsuran/bln: *\${formatRp(monthlyAmount)}*\n\n\` +
       \`Semangat bayarnya bosku! 💪\`;
       
     return ctx.reply(replyInst, { parse_mode: 'Markdown' });
   }
   ```
5. **Validasi & Uji Coba**:
   Jalankan `npm run dev`. Ketik pesan: `"gua ada cicilan kredivo hp oppo 3.5jt 12x tanggal jatuh tempo 25"`. Pastikan bot membalas dengan ringkasan cicilan bulanan yang sudah dikalkulasi dengan benar.
