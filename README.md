# 🚀 CodaWarm (with AI CodOt) — Personal AI Coding Assistant

![CodaWarm Cover](assets/img/og-image.png)

**CodaWarm (CodOt)** adalah sebuah eksperimen kecil berupa asisten pemrograman berbasis AI sederhana. Aplikasi ini ditenagai oleh **Gemini 3 Flash API** dan dirancang untuk membantu mempercepat proses coding harian tanpa fitur yang berlebihan.

​Proyek ini berawal dari **niat dan ide iseng** saat mengisi waktu luang. Bagi saya, membangun CodaWarm bukan sekadar membuat aplikasi, melainkan salah satu **proses belajar dan sarana untuk memahami lebih dalam** tentang logika coding, integrasi API, serta manajemen state. Ini adalah laboratorium kecil tempat saya bereksperimen dengan kesalahan dan penemuan baru.

​Meskipun sederhana, proyek ini dibangun dengan prinsip: **AI adalah alat, bukan pengambil keputusan**. Seluruh ide, arsitektur, dan alur fitur tetap berada di kendali manusia. AI hanya digunakan sebagai akselerator strategis untuk eksplorasi solusi teknis dan bantuan debugging ringan.

​**CodaWarm** berjalan **sepenuhnya di sisi klien (client-side)**. Karena ini adalah alat yang sangat mendasar, tidak ada server perantara yang rumit. API Key dan data Anda tetap berada di bawah kontrol penuh Anda di dalam browser.

---

## ✨ Fitur Unggulan

- **⚡ Gemini 3 Flash Integration**  
  Respon cepat untuk debugging, pembuatan fungsi, dan penjelasan logika kode secara kontekstual.

- **🧠 **State Management Minimalis**
  Menggunakan skema state _summarization_ berbasis JSON sederhana untuk menjaga konteks percakapan agar tetap efisien.

- **🛡️ Privacy First**  
  API Key dan riwayat percakapan disimpan di `localStorage`. Tidak ada data yang dikirim ke pihak ketiga selain ke Google Gemini API.

- **📂 Artifact Downloads**  
  Potongan kode dapat diunduh langsung sebagai file fisik dengan ekstensi yang sesuai, hanya dengan satu klik.

- **🎨 **UI Ala Kadarnya**
  Menggunakan tema _Glassmorphism_ yang bersih dengan _Loading Motion Screen_ berdurasi 11 detik—_sekadar pemanis untuk menyapa pengguna_.

- **📱 PWA Ready**  
  Mendukung instalasi di Android dan iOS melalui *Add to Home Screen*, lengkap dengan manifest dan meta tag mobile.

---

## 🛠️ Struktur Proyek (Minimalis & Sehat)

```text
codawarm-codot/
├── assets/
│   ├── img/            # Favicon, Apple Touch Icon, & OG Image          
│   └── logo-motion.mp4 # Logo Motion (intro)
├── index.html          # Entry point aplikasi
├── script.js           # Logika AI & State Management
├── style.css           # UI Glassmorphism & Animasi
├── site.webmanifest    # Konfigurasi PWA
├── .gitignore          # File yang diabaikan Git
└── README.md           # Dokumentasi proyek
```

---

## 🚀 Cara Memulai

### 1. Persiapan  
Pastikan memiliki **Gemini API Key**. API Key dapat diperoleh melalui Google AI Studio.

### 2. Instalasi Lokal

Clone repositori:
```bash
git clone https://github.com/dazep01/codawarm.git
```

Masuk ke direktori proyek:
```bash
cd codawarm
```

Jalankan aplikasi:  
Buka `index.html` langsung di browser, atau gunakan **Live Server (VS Code)** untuk pengalaman pengembangan yang lebih nyaman.

### 3. Setup Aplikasi

- Buka aplikasi
- Nikmati loading motion logo CodaWarm
- Masukkan API Key melalui panel pengaturan (ikon user)
- Mulai coding bersama CodOt

---

## 📱 Penggunaan di Mobile (Android & iOS)

CodaWarm mendukung mode **Standalone (PWA)**.

- **Android**:  
  Buka melalui Chrome → menu titik tiga → *Install App*

- **iOS**:  
  Buka melalui Safari → *Share* → *Add to Home Screen*

---

## 🤝 Kontribusi

Kontribusi sangat terbuka dan dihargai.  
Jika memiliki ide untuk peningkatan *state management*, performa AI, atau UI/UX:

1. Fork repositori  
2. Buat branch fitur (`git checkout -b fitur/FiturKeren`)  
3. Commit perubahan (`git commit -m "Menambah Fitur Keren"`)  
4. Push ke branch (`git push origin fitur/FiturKeren`)  
5. Ajukan Pull Request  

---

## 📄 Lisensi

Proyek ini menggunakan **MIT License**.
Lihat file `LICENSE` untuk detail lengkap.

---

**CodaWarm — Powered by Gemini AI**  
_Just a small tool born out of curiosity._

_"Ketika ide manusia yang solid dipadukan dengan kecepatan eksekusi AI, hasilnya bukan sekadar cepat—tapi terarah."_
