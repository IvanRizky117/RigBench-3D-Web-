# RigBench — Interactive PC Architecture & HW-SW Practicum Lab

**RigBench** adalah aplikasi web edukasi dan laboratorium praktikum interaktif arsitektur komputer (*Hardware–Software*), anatomi PC, serta sejarah komputer berbasis **STMIK AKI & D3 TKJ**. Aplikasi ini dirancang *offline-first* (progres disimpan di `localStorage`, audio TTS dicache di IndexedDB, dukungan PWA), dilengkapi panggung Teater 3D Three.js yang dioptimalkan hingga HP kelas entri (seperti Infinix Smart 6), serta **backend Gemini TTS opsional sisi server** (`server.ts` lokal dan **Netlify Functions** `/api/tts/*`) dengan fallback otomatis ke suara lokal browser (*Web Speech API*).

---

## Ringkasan Fitur Utama

### 1. Beranda & Ikhtisar Kesiapan (`HomeTab`)
- **Hero & Preview 3D Ringkas:** Menampilkan pratinjau *Mini Motherboard* 3D interaktif (`LazyMiniMotherboard` / `MiniMotherboardCanvas`) di halaman awal.
- **Bento Progress & Readiness Gauge:** Menghitung indeks kesiapan belajar berdasarkan klaster materi yang diselesaikan, jumlah komponen 3D yang diinspeksi, dan skor Try Out terbaik di perangkat pengguna.
- **Switcher Siklus Kerja & Utilitas:** Simulasi interaktif alur `Input → Process → Output → Storage`, ringkasan kelistrikan PSU vs rubrik penilaian, serta tombol instalasi aplikasi sebagai PWA (`PWAInstallButton`).

### 2. Teater Materi 13 Klaster / 3 Jalur & Lab Elektronika (`LectureTab`)
Tersedia **3 jalur kurikulum terstruktur (13 Klaster, 24 Segmen Narasi 3D)**:
- **Jalur 1 — Praktikum PC (`Modul STMIK AKI`, 7 Klaster · 12 Segmen):**
  - **Klaster 01 — Mainboard & Chipset:** Siklus `Input–Process–Output–Storage`, tur 15 titik papan induk (`#01–#15`), Northbridge (MCH) vs Southbridge (ICH), serta pemetaan 9 port Back Panel I/O (`#16–#24`).
  - **Klaster 02 — Memori & Processor:** ROM (BIOS, *non-volatile*) vs RAM (*volatile*), perbandingan modul SIMM/DIMM/SODIMM, celah *notch* SDRAM–DDR3, serta evolusi Intel vs AMD (1985–2011).
  - **Klaster 03 — PSU & Pinout ATX:** *Grounding* AC-IN, proteksi EMI, Stand-by (`+5VSB`) vs Main Power Supply, Stavolt vs UPS, dan simulator jumper pin PSU ATX 24-pin.
  - **Klaster 04 — Storage, MBR & GPT:** Anatomi HDD 3.5", antarmuka PATA/IDE vs SATA/SCSI, serta perbandingan partisi MBR vs GPT.
  - **Klaster 05 — Instalasi OS & Troubleshoot:** Tahapan prosedural instalasi Windows serta bedah 6 kasus troubleshooting (*MaTot, Blank, Hang, Restart, Lambat, Virus*).
  - **Klaster 06 — Elektronika & Multitester:** Komponen semikonduktor, kalkulator gelang warna resistor (4/5/6 gelang), dan dekoder kapasitor keramik.
  - **Klaster 07 — EULA, Crack & Siber:** Inspektor klausul EULA, anatomi *Patch/Keygen/Loader/No-Disc*, dan 4 pilar bahaya aplikasi bajakan.
- **Jalur 2 — Arsitektur Komputer (`Modul 1 · D3 TKJ`, 3 Klaster · 7 Segmen):**
  - **A1:** 5 tipe komputer (*PC → Supercomputer*), 5 unit fungsional (*Input, Memori & Cache, ALU+Register, Output, Unit Kontrol*), struktur *Single/Multi-Bus*, dan *Register Buffer I/O*.
  - **A2:** Compiler & *Multiprogramming OS* (`t0–t5`), rumus performa `T = (N × S) / R`, *Pipelining* & *Superscalar*, serta arsitektur kurir *RISC vs CISC* dan tolok ukur *SPEC*.
  - **A3:** Pemrosesan paralel *Shared-Memory Multiprocessor*, *Distributed-Memory Multicomputer*, dan *Array Processor SIMD*.
- **Jalur 3 — Sejarah PC (`Modul 6 · D3 TKJ`, 3 Klaster · 5 Segmen):**
  - **S1:** 5 zona alat hitung awal (*Batu/Jari, Abacus, Pascaline 1642 & Colmar, Mesin Babbage & Hollerith, Mark I & Atanasoff-Berry*).
  - **S2:** 5 generasi hardware komputer (*Gen 1 Tabung Vakum ENIAC/EDVAC 160 kW, Gen 2 Transistor IBM 1401, Gen 3 IC Jack Kilby & OS Multi-Program, Gen 4 Mikroprosesor Intel 4004 & IBM PC/Mac GUI, Gen 5 Kubah AI & Superkonduktor*).
  - **S3:** Definisi pakar (*Blissmer, Sanders, Hamacher*), analogi mobil 3 elemen (*Hardware–Software–Brainware*), Jam Analog vs Angka Digital vs Mesin Fax Hybrid, 6 bentuk fisik (*Tower → Palmtop*), dan 4 tangga Era Software (*Pioner, Stabil, Mikro, Modern*).

- **Theater 3D Audio & Sinkronisasi Subtitle:**
  - **Hybrid Gemini TTS (`gemini-3.8-flash-lite-tts`):** Dihasilkan aman lewat rute `/api/tts/:segmentId/:personaId` (Express `server.ts` atau Netlify Function `netlify/functions/tts.mts`) dan di-cache di sisi klien memakai **IndexedDB** (`rigbench-tts-cache`) serta cache LRU memori terbatas.
  - **Deteksi Jeda WAV Tanpa Overhead:** `waveformSync.ts` membedah buffer WAV PCM16 langsung di memori untuk mengunci jeda antar-kalimat dan antar-klausa (`subtitleCues.ts`) sehingga sorotan kata dan subtitle tetap akurat pada kecepatan `0.75x`, `0.9x`, `1x`, `1.25x`, dan `1.5x`.
  - **Fallback Lokal Aman:** Jika `GEMINI_API_KEY` belum diisi di server atau perangkat sedang offline, sistem otomatis memakai suara lokal **Web Speech API** (dan tetap menyimpan audio Gemini jika browser memblokir *autoplay* awal sampai pengguna mengetuk tombol Putar).

### 3. Lab 3D Motherboard PBR & Simulator Rakit PC (`Lab3DTab`)
- **Mode Inspeksi (25 Titik Komponen):** Menjelajahi 24 titik utama motherboard (`#01–#24`) ditambah blok konektor panel depan (`C-Panel / F_PANEL`) pada model 3D PBR Three.js, lengkap dengan kontrol kamera orbit maupun navigasi `WASD`.
- **Mode Rakit PC 3D (22 Langkah Terstruktur):** Simulasi rakit komponen 3D magnetis, validasi arah/rotasi (`R`), jumper HDD (`Master` / `Slave` / `CS`), pengkabelan 5 jalur `F_PANEL`, laporan hasil rakit, dan muat model `.glb`/`.gltf` lokal (maks 25 MB).

### 4. Uji Pemahaman, Try Out & Glosarium (`ExamTab`)
- **Try Out Berwaktu (70% Essay : 30% Pilihan Ganda):** Berisi **14 soal Essay Analisis** dan **15 soal Pilihan Ganda (ABC)** dengan pengatur waktu (`useExamTimer`), penanda ragu-ragu, dan koreksi essay deterministik lokal (`rubricMatcher.ts`).
- **Latihan Terpandu & Glosarium:** Latihan per klaster dengan umpan balik langsung dan **27 kartu glosarium interaktif**.

---

## Optimasi Perangkat Kelas Entri (Infinix Smart 6 / GPU `low` Tier)

Agar berjalan lancar pada ponsel RAM 2–3 GB dan GPU kelas entri seperti **PowerVR GE8320 / Mali-G51 / Adreno 5xx** (`src/utils/deviceTier.ts`):
- **Single-Probe GPU & Software GL Cache:** Deteksi WebGL dilakukan satu kali per sesi (`isSoftwareWebGLCached()`), menghindari pembukaan konteks WebGL ganda saat berpindah diorama.
- **Penurunan Resolusi Tekstur Kanvas Otomatis:** `DioramaResourceTracker` otomatis melakukan *downscale* tekstur papan edukasi/label statis (`textureScale = 0.5`, hemat ~75% VRAM) dan memperlambat frekuensi gambar ulang layar dinamis 3D di tier `low`.
- **Skip PMREM & Penguncian DPR/FPS:** Di tier `low`, kanvas Teater & Mini Motherboard melewati `PMREMGenerator RoomEnvironment`, mengunci `maxDpr = 1`, `antialias = false`, `precision = 'mediump'`, `shadowsEnabled = false`, dan target `30 FPS`, serta mengaktifkan kelas `.gpu-low-tier` untuk mengganti `backdrop-filter` berat dengan latar solid kontras tinggi.
- **Batas Cache Audio Memori (LRU):** `ttsAudioCache.ts` menjaga maksimal **3 klip WAV** di RAM browser sementara arsip penuh tersimpan di IndexedDB.

---

## Tech Stack & Arsitektur

| Kategori | Teknologi / Paket | Versi (`package.json`) | Peran Utama |
| :--- | :--- | :---: | :--- |
| **UI Framework** | React | `^19.0.1` | SPA berbasis hooks & lazy-loaded tabs |
| **Bahasa** | TypeScript | `^7.0.2` | Pengetikan statis ketat klien, server, & serverless function |
| **Backend Lokal** | Express (`tsx` / Node 22) | `^5.3.0` | Proxy `/api/tts/*`, cache WAV `.tts-cache/`, & Vite dev middleware |
| **Serverless Deploy** | Netlify Functions v2 (`esbuild`) | Node `22` | Endpoint `/api/tts/*` otomatis di Netlify via `netlify/functions/tts.mts` |
| **Gemini TTS SDK** | `@google/genai` | `^3.6.1` | Sintesis audio narasi model `gemini-3.8-flash-lite-tts` sisi server |
| **Build Tool** | Vite (`@vitejs/plugin-react`) | `^8.3.0` | Bundler ES module, chunk splitting Three.js/Motion/Icons |
| **Styling** | Tailwind CSS (`@tailwindcss/vite`) | `^4.3.3` | Dark Sapphire UI, tema teater cerah, & mode hemat `.gpu-low-tier` |
| **3D Engine** | Three.js (`@types/three`) | `^0.187.0` | Rendering PBR motherboard, diorama teater 3D, & GLB loader |
| **PWA / Offline** | `vite-plugin-pwa` (Workbox) | `^2.0.0` | Manifest, precache aset statis, & `navigateFallbackDenylist` `/api/*` |

---

## Struktur Direktori Codebase

```text
.
├── .github/workflows/
│   └── gitleaks.yml              # CI GitHub Actions pemindai kebocoran secret otomatis
├── netlify/functions/
│   └── tts.mts                   # Netlify Functions v2 handler untuk /api/tts/*
├── public/                       # Ikon PWA, favicon SVG, & aset statis publik
├── src/
│   ├── components/
│   │   ├── 3d/                   # Engine 3D Three.js, diorama 13 klaster, & resource tracker
│   │   ├── tabs/                 # HomeTab, LectureTab, Lab3DTab, ExamTab, OsDiskTab
│   │   └── ui/                   # PillNav, MobileBottomDock, Toast, PWAInstallButton
│   ├── data/                     # curriculumData, extraCurriculumData, theaterDirector*, examBankData
│   ├── hooks/                    # useSpeechLecture, useProgressStore, useExamTimer, useReducedMotion
│   ├── server/
│   │   └── ttsService.ts         # Layanan Gemini TTS bersama (Express & Netlify Function)
│   ├── types/rigbench.ts         # Definisi tipe TypeScript aplikasi
│   └── utils/                    # deviceTier, waveformSync, subtitleCues, ttsAudioCache, rubricMatcher
├── .env.example                  # Contoh variabel lingkungan server (tanpa secret)
├── .gitleaks.toml                # Aturan allowlist Gitleaks
├── .gitignore                    # Mengecualikan node_modules, dist, .env*, .tts-cache, public/assets/aistudio
├── netlify.toml                  # Build Vite, esbuild functions, routing /api/tts/* & header OWASP
├── server.ts                     # Full-stack server lokal port 3000 (dev & production)
└── vite.config.ts                # Konfigurasi Vite, Workbox PWA, & chunk splitting
```

---

## Keamanan & Kesiapan Deploy

- **Kepatuhan Keamanan (OWASP Top 10:2025):** Header keamanan di `netlify.toml` (`Content-Security-Policy`, `HSTS`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`), sanitasi input (`src/utils/inputSanitizer.ts`), proteksi `localStorage`, dan validasi berkas `.glb`/`.gltf` maks 25 MB.
- **API Key Sisi Server Only:** `GEMINI_API_KEY` hanya dibaca di `src/server/ttsService.ts` (server `server.ts` atau Netlify Function `netlify/functions/tts.mts`), tidak pernah diekspos ke klien atau diawali `VITE_`.
- **Perlindungan Git & Secret:** `.env*` (kecuali `.env.example`), `.tts-cache/`, dan `public/assets/aistudio/` sudah masuk `.gitignore`, serta `.github/workflows/gitleaks.yml` memindai setiap `push` dan `pull_request`.

---

## Menjalankan Lokal & Deploy Otomatis GitHub → Netlify

### 1. Menjalankan Secara Lokal
- Prasyarat: **Node.js 22+** dan **npm**
```bash
# Pasang dependensi
npm install

# Salin contoh env lalu isi GEMINI_API_KEY (opsional; tanpa key tetap jalan dengan suara lokal)
cp .env.example .env

# Jalankan full-stack server dev (port 3000: Vite + /api/tts)
npm run dev

# Verifikasi tipe TypeScript & build produksi
npm run lint
npm run build
```

### 2. Push ke GitHub & Auto-Deploy ke Netlify
1. Inisialisasi repository Git jika belum ada dan pastikan tidak ada file rahasia yang ter-stage:
   ```bash
   git init
   git branch -M main
   git add .
   git status   # Pastikan .env dan .tts-cache/ TIDAK muncul di daftar
   git commit -m "feat: audio-subtitle sync, mobile optimization, and Netlify TTS readiness"
   ```
2. Hubungkan ke GitHub dan push:
   ```bash
   git remote add origin https://github.com/<username>/<repo-rigbench>.git
   git push -u origin main
   ```
3. Hubungkan repository tersebut di dashboard **Netlify** (**Add new site → Import an existing project → GitHub**):
   - Perintah build (`npm run build`), folder publish (`dist`), Node `22`, `netlify/functions`, serta routing `/api/tts/*` akan terdeteksi otomatis dari `netlify.toml`.
   - Buka **Site configuration → Environment variables** di Netlify, tambahkan `GEMINI_API_KEY` berisi kunci Gemini API kamu, lalu lakukan **Trigger deploy → Clear cache and deploy site** agar narasi suara AI Gemini aktif langsung di domain Netlify (jika tidak diisi, aplikasi otomatis memakai suara lokal browser tanpa error).
