# Langkah 2: Dukungan Transaksi Backdate (Tanggal Lampau)

**Tujuan:** Membuat bot mampu memahami tanggal transaksi lampau (misal: "kemarin beli bensin 20rb", "tgl 25 agustus dapet transfer 500k") dan menyimpannya sesuai tanggal yang dimaksud, bukan selalu tanggal hari ini.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/llm.ts`**.
2. **Perbarui `SYSTEM_PROMPT` dan `ParsedTransaction`**:
   Tambahkan aturan ekstraksi tanggal:
   ```typescript
   // Pada prompt sistem tambahkan:
   // 9. "transaction_date": Tanggal transaksi dalam format ISO string "YYYY-MM-DD" jika pengguna menyebutkan waktu/tanggal lampau atau relatif (contoh: "kemarin", "3 hari lalu", "tanggal 15 juli"). Jika pengguna tidak menyebutkan tanggal spesifik, isi dengan null (default ke hari ini).
   
   export interface ParsedTransaction {
     type: 'EXPENSE' | 'INCOME' | 'DEBT' | 'RECEIVABLE' | 'INSTALLMENT';
     amount: number;
     category: string;
     counterparty: string | null;
     description: string;
     tenor?: number | null;
     due_date?: number | null;
     transaction_date?: string | null;
   }
   ```
   *Catatan:* Pada pemanggilan LLM, sisipkan konteks tanggal hari ini (contoh: `const currentDate = new Date().toISOString().split('T')[0];`) ke dalam system prompt agar AI mengetahui acuan tanggal relatif (seperti "kemarin").

3. **Buka file `src/index.ts`**.
4. **Update Penyimpanan Transaksi**:
   Pada `insertTxQuery`, gunakan `transaction_date` jika tersedia:
   ```typescript
   const txDate = data.transaction_date ? new Date(data.transaction_date) : new Date();

   const insertTxQuery = `
     INSERT INTO transactions (user_id, amount, type, category, counterparty, description, transaction_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id;
   `;

   await query(insertTxQuery, [
     telegramId,
     data.amount,
     data.type,
     data.category || 'Lain-lain',
     data.counterparty || null,
     data.description || text,
     txDate
   ]);
   ```
5. **Validasi & Uji Coba**:
   - Kirim chat: `"Kemarin beli bensin 30rb"`.
   - Ketik `/riwayat`.
   - Pastikan tanggal yang tercantum pada transaksi tersebut adalah tanggal kemarin, bukan hari ini.
