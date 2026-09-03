# Langkah 3: Edge Cases dan Validasi

**Tujuan:** Memastikan bot tidak error dan dapat menanggapi input yang membingungkan dari user.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Uji Kasus Salah Input (Teks Ngawur)**
   - Coba ketik teks panjang tak relevan: `"hari ini cuacanya panas banget gue pengen jalan-jalan ke bandung"`
   - Bot harus mendeteksi bahwa ini tidak berisi nominal uang atau transaksi yang valid, dan tidak menyimpan apapun.
   - Pesan gagal: *"Sori, gue kurang paham nih. Coba ketik lebih jelas ya..."* harus keluar.

2. **Perbaikan Prompt di `src/llm.ts` jika LLM halusinasi**
   Jika LLM memaksa membuat JSON walau tidak ada indikasi uang, tambahkan aturan ini ke `SYSTEM_PROMPT` di `src/llm.ts`:
   ```text
   6. Jika teks pengguna sama sekali tidak berkaitan dengan transaksi keuangan (tidak ada angka uang, dsb), JANGAN kembalikan type, amount, dll. Kembalikan JSON kosong {}.
   ```
   
3. **Handling Angka Nol**
   Di `src/index.ts` pada `bot.on('text')`, tambahkan proteksi:
   ```typescript
   if (data.amount <= 0) {
     return ctx.reply("Masa iya jumlah transaksinya nol? Yang bener aja dong! 😅");
   }
   ```

4. **Uji Coba Error DB**
   Matikan koneksi internet (atau ganti kredensial database agar salah), kirim pesan, dan pastikan bot tidak *crash* total dan berhasil masuk ke `catch (err)` lalu membalas pengguna dengan sopan.
