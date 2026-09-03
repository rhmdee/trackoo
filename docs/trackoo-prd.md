# Product Requirements Document (PRD): Telegram Finance Tracker Bot

## 1. Overview
**Product Name:** Trackoo
**Description:** Sebuah bot Telegram yang dirancang untuk mencatat pengeluaran, pemasukan, hutang, dan piutang secara instan melalui teks bahasa natural (sehari-hari) dan unggahan foto struk.
**Objective:** Mengurangi hambatan (*friction*) dalam pencatatan keuangan pribadi dengan memanfaatkan platform yang sudah digunakan pengguna setiap hari (Telegram) tanpa perlu membuka aplikasi khusus.

## 2. Target Audience
- Mahasiswa, *freelancer*, dan profesional muda yang melek teknologi.
- Pengguna aktif Telegram.
- Individu yang merasa aplikasi keuangan tradisional terlalu rumit, banyak tombol, dan memakan waktu untuk melakukan input data sederhana.

## 3. User Stories (MVP - Minimum Viable Product)
- **Sebagai pengguna**, saya ingin mengetik "Makan siang 50k" agar bot otomatis mencatatnya sebagai pengeluaran Rp 50.000 dengan kategori "Makanan".
- **Sebagai pengguna**, saya ingin mengunggah foto struk belanja agar bot bisa mengekstrak total belanja dan menyimpannya sebagai pengeluaran tanpa saya harus mengetik.
- **Sebagai pengguna**, saya ingin mencatat hutang/piutang (contoh: "Budi utang 100k") agar saya tidak lupa siapa yang meminjam uang saya.
- **Sebagai pengguna**, saya ingin mengirim perintah `/summary` untuk mendapatkan ringkasan singkat arus kas bulan ini (total pemasukan, total pengeluaran, sisa uang).

## 4. Functional Requirements (Fitur Inti)

### 4.1. Natural Language Processing (NLP) Input
- **Kemampuan:** Memproses input teks bebas dari pengguna dan mengekstrak: Nominal, Tipe Transaksi (Pengeluaran, Pemasukan, Hutang, Piutang), Kategori, dan Tanggal.
- **Contoh Skenario:**
  - Input: "Beli kopi 25rb" -> *Output: Pengeluaran, Rp 25.000, Makanan/Minuman.*
  - Input: "Gajian 5 juta" -> *Output: Pemasukan, Rp 5.000.000, Gaji.*
  - Input: "Andi pinjam uang 500rb" -> *Output: Piutang, Rp 500.000, Kontak: Andi.*

### 4.2. OCR (Optical Character Recognition) Input
- **Kemampuan:** Menerima unggahan gambar (struk) dan mengekstrak nominal "Total".
- **Alur Konfirmasi:** Karena OCR rawan salah baca, setelah bot mengekstrak nominal, bot HARUS mengirim pesan konfirmasi (contoh: *"Terdeteksi pengeluaran Rp 150.000, simpan ke database?"*) dengan tombol *Yes/No* sebelum data disimpan.

### 4.3. Bot Commands (Perintah Dasar)
- `/start` - Menampilkan pesan sambutan dan cara penggunaan.
- `/help` - Menampilkan format dan contoh kalimat yang dimengerti bot.
- `/summary` - Menampilkan ringkasan teks bulan berjalan.
- `/hutang` - Menampilkan daftar hutang/piutang yang belum lunas.
- `/cancel` - Membatalkan percakapan atau input yang sedang berjalan.

### 4.4. Database & Penyimpanan
- Menyimpan profil pengguna berdasarkan Telegram ID.
- Menyimpan transaksi dengan kolom: ID User, Nominal, Tipe, Kategori, Tanggal, Deskripsi/Catatan.
- Menyimpan catatan hutang/piutang beserta status pelunasannya.

## 5. Non-Functional Requirements
- **Performa:** Bot harus merespons input teks maksimal dalam 2-3 detik. Untuk pemrosesan OCR, maksimal 10 detik.
- **Privasi:** Data transaksi mutlak dipisahkan berdasarkan Telegram ID. Pengguna tidak bisa mengakses data pengguna lain.

## 6. Out of Scope (Tidak Dikerjakan pada Fase 1/MVP)
- Fitur multi-currency (mata uang selain IDR).
- Integrasi API Bank untuk mutasi rekening otomatis.
- Aplikasi pendamping berbasis Web atau Mobile (semua murni via Telegram).
- Transaksi berulang (*recurring*) yang dijadwalkan otomatis.

---

## 7. Open Questions / Butuh Keputusan Anda

> [!WARNING]
> Sebelum kita melangkah ke tahap desain teknis (arsitektur) atau *coding*, ada beberapa hal strategis yang perlu Anda putuskan:

1. **Pemrosesan Bahasa (NLP Engine):** Apakah kita akan menggunakan AI/LLM (seperti OpenAI API / Gemini API) agar bot sangat cerdas memahami bahasa gaul/typo (namun ini memiliki *cost* per *request* API), ATAU kita mulai dengan *Keyword/Regex matching* yang gratis tapi pengguna harus mengetik dengan format agak baku?
2. **Prioritas OCR:** Fitur OCR membaca struk adalah fitur yang cukup rumit untuk dieksekusi dengan akurasi tinggi. Apakah Anda ingin ini ada dari **Hari Pertama (Day-1 MVP)**, atau kita rilis versi *Text-only* dulu untuk memvalidasi apakah orang suka menggunakan bot-nya?
3. **Database:** Apakah Anda sudah memiliki preferensi Database (misal: PostgreSQL, MongoDB, atau Firebase)? Jika tidak, saya bisa merekomendasikan yang paling cocok dan murah untuk *startup* tahap awal.
