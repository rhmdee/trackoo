# Langkah 2: Mendapatkan Token Bot dari Telegram

**Tujuan:** Mendaftarkan bot Trackoo ke Telegram dan mendapatkan "Kunci" (Token API) agar aplikasi Node.js kita bisa mengontrol bot tersebut.
**Target Implementator:** Harus dilakukan secara manual oleh pemilik bot (Anda/User).

## Langkah-langkah Implementasi:

1. **Buka Aplikasi Telegram** di HP atau Desktop Anda.
2. Cari akun bernama `@BotFather` (pastikan ada centang biru *verified*).
3. Mulai chat dan ketik perintah: `/newbot`
4. **Masukkan Nama Bot:**
   BotFather akan meminta nama bot (misal: "Trackoo Expense Tracker").
5. **Masukkan Username Bot:**
   BotFather akan meminta username yang harus diakhiri dengan kata "bot" (contoh: `Trackoo_bot` atau `trackoobot`). Username ini unik dan tidak boleh sama dengan orang lain.
6. **Dapatkan Token:**
   Jika berhasil, BotFather akan membalas dengan pesan panjang yang berisi **API Token**.
   Bentuknya seperti ini: `1234567890:ABCdefGhIJKlmNoPQRstuVWXyz`
7. **Simpan Token:**
   *Copy* (salin) token tersebut dan simpan dengan aman. Jangan pernah membagikan token ini ke publik (misalnya di-commit ke GitHub). Kita akan menggunakan token ini di Langkah 3.
