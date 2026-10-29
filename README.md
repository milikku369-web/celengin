# Tabungin
# TABUNGin - Web App Tabungan

🔗 **Situs aktif:** https://milikku369-web.github.io/tabungin/

## a. Judul & Deskripsi

**TABUNGin** adalah aplikasi web celengan digital untuk mencatat tabungan dan merencanakan target menabung.

**Latar belakang masalah:** 
Kurang Motivasi & Lupa Progress: Nabung di celengan fisik sering bikin malas karena jumlah uangnya tidak kelihatan secara visual dan tidak tahu sudah berapa persen m*enuju target.

Bingung Menghitung Target: Banyak siswa bingung harus mengalokasikan uang jajan berapa per hari agar targetnya tercapai di tanggal tertentu.

Aplikasi Keuangan Terlalu Rumit: Aplikasi finansial di Play Store/App Store umumnya terlalu kompleks (banyak grafik saham/investasi) untuk kebutuhan pelajar yang sederhana.

**Solusi:** TABUNGin membantu pengguna mencatat setoran, menghitung simulasi target menabung berdasarkan tenggat waktu, dan tetap termotivasi lewat lencana (*badges*) pencapaian dan web interaktif di mana pengguna bisa membuat wadah "Celengan" sesuai barang impian mereka, memasukkan nominal setoran harian, melihat progress bar terisi secara real-time, dan mendapatkan saran nominal setoran harian.

**Target pengguna:** pelajar, mahasiswa, dan siapa pun yang ingin membangun kebiasaan menabung.

**Fitur utama:**
- Pencatatan tabungan dan riwayat transaksi
- Simulasi target menabung dengan tenggat waktu (kalkulasi *real-time*)
- Gamifikasi lencana/badges
- Registrasi, login, dan auto-login setelah daftar
- Hapus akun dengan masa tenggang 24 jam (*soft-delete*)
- Format mata uang Rupiah otomatis
- Mode gelap (*dark mode*)
- Notifikasi push dan dapat dipasang sebagai PWA
- Fitur cetak riwayat catatan tabungan dalam bentuk file PDF
- Penambahan fitur customisasi warna dan font 
- Custom gambar catatan tabungan


## b. Teknologi yang Digunakan

| Kategori | Teknologi |
|---|---|
| Bahasa | HTML, CSS, JavaScript |
| Styling | Tailwind CSS, Font Poppins |
| Database & Backend | Firebase , LocalStorage (cadangan lokal) |
| Notifikasi | Firebase Cloud Messaging,  |
| PWA | Service Worker (`sw.js`) |
| Platform publikasi | GitHub Pages, GitHub Actions |

## c. Pemanfaatan AI (AI Usage Disclosure)

**Alat AI yang digunakan:** [ Gemini ]

**Contoh prompt utama:**
1. *"Posisikan dirimu sebagai ahli startup aplikasi berbasis web. Berikan ide untuk mengatasi masalah rendahnya literasi keuangan dan kebiasaan menabung yang tidak konsisten di kalangan remaja atau pelajar. Ide ini akan diterapkan pada aplikasi web bernama TABUNGin yang dikembangkan oleh siswa SMA/SMK berusia 16–19 tahun."*

2. *"Rancang struktur HTML dan JavaScript untuk aplikasi pencatatan tabungan, integrasi Firebase Firestore,"*

3. *"Mengapa setelah daftar akun baru user masih harus mengetik ulang username & password untuk login? Buatkan sistem auto-login setelah register dan fitur soft-delete 24 jam."*

4. *"Jelaskan bagaimana alur parsing angka, pemformatan mata uang Rupiah, dan sinkronisasi data lokal ke Firebase Firestore pada script.js."*

**Penyesuaian/perbaikan mandiri terhadap saran AI:**
- Mengubah tata letak kartu celengan di HTML & JS agar sesuai desain awal
- Menyesuaikan kelas Tailwind CSS agar tampilan konsisten, termasuk dark mode
- Menyaring lencana agar hanya menampilkan pencapaian yang relevan
- Menambahkan *event listener* `input` agar simulasi target berjalan real-time
- Mengintegrasikan konfigurasi Firebase secara manual dengan akun Firestore tim
- Menambahkan hitung mundur 20 detik pada tombol hapus akun agar tidak terklik tidak sengaja
- Menguji fallback LocalStorage saat koneksi internet terputus

Catatan lengkap per tahap ada di [`AI_LOGBOOK.md`](./AI_LOGBOOK.md).

## d. Panduan Penggunaan

1. **Buka Aplikasi & Pendaftaran Akun**  
   Buka https://milikku369-web.github.io/tabungin/. Daftar akun baru dengan username dan password, lalu kamu akan otomatis masuk ke dalam sistem.  
   ![Tampilan Registrasi](https://raw.githubusercontent.com/milikku369-web/tabungin/main/assets/step-1-register.jpg)

2. **Membuat Celengan Baru**  
   Buat celengan baru dan isi nama barang impian, nominal target, serta tenggat waktu (deadline).  
   ![Membuat Celengan](https://raw.githubusercontent.com/milikku369-web/tabungin/main/assets/step-2-buat-celengan.jpg)

3. **Melihat Simulasi Target Menabung**  
   Sistem akan secara otomatis menghitung berapa nominal yang perlu kamu tabung per hari, minggu, atau bulan secara *real-time*.  
   ![Simulasi Target](https://raw.githubusercontent.com/milikku369-web/tabungin/main/assets/step-3-simulasi.jpg)

4. **Mencatat Setoran & Transaksi**  
   Catat setoran tiap kali menabung, pantau progres tabungan, serta lihat riwayat transaksi dan unduh rekap cetak PDF.  
   ![Mencatat Setoran](https://raw.githubusercontent.com/milikku369-web/tabungin/main/assets/step-4-setoran.jpg)

5. **Kumpulkan Lencana (Badges)**  
   Buka menu Lencana untuk melihat berbagai pencapaian gamifikasi yang berhasil kamu buka seiring konsistensi menabungmu.  
   ![Lencana Gamifikasi](https://raw.githubusercontent.com/milikku369-web/tabungin/main/assets/step-5-badges.jpg)
.

**Menjalankan secara lokal:**
```bash
git clone https://github.com/milikku369-web/tabungin.git
cd tabungin
# buka index.html di browser, atau pakai server lokal:
npx serve .
```

## e. Identitas Pengembang

| | |
|---|---|
| **Nama lengkap** | Muhamad Riski Ramadan & Muhammad Duta Setiawan Pamungkas |
| **Kelas** | [ XI ] |
| **Jurusan** | [ IPA ]
| **Asal sekolah** | [ SMAN 1 GONDANGLEGI ] |
