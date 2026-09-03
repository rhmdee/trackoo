# Trackoo Execution Plan

Dokumen ini menguraikan rencana teknis dan tahapan eksekusi untuk membangun MVP Trackoo (Telegram Finance Tracker Bot). Karena beberapa keputusan strategis (NLP, OCR, Database) belum diputuskan, rencana ini disusun dengan **rekomendasi terbaik untuk kecepatan rilis (Time-to-Market)**.

## 1. Rekomendasi Tech Stack (MVP)
Untuk mempercepat pengembangan dan menjaga biaya tetap rendah di awal:
- **Bahasa Pemrograman:** Node.js (TypeScript) atau Python. Keduanya memiliki ekosistem *library* Telegram bot yang sangat matang (`telegraf` untuk Node.js, `python-telegram-bot` untuk Python). *Asumsi: Kita akan menggunakan Node.js (TypeScript) karena sangat ringan untuk I/O operasi chat.*
- **Telegram Framework:** `telegraf` (Node.js).
- **NLP Engine:** Menggunakan LLM API ringan (seperti OpenAI `gpt-3.5-turbo` atau Gemini `gemini-1.5-flash`). Mengapa? Karena membuat *Regex* untuk bahasa natural Indonesia yang penuh singkatan dan typo sangat sulit dan akan memakan waktu *development* yang lama. LLM sangat cerdas dalam mem-parsing struktur kalimat menjadi format JSON (Nominal, Kategori, Tipe).
- **Database:** PostgreSQL. (Bisa menggunakan layanan gratis/murah seperti Supabase atau Neon). PostgreSQL sangat handal untuk agregasi laporan keuangan (SUM pengeluaran bulan ini, dll).
- **Hosting:** Railway, Render, atau VPS murah (DigitalOcean/Vultr).
- **OCR:** **Ditunda ke Fase 2**. Kita akan merilis versi *Text-only* terlebih dahulu untuk memvalidasi apakah pengguna benar-benar suka menggunakan bot ini.

## 2. Database Schema (High-Level)

### Table: `users`
- `telegram_id` (Primary Key, String/BigInt)
- `first_name` (String)
- `username` (String)
- `created_at` (Timestamp)

### Table: `transactions`
- `id` (Primary Key, UUID)
- `user_id` (Foreign Key -> users.telegram_id)
- `amount` (Decimal/Integer)
- `type` (Enum: 'EXPENSE', 'INCOME', 'DEBT', 'RECEIVABLE')
- `category` (String, e.g., 'Food', 'Transport')
- `counterparty` (String, opsional, untuk mencatat nama penghutang/peminjam)
- `description` (String, teks asli dari pengguna)
- `transaction_date` (Date/Timestamp)
- `created_at` (Timestamp)

## 3. Tahapan Eksekusi (Phases)

### Phase 1: Bot Setup & Infrastructure (Minggu 1)
- [x] Inisialisasi *project* (Node.js + TypeScript).
- [x] Register bot di `@BotFather` Telegram dan dapatkan token.
- [x] Setup koneksi ke database PostgreSQL.
- [x] Implementasi perintah dasar: `/start` (menyimpan user ke DB) dan `/help`.
- [x] Setup *environment variables* (API Keys, DB Credentials).

### Phase 2: NLP Integration & Core Logging (Minggu 2)
- [x] Setup integrasi dengan LLM API (OpenAI / Gemini) beserta *system prompt* khusus untuk mem-parsing pesan.
- [x] Implementasi *webhook/polling* untuk mendengarkan pesan teks (*free-text*).
- [x] Alur (Flow): Terima teks -> Kirim ke LLM -> Terima JSON hasil *parsing* -> Validasi -> Simpan ke tabel `transactions`.
- [x] Bot memberikan balasan konfirmasi sukses pencatatan (contoh: "✅ *Berhasil mencatat Pengeluaran Rp 50.000 untuk Makanan*").

### Phase 3: Reporting & Debts (Minggu 3)
- [x] Implementasi perintah `/summary`. Membuat *query* agregasi DB (SUM amount berdasarkan tipe) untuk bulan berjalan.
- [x] Implementasi perintah `/hutang`. Membuat *query* untuk menampilkan daftar transaksi dengan tipe `DEBT` dan `RECEIVABLE`.
- [x] Testing *edge cases* (contoh: pengguna memasukkan teks *ngawur*, LLM gagal *parsing*).
- [x] *Deployment* ke server *production*.

### Phase 4 (Post-MVP / Masa Depan)
- Integrasi OCR (membaca gambar struk).
- Fitur ekspor data (CSV/Excel).
- Kustomisasi kategori per pengguna.

---

## 4. Langkah Berikutnya
Jika Anda setuju dengan asumsi *tech stack* (Node.js/TypeScript, PostgreSQL, LLM for NLP) dan pendekatan *Text-only* di Fase 1 ini, kita bisa langsung membuat *project boilerplate* dan menginisialisasi repositori kodenya. 

Atau, apakah Anda ingin mengganti bahasa pemrograman (misal ke Python/Go) atau *database*-nya?
