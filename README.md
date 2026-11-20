# RigBench — Interactive PC Architecture & HW-SW Practicum Lab

**RigBench** adalah aplikasi web edukasi dan laboratorium praktikum arsitektur komputer (*Hardware–Software*) berbasis **STMIK AKI**. Aplikasi ini dirancang untuk berjalan **100% di sisi klien (*client-side*)** dengan penyimpanan progres otomatis di `localStorage`, kemampuan **PWA offline-ready**, serta **tanpa ketergantungan backend, database eksternal, ataupun panggilan API AI eksternal**.

---

## Ringkasan Fitur Utama

### 1. Beranda & Ikhtisar Kesiapan (`HomeTab`)
- **Hero & Preview 3D Ringkas:** Menampilkan pratinjau *Mini Motherboard* 3D interaktif (`LazyMiniMotherboard` / `MiniMotherboardCanvas`) di halaman awal.
- **Bento Progress & Readiness Gauge:** Menghitung indeks kesiapan belajar berdasarkan klaster materi yang diselesaikan, jumlah komponen 3D yang diinspeksi, dan skor Try Out terbaik di perangkat pengguna.
- **Switcher Siklus Kerja & Utilitas:** Simulasi interaktif alur `Input → Process → Output → Storage`, ringkasan kelistrikan PSU vs rubrik penilaian, serta tombol instalasi aplikasi sebagai PWA (`PWAInstallButton`).

### 2. Teater Materi 7 Klaster & Lab Elektronika (`LectureTab`)
- **7 Klaster Kurikulum (12 Segmen Narasi Terstruktur):**
  - **Klaster 01 — Mainboard & Chipset:** Siklus dasar komputer, anatomi 24 titik mainboard, Northbridge (MCH) vs Southbridge (ICH), serta peta 9 port Back Panel I/O (`#16–#24`).
  - **Klaster 02 — Memori & Processor:** ROM (BIOS, *non-volatile*) vs RAM (*volatile*), perbandingan modul SIMM/DIMM/SODIMM, celah *notch* SDRAM–DDR3, serta lini masa Intel vs AMD (1985–2011).
  - **Klaster 03 — PSU & Pinout ATX:** *Grounding* AC-IN, proteksi EMI, Stand-by (`+5VSB`) vs Main Power Supply, Stavolt vs UPS, dan simulator jumper pin PSU ATX 24-pin (Pin 16 Hijau `PS_ON` + Ground).
  - **Klaster 04 — Storage, MBR & GPT:** Media penyimpanan HDD/SSD, antarmuka SATA/IDE, serta perbandingan partisi MBR dan GPT.
  - **Klaster 05 — Instalasi OS & Troubleshoot:** Tahapan instalasi sistem operasi serta studi kasus troubleshooting hardware (blank screen, MaTot, bunyi beep, dsb.).
  - **Klaster 06 — Elektronika & Multitester:** Pengenalan komponen semikonduktor, kalkulator kode warna resistor (4/5/6 gelang), dan dekoder nilai kapasitor keramik.
  - **Klaster 07 — EULA, Crack & Siber:** Inspektor klausul EULA, etika lisensi perangkat lunak, risiko *software cracking*, dan keamanan siber dasar.
- **Theater Stage Player & Sinkronisasi Suara Lokal:** Menggunakan **Web Speech API (`speechSynthesis`)** browser dengan antrean per-baris (`onstart`/`onend`), kalibrasi kecepatan baca (CPS) adaptif, diagram SVG dinamis per segmen, dan transkrip interaktif.

### 3. Lab 3D Motherboard PBR & Simulator Rakit PC (`Lab3DTab`)
- **Mode Inspeksi (25 Titik Komponen):** Menjelajahi 24 titik utama motherboard (`#01–#24`) ditambah blok konektor panel depan (`C-Panel / F_PANEL`) pada model 3D PBR prosedural Three.js, lengkap dengan kontrol kamera orbit maupun navigasi bebas `WASD`.
- **Kartu Inspeksi Responsif & Audio Penjelasan:** Menampilkan fungsi standar, poin teknis, dan *jebakan soal* (`InspectPopupCard`). Pada layar mobile (`< 640px`), kartu tampil sebagai *Compact Bottom Sheet* (`max-h-[36dvh]`) dengan tombol ekspansi `Detail`/`Ringkas` agar objek motherboard 3D tetap terlihat leluasa.
- **Mode Rakit PC 3D (22 Langkah Terstruktur):** Simulasi *drag-and-drop* komponen 3D magnetis (`STRICT_ASSEMBLY_ITEMS`), validasi arah/rotasi komponen (tombol `R`), pengaturan jumper HDD (`Master` / `Slave` / `Cable Select`), pengkabelan 5 jalur `F_PANEL` (`HDD LED`, `+P LED`, `-P LED`, `RESET SW`, `POWER SW`), laporan hasil rakit (`AssemblyPostReportModal`), dan dukungan opsional muat model `.glb`/`.gltf` lokal (maksimal 25 MB).

### 4. Uji Pemahaman, Try Out & Glosarium (`ExamTab`)
- **Try Out Berwaktu (70% Essay : 30% Pilihan Ganda):** Berisi **14 soal Essay Analisis** dan **15 soal Pilihan Ganda (ABC)** dengan pengatur waktu hitung mundur (`useExamTimer`), penanda ragu-ragu (*flag*), dan kisi navigasi nomor soal.
- **Smart Local Rubric Analyzer (`rubricMatcher.ts`):** Mesin koreksi essay deterministik yang berjalan lokal di browser menggunakan pencocokan kata kunci konsep, peta sinonim istilah hardware, *stemming* Bahasa Indonesia, toleransi typo ringan (*Levenshtein distance ≤ 1*), serta *anti-spam guard*.
- **Latihan Terpandu & Glosarium Interaktif:** Mode latihan per klaster dengan umpan balik langsung (`GuidedPracticePanel`) dan **27 kartu glosarium interaktif** (`GlossaryFlashcards`) dengan pencarian instan.

### 5. Modul Simulator Tambahan (`OsDiskTab`)
- Komponen simulasi instalasi sistem operasi dan manajemen partisi disk (`EFI`, `C: NTFS`, `Recovery`, *shrink/format* partisi) tetap tersedia di `src/components/tabs/OsDiskTab.tsx` (saat ini disembunyikan dari bilah navigasi 4 tab utama).

---

## Tech Stack & Framework

| Kategori | Teknologi / Paket | Versi (`package.json`) | Peran Utama |
| :--- | :--- | :---: | :--- |
| **UI Framework** | React | `^19.0.1` | Arsitektur komponen SPA berbasis hooks & lazy-loaded tabs |
| **Bahasa** | TypeScript | `^7.0.2` | Pengetikan statis ketat di seluruh data, hook, dan komponen |
| **Build Tool** | Vite (`@vitejs/plugin-react`) | `^8.3.0` | Bundler modul ES, code-splitting vendor, dan dev server |
| **Styling** | Tailwind CSS (`@tailwindcss/vite`) | `^4.3.3` | Utility-first styling dengan tema Dark Sapphire & `.liquid-glass` |
| **3D Engine** | Three.js (`@types/three`) | `^0.187.0` | Rendering motherboard PBR 3D, partikel/pencahayaan, & GLB loader |
| **Animasi** | Framer Motion | `^14.14.0` | Transisi halaman, scroll choreography, dan micro-interactions |
| **Ikonografi** | Phosphor Icons (`@phosphor-icons/react`) | `^2.1.10` | Set ikon konsisten di navbar, dok mobile, dan kartu modul |
| **PWA / Offline** | `vite-plugin-pwa` (Workbox) | `^2.0.0` | Manifest aplikasi, precache aset statis, dan indikator offline |
| **Audio & Suara** | Web Speech API & Web Audio API | Native Browser | Narasi materi TTS lokal & efek suara mekanis lab rakit 3D |

---

## Struktur Direktori Codebase

```text
.
├── .github/workflows/
│   └── gitleaks.yml              # CI GitHub Actions untuk pemindaian secret otomatis
├── public/                       # Ikon PWA, favicon SVG, & aset statis publik
├── src/
│   ├── components/
│   │   ├── 3d/                   # Engine 3D Three.js (motherboard builder, kamera, GLB loader)
│   │   ├── tabs/
│   │   │   ├── exam/             # Panel hasil Try Out & latihan terpandu per klaster
│   │   │   ├── home/             # Bento grid, feature sections, & lazy mini motherboard
│   │   │   ├── lab3d/            # Bottom dock rakit, kartu inspeksi, artwork, & laporan POST
│   │   │   ├── lecture/          # Theater player, diagram SVG, backdrop, transkrip, & lab klaster
│   │   │   ├── ExamTab.tsx       # Tab Uji Pemahaman (Try Out, Latihan, Glosarium)
│   │   │   ├── HomeTab.tsx       # Tab Beranda
│   │   │   ├── Lab3DTab.tsx      # Tab Lab 3D Inspeksi & Rakit PC
│   │   │   ├── LectureTab.tsx    # Tab Teater Materi 7 Klaster
│   │   │   └── OsDiskTab.tsx     # Tab simulasi OS & Disk Management (tersimpan internal)
│   │   └── ui/                   # Komponen UI bersama (PillNav, MobileBottomDock, Toast, PWA)
│   ├── data/
│   │   ├── assemblyGameData.ts   # 22 langkah rakit PC ketat & peta kabel F_PANEL
│   │   ├── curriculumData.ts     # 7 klaster materi, 12 segmen narasi, CPU/RAM/ATX/EULA data
│   │   ├── examBankData.ts       # 14 soal Essay, 15 soal ABC, & 27 entri Glosarium
│   │   └── mainboardData.ts      # 25 titik inspeksi mainboard (#01–#24 + C-Panel)
│   ├── hooks/                    # State progres localStorage, timer ujian, PWA, & speech sync
│   ├── types/rigbench.ts         # Definisi tipe TypeScript utama aplikasi
│   ├── utils/                    # Rubric matcher, sanitasi input, kalkulator, SFX, & subtitle
│   ├── App.tsx                   # Shell navigasi utama & lazy-loading antar tab
│   ├── index.css                 # Gaya global Tailwind v4 & token desain RigBench
│   └── main.tsx                  # Entry point React
├── .env.example                  # Contoh placeholder variabel lingkungan (tanpa secret)
├── .gitleaks.toml                # Aturan & allowlist URL publik aman untuk Gitleaks
├── .gitignore                    # Pengecualian node_modules, dist, dev-dist, .env*, & aset chat
├── AEGIS_AUDIT_REPORT.md         # Laporan audit keamanan OWASP Top 10:2025
├── index.html                    # Entry HTML & metadata SEO/PWA
├── netlify.toml                  # Konfigurasi build Netlify, SPA redirect 200, & header OWASP
├── package.json                  # Dependensi dan skrip build/lint/dev
└── vite.config.ts                # Konfigurasi Vite, chunk splitting, dan Workbox PWA
```

---

## Keamanan & Kesiapan Deploy

- **Kepatuhan Keamanan (OWASP Top 10:2025):**
  - Header keamanan aktif di `netlify.toml`: `Content-Security-Policy` ketat, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy`.
  - Sanitasi seluruh input pengguna (`src/utils/inputSanitizer.ts`) untuk mencegah pola XSS, kontrol panjang karakter, dan pembatasan input pencarian/essay.
  - Validasi skema dan perlindungan *prototype pollution* pada pembacaan `localStorage` (`src/hooks/useProgressStore.ts`).
  - Validasi unggahan file `.glb`/`.gltf` di Lab 3D maksimal **25 MB** beserta pemeriksaan header biner `glTF` (*magic bytes*).
- **Perlindungan Kebocoran Secret (Gitleaks):**
  - Tidak ada API key, token pribadi, atau file `.env` sensitif yang tersimpan di proyek.
  - Workflow `.github/workflows/gitleaks.yml` otomatis memindai setiap `push` dan `pull_request` dengan konfigurasi `.gitleaks.toml`.
  - Folder `public/assets/aistudio/`, `dist/`, `dev-dist/`, `node_modules/`, dan `.env*` (kecuali `.env.example`) sudah dikecualikan di `.gitignore`.

---

## Menjalankan Secara Lokal & Deploy

### Prasyarat
- **Node.js 20+** dan **npm** (atau **Bun**)

### Perintah Pengembangan & Build
```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan development server (port 3000)
npm run dev

# 3. Verifikasi tipe TypeScript ketat
npm run lint

# 4. Build produksi untuk Netlify / static hosting
npm run build
```

### Deploy ke GitHub & Netlify
1. Inisialisasi Git jika folder proyek belum memiliki `.git`:
   ```bash
   git init
   git branch -M main
   git add .
   git status   # Pastikan tidak ada .env atau file sensitif yang ikut ter-stage
   git commit -m "chore: initial commit RigBench production-ready"
   ```
2. Hubungkan ke repository GitHub dan push:
   ```bash
   git remote add origin https://github.com/<username>/<repo-rigbench>.git
   git push -u origin main
   ```
3. Hubungkan repository GitHub tersebut di dashboard **Netlify** — pengaturan build (`npm run build`, publish directory `dist`, Node `20`, SPA redirect, dan header keamanan) akan terbaca otomatis dari `netlify.toml`.
