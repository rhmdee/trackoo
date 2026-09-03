# 📖 Panduan Pengguna Trackoo Bot (User Guide)

Selamat datang di **Trackoo**! 🎉  
Trackoo adalah asisten pencatat keuangan pribadi cerdas berbasis Telegram yang ditenagai oleh kecerdasan buatan (Google Gemini AI). Anda tidak perlu mengisi formulir yang kaku—cukup ajak ngobrol bot seperti bercakap-cakap dengan teman, dan Trackoo akan mencatat serta mengelola pembukuan Anda secara otomatis.

---

## ⚡ 1. Menu Perintah Utama (Commands)

| Perintah | Deskripsi |
| :--- | :--- |
| `/start` | Memulai bot dan mendaftarkan akun Telegram Anda ke sistem. |
| `/help` | Menampilkan panduan ringkas dan contoh format input. |
| `/summary` | Menampilkan ringkasan pemasukan, pengeluaran, dan saldo bulan berjalan. |
| `/hutang` | Menampilkan rekap siapa yang berhutang ke Anda dan hutang Anda ke orang lain. |
| `/tagihan` | Menampilkan daftar cicilan aktif, nominal per bulan, dan sisa tenor cicilan. |
| `/riwayat` | Melihat 5 transaksi terakhir Anda dengan ID dan tombol hapus cepat. |
| `/hapus <ID>` | Menghapus transaksi spesifik berdasarkan nomor ID-nya. |
| `/cleardata` | Menghapus semua riwayat transaksi & cicilan (reset dari nol). |

---

## 💬 2. Cara Mencatat Keuangan Sehari-hari

Trackoo memahami gaya bahasa santai, singkatan, angka gaul (k, rb, jt), maupun bahasa formal.

### A. Mencatat Pengeluaran (Expense) 💸
Sebutkan barang/jasa dan nominalnya. Kategori akan ditentukan secara otomatis oleh AI.
- `Kopi kenangan 25rb`
- `Makan siang padang 35k`
- `Bensin motor 20.000`
- `Beli tiket bioskop 50rb`

### B. Mencatat Pemasukan (Income) 💰
Sebutkan nominal uang yang masuk ke dompet atau rekening Anda.
- `Gajian kantor 8jt`
- `Dapet transferan 500k dari klien`
- `Nemu duit di saku celana 50rb`
- `Bonus project 1.5jt`

### C. Mencatat Hutang & Piutang 🤝
- **Saat Anda berhutang ke orang lain (Debt):**
  - `Utang ke Andi 50rb buat bayar parkir`
  - `Gua minjem duit Budi 100k`
- **Saat orang lain berhutang ke Anda (Receivable):**
  - `Dimas minjem duit gue 150rb`
  - `Reza ngutang 75k`

---

## 🗓️ 3. Mencatat Transaksi Tanggal Lampau (Backdate)

Lupa mencatat transaksi kemarin atau beberapa hari lalu? Cukup sebutkan keterangannya:
- `Kemarin beli bensin 30rb`
- `Kemarin lusa makan bakso 25k`
- `Tanggal 25 agustus dapet transferan 500rb`
- `3 hari lalu bayar laundry 45rb`

*Trackoo akan otomatis mencatatnya pada tanggal tersebut, bukan tanggal hari ini.*

---

## 🧾 4. Mengelola Cicilan & Multi-Tagihan (Installments)

Trackoo bisa melacak cicilan jangka panjang (misal: Kredivo, ShopeePayLater, cicilan barang, pinjaman berjangka).

### A. Mendaftarkan Cicilan Baru
Sebutkan nama barang/keperluan, pihak peminjam, total nominal, tenor (berapa bulan), dan tanggal jatuh tempo:
- `Gua ada cicilan kredivo hp oppo a92 total 3563400 cicilan 12x jatuh tempo tgl 25`
- `Cicilan laptop asus di shopeepaylater 6jt 6x tgl jatuh tempo 5`

**Balasan Bot:**
Bot akan otomatis menghitung angsuran bulanan Anda:
```text
📝 Cicilan Baru Berhasil Dicatat!

• Pihak: Kredivo
• Keterangan: hp oppo a92
• Total Tagihan: Rp 3.563.400
• Tenor: 12x cicilan
• Angsuran/bulan: Rp 296.950
• Jatuh Tempo: Tiap tgl 25

Semangat bayarnya bosku, biar cepet lunas! 💪
```

### B. Melihat Sisa Cicilan
Ketik perintah:
```text
/tagihan
```
Bot akan menampilkan sisa berapa kali cicilan lagi yang belum lunas.

### C. Pengingat Otomatis (Reminder) ⏰
Setiap hari pada pukul **08:00 pagi**, Trackoo akan memeriksa cicilan yang jatuh tempo pada hari tersebut dan mengirimkan pesan pengingat ke chat Telegram Anda agar Anda tidak terkena denda.

---

## 🗑️ 5. Menghapus & Mengoreksi Transaksi

### A. Menghapus Transaksi Tertentu
1. Ketik `/riwayat` untuk melihat 5 transaksi terakhir dan nomor ID-nya.
2. Klik tombol inline **[🗑️ Hapus ID: xx]** yang ada di bawah pesan, atau ketik:
   ```text
   /hapus 42
   ```

### B. Reset / Bersihkan Semua Data (`/cleardata`)
Jika Anda ingin memulai pembukuan dari lembaran baru atau menghapus data uji coba:
1. Ketik `/cleardata`.
2. Bot akan memunculkan tombol konfirmasi:
   - Klik **🔥 Ya, Hapus Semua Data** untuk konfirmasi penghapusan.
   - Klik **❌ Batalkan** jika tidak sengaja tertekan.

---

## 💡 Tips & Trik Penggunaan
1. **Bahasa Santai:** Anda bebas menggunakan kata *"gue"*, *"gua"*, *"lo"*, *"bro"*, Trackoo tetap mengerti maksud Anda.
2. **Koreksi Cepat:** Jika bot salah memahami angka, cukup gunakan `/riwayat` lalu hapus transaksi tersebut dan ketik ulang dengan nominal yang lebih jelas.
3. **Penyebutan Nominal:** Anda bisa memakai `10k`, `10rb`, `10.000`, `1.5jt`, atau `1500000`.
