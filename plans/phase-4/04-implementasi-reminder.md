# Langkah 4: Pengingat Jatuh Tempo (Cron Job)

**Tujuan:** Membuat cron job yang berjalan harian untuk mengecek apakah ada cicilan yang jatuh tempo H-1 atau Hari H, lalu mengingatkan pengguna via Telegram.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Install Library Node Cron**:
   Di terminal, jalankan:
   \`\`\`bash
   npm install node-cron
   npm install --save-dev @types/node-cron
   \`\`\`
   
2. **Buka file `src/index.ts`**.
3. **Import node-cron dan Buat Schedule**:
   Di bagian atas file, tambahkan:
   ```typescript
   import cron from 'node-cron';
   ```
   
   Di bagian bawah file (sebelum atau sesudah `bot.launch()`), tambahkan logika pengecekan harian (misal setiap jam 08:00 pagi):
   ```typescript
   // --- PENGINGAT TAGIHAN HARIAN ---
   // Berjalan setiap jam 8 pagi
   cron.schedule('0 8 * * *', async () => {
     console.log("Menjalankan cron pengecekan tagihan...");
     const todayDate = new Date().getDate(); // 1-31
     
     // Cari cicilan yang due_date-nya hari ini dan masih aktif
     const dueQuery = \`
       SELECT user_id, counterparty, description, monthly_amount
       FROM installments
       WHERE due_date = $1 AND status = 'ACTIVE'
     \`;
     
     try {
       const res = await query(dueQuery, [todayDate]);
       
       for (const row of res.rows) {
         const formatRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.monthly_amount);
         
         const msg = \`🚨 *PENGINGAT JATUH TEMPO!* 🚨\n\n\` +
                     \`Bro, hari ini waktunya bayar cicilan *\${row.description}* ke *\${row.counterparty}*.\n\` +
                     \`Nominal: *\${formatRp}*\n\n\` +
                     \`Jangan sampai lupa biar nggak kena denda ya! 💸\`;
                     
         // Kirim pesan langsung ke user
         await bot.telegram.sendMessage(row.user_id, msg, { parse_mode: 'Markdown' });
       }
     } catch (err) {
       console.error("Gagal menjalankan cron pengingat:", err);
     }
   });
   ```
4. **Validasi & Uji Coba**:
   - Untuk simulasi, ubah cron expression sementara ke `* * * * *` (jalan setiap menit).
   - Pastikan *timezone* server atau mesin lokal sudah benar.
   - Buat satu input cicilan di database dengan `due_date` sama dengan tanggal hari ini.
   - Tunggu 1 menit, dan pastikan bot secara ajaib menge-chat Anda di Telegram dengan pesan *"🚨 PENGINGAT JATUH TEMPO! 🚨"*.
   - Jangan lupa kembalikan ke `0 8 * * *` (Jam 8 pagi) setelah tes berhasil.
