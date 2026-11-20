import type {
  AtxPinSpec,
  CpuMilestone,
  CrackToolSpec,
  CurriculumCluster,
  EulaClause,
  PiracyPillar,
  RamGenerationSpec,
  TroubleshootingCase,
} from '../types/rigbench';

export const CURRICULUM_CLUSTERS: CurriculumCluster[] = [
  {
    id: 'cluster-1',
    number: '01',
    shortTitle: 'Mainboard & Chipset',
    title: 'Anatomi Mainboard (24 Titik) & Arsitektur Chipset',
    subtitle: 'Siklus Input-Process-Output-Storage, 15 komponen papan induk, 9 port Back Panel I/O, serta perbandingan Northbridge vs Southbridge.',
    ttsWeight: 'Bobot Tinggi — Essay & Identifikasi',
    summaryPoints: [
      'Siklus fundamental komputer: Input Device → Processing Unit (CPU + RAM) → Output Device & Storage Device.',
      '15 titik komponen utama papan induk (#01 Soket Prosesor hingga #15 Blok Back Panel) serta 9 port Back Panel I/O (#16 PS/2 Mouse hijau hingga #24 Audio Jack).',
      'Northbridge (MCH) mengelola jalur berkecepatan tinggi: CPU, RAM, kartu grafis (AGP/PCIe x16), dan power management.',
      'Southbridge (ICH) mengendalikan periferal kecepatan rendah: SATA/IDE, PCI, ROM BIOS, Keyboard/Mouse, USB, LAN, dan Audio.',
    ],
    trapWarning:
      'Jebakan TTS: Jangan pernah menukar fungsi Northbridge (CPU, RAM, VGA) dengan Southbridge (SATA, IDE, USB, LAN, PCI, BIOS). Hafalkan juga warna PS/2 Mouse = Hijau dan PS/2 Keyboard = Ungu.',
    segments: [
      {
        id: 'c1-s1',
        title: 'Siklus Kerja Komputer & Peran Tulang Punggung Motherboard',
        durationSec: 26,
        narration:
          'Sistem komputer modern selalu bekerja mengikuti siklus pengolahan data fundamental: Input, lalu Process, kemudian Output dan Storage. Instruksi mentah masuk lewat perangkat input seperti keyboard dan mouse, dialirkan melalui jalur sirkuit papan induk atau motherboard menuju CPU dengan dukungan memori sementara RAM, lalu hasilnya ditampilkan di monitor dan disimpan permanen pada harddisk atau SSD.',
        highlightedKeywords: ['Input', 'Process', 'Output', 'Storage', 'Motherboard', 'CPU', 'RAM'],
        visualType: 'ipo-cycle',
        stageCaption: 'Aliran Data Fundamental: Input → Process (CPU + RAM) → Output & Storage',
        examTakeaway: 'Selalu sebutkan keempat tahap siklus beserta contoh perangkat konkret saat menjawab soal arsitektur dasar.',
      },
      {
        id: 'c1-s2',
        title: 'Arsitektur Chipset: Northbridge (MCH) vs Southbridge (ICH)',
        durationSec: 30,
        narration:
          'Pada motherboard klasik berbasis chipset ganda, lalu lintas data dibagi dua. Northbridge atau Memory Controller Hub menjembatani komponen berkecepatan tinggi yaitu prosesor, main memory RAM, dan kartu grafis AGP atau PCI Express x16 sekaligus mengatur power management. Sementara Southbridge atau I/O Controller Hub menangani periferal berkecepatan lebih rendah seperti port SATA, IDE, slot PCI, ROM BIOS, USB, LAN, serta audio.',
        highlightedKeywords: ['Northbridge', 'MCH', 'kecepatan tinggi', 'CPU', 'RAM', 'VGA', 'Southbridge', 'ICH', 'SATA', 'BIOS'],
        visualType: 'chipset-bridge',
        stageCaption: 'Diagram Blok Chipset: Jalur Cepat Northbridge (Cyan) vs Periferal Southbridge (Amber)',
        examTakeaway: 'Kunci skor penuh Essay: bedakan tegas komponen yang dikontrol Northbridge dan Southbridge.',
      },
      {
        id: 'c1-s3',
        title: 'Pemetaan 9 Port Back Panel I/O (#16 s/d #24)',
        durationSec: 28,
        narration:
          'Di sisi belakang casing terdapat blok Back Panel titik nomor lima belas yang memuat sembilan port penting. Nomor enam belas PS2 Mouse berwarna hijau, tujuh belas PS2 Keyboard berwarna ungu, delapan belas port Paralel delapan bit untuk printer lawas, sembilan belas port Serial, dua puluh SPDIF untuk audio home theatre, dua puluh satu Firewire untuk video capture kecepatan tinggi, dua puluh dua RJ45 untuk jaringan LAN, dua puluh tiga USB, dan dua puluh empat port Audio.',
        highlightedKeywords: ['PS/2 Mouse', 'hijau', 'PS/2 Keyboard', 'ungu', 'Paralel 8-bit', 'SPDIF', 'Firewire', 'RJ45', 'USB'],
        visualType: 'back-panel-map',
        stageCaption: 'Peta Presisi 9 Port Back Panel I/O Standar Modul STMIK AKI (#16–#24)',
        examTakeaway: 'SPDIF = Home Theatre, Firewire = Video Capture, Paralel = 8-bit Printer lama, RJ45 = LAN.',
      },
    ],
  },
  {
    id: 'cluster-2',
    number: '02',
    shortTitle: 'Memori & Processor',
    title: 'Memori (ROM vs RAM) & Evolusi Processor (1985–2011)',
    subtitle: 'Perbedaan sifat volatile vs non-volatile, SIMM/DIMM/SODIMM, notch & pin SDRAM–DDR3, serta garis waktu Intel vs AMD.',
    ttsWeight: 'Bobot Tinggi — ABC & Komparasi',
    summaryPoints: [
      'ROM/BIOS bersifat non-volatile (tidak hilang saat listrik mati): menyimpan instruksi membaca OS, cek hardware (POST), dan pesan layar.',
      'RAM bersifat volatile (penyimpanan sementara saat PC menyala) untuk mempercepat pemrosesan data secara acak.',
      'SIMM (30 pin pasang 4 keping, 72 pin min 2 keping, 1 sisi aktif) vs DIMM (168–240 pin, 2 sisi aktif, cukup 1 keping) vs SODIMM (laptop).',
      'SDRAM (168 pin, 2 notch, maks 512MB) → DDR1 (184 pin, 1 notch, maks 1GB) → DDR2 (240 pin, 1 notch agak kiri, maks 2GB) → DDR3 (240 pin, 1 notch lebih kiri, maks 4GB).',
    ],
    trapWarning:
      'Jebakan TTS: DDR2 dan DDR3 sama-sama memiliki 240 pin dan 1 notch, namun letak celah notch DDR3 lebih bergeser ke kiri sehingga tidak bisa saling ditukar.',
    segments: [
      {
        id: 'c2-s1',
        title: 'ROM (Non-Volatile) vs RAM (Volatile) & Modul SIMM/DIMM',
        durationSec: 28,
        narration:
          'Memori komputer terbagi menjadi dua kelompok utama. ROM atau Read Only Memory bersifat non-volatile sehingga isinya tidak hilang saat listrik mati; di komputer disebut BIOS yang berisi perintah membaca sistem operasi dari disk, mengecek semua hardware, dan menampilkan pesan layar. Sebaliknya, RAM bersifat volatile sebagai memori kerja sementara yang mempercepat kerja CPU. Secara fisik modul lama memakai SIMM yang satu sisinya aktif dan wajib dipasang berpasangan, sedangkan DIMM aktif di kedua sisi sehingga cukup satu keping saja.',
        highlightedKeywords: ['ROM', 'non-volatile', 'BIOS', 'RAM', 'volatile', 'SIMM', 'DIMM', 'SODIMM'],
        visualType: 'ram-notch-evolution',
        stageCaption: 'Perbandingan Struktur Pin & Posisi Notch: SDRAM (2 Notch) vs DDR1 / DDR2 / DDR3',
        examTakeaway: 'Hafal tepat: SDRAM = 168 pin & 2 notch; DDR1 = 184 pin; DDR2 & DDR3 = 240 pin (notch geser ke kiri).',
      },
      {
        id: 'c2-s2',
        title: 'Persaingan Evolusi Processor Intel vs AMD (1985–2011)',
        durationSec: 27,
        narration:
          'Sejarah prosesor desktop dalam modul STMIK AKI menampilkan persaingan ketat Intel dan AMD. Intel memulai dari i386 tahun 1985, i486 tahun 1989, keluarga Pentium 1 hingga Pentium 4 di tahun 2000, lalu masuk era multi-core melalui Core Duo 2006, Core 2 Duo 2007, Core i3, i5, Atom 2010, dan Core i7 tahun 2011. Sementara AMD berevolusi dari Am386 tahun 1991, seri K5 dan K6, Athlon tahun 2000, Duron, Sempron, Athlon 64 X2 dan Opteron 2008, Phenom 2010, hingga Fusion APU dan AMD FX pada 2011.',
        highlightedKeywords: ['i386', 'Pentium 4', 'Core 2 Duo', 'Core i7', 'Am386', 'Athlon', 'Phenom', 'AMD FX'],
        visualType: 'cpu-timeline',
        stageCaption: 'Garis Waktu Persaingan Arsitektur Processor Intel vs AMD (1985–2011)',
        examTakeaway: 'Perhatikan tahun tonggak: Pentium 4 & Athlon (2000), Core 2 Duo (2007), Core i7 & AMD FX (2011).',
      },
    ],
  },
  {
    id: 'cluster-3',
    number: '03',
    shortTitle: 'PSU & Pinout ATX',
    title: 'Kelistrikan PSU, Pengaman Daya & Pinout ATX 24-Pin',
    subtitle: 'AC-IN Grounding, Stand-by vs Main Power Supply, pelindung EMI logam, Stavolt vs UPS, serta simulator jumper pin hijau-hitam.',
    ttsWeight: 'Bobot Tinggi — Studi Kasus MaTot',
    summaryPoints: [
      'Grounding (pin ke-3 AC-IN) wajib menetralisir tegangan bocor induksi SMPS agar motherboard tidak terkena kejutan listrik dan hang.',
      'Casing logam PSU berfungsi meredam interferensi elektromagnetik (EMI) dari pensaklaran SMPS agar tidak menimbulkan noise audio/video/BUS.',
      'Stand-by Power Supply (+5VSB kabel ungu, pin 9) aktif seketika saat dicolok PLN; Main Power Supply (+3.3V, +5V, +12V, -12V) aktif setelah trigger Power SW.',
      'Stavolt/AVR menstabilkan fluktuasi tegangan PLN di 220V; UPS memberi cadangan baterai darurat saat listrik padam mendadak.',
    ],
    trapWarning:
      'Jebakan TTS: Jangan tertukar antara Stavolt (stabilizer voltase) dan UPS (baterai cadangan). Untuk tes mandiri PSU, jumper kabel Hijau (Pin 16 PS_ON) dengan kabel Hitam (Ground).',
    segments: [
      {
        id: 'c3-s1',
        title: 'Anatomi Modul SMPS: Grounding, Stand-by (+5VSB), dan EMI Shield',
        durationSec: 30,
        narration:
          'Power Supply Unit mengolah tegangan AC 220 volt dari PLN menjadi beberapa jalur tegangan DC rendah untuk komputer. Pada soket AC-IN terdapat pin Ground yang sangat krusial untuk menetralisir tegangan bocor proses induksi SMPS agar motherboard tidak hang. Di dalam SMPS terdapat dua unit: Stand-by Power Supply bertegangan plus 5 volt kabel ungu yang langsung aktif saat kabel dicolok ke PLN, serta Main Power Supply yang baru menyala setelah mendapat trigger tombol power. Casing logam PSU melindungi sinyal audio, video, dan BUS dari interferensi elektromagnetik EMI.',
        highlightedKeywords: ['SMPS', 'Ground', 'tegangan bocor', '+5VSB', 'ungu', 'Main Power Supply', 'EMI', 'Stavolt', 'UPS'],
        visualType: 'psu-smps-flow',
        stageCaption: 'Alur Daya PSU: AC 220V + Ground → SMPS (Stand-by +5VSB & Main DC Rail) → ATX 24-Pin',
        examTakeaway: 'Kabel penting ATX: Hijau = PS_ON (Pin 16), Hitam = Ground, Ungu = +5V Stand-by (Pin 9), Kuning = +12V, Merah = +5V, Oranye = +3.3V.',
      },
    ],
  },
  {
    id: 'cluster-4',
    number: '04',
    shortTitle: 'Storage, MBR & GPT',
    title: 'Media Penyimpanan, Interface & Manajemen Partisi',
    subtitle: 'Anatomi HDD, PATA/IDE vs SATA 1–3 vs SCSI, skema partisi MBR vs GPT, Basic vs Dynamic Disk, serta NTFS vs FAT32.',
    ttsWeight: 'Bobot Sangat Tinggi — Essay Tabel',
    summaryPoints: [
      'Anatomi HDD: Platter (piringan magnetik), Read/Write Head, Access Arm, Cylinder, Magnet, dan Electronic Board. Kecepatan putaran: RPM (5400/7200/10000–15000 SCSI).',
      'PATA/IDE (40-wire HDD, 34-wire FDD, maks 18 inci / 46 cm, jumper Master/Slave) vs SATA 1 (1,5 GB/s), SATA 2 (3 GB/s), SATA 3 (6 GB/s, hot-swapping, NCQ).',
      'MBR (Legacy BIOS, maks 2 TB, maks 4 partisi primer / 3 primer + 1 extended, 1 sektor tabel) vs GPT (UEFI, >2 TB hingga 18 EB, hingga 128 partisi primer, cadangan CRC32).',
      'NTFS mendukung hak akses (permissions), enkripsi, kompresi, dan journaling (wajib untuk drive Windows C:). FAT32 dibatasi maksimal 4 GB per satu berkas.',
    ],
    trapWarning:
      'Jebakan TTS: Drive sistem instalasi Windows wajib diformat NTFS, dan wajib menyisakan ruang kosong minimal 20%–30% untuk virtual memory (pagefile.sys) agar sistem tidak lambat.',
    segments: [
      {
        id: 'c4-s1',
        title: 'Anatomi HDD, Interface PATA/SATA/SCSI, dan Skema MBR vs GPT',
        durationSec: 32,
        narration:
          'Harddisk menyimpan data pada piringan magnetik platter yang dibaca oleh read-write head pada ujung access arm. Antarmuka PATA atau IDE memakai kabel pita lebar 40-wire maksimal delapan belas inci dengan jumper Master dan Slave, sedangkan SATA memakai kabel tipis berkecepatan 1,5 hingga 6 gigabyte per detik dengan fitur hot-swapping dan Native Command Queuing. Dalam manajemen partisi, skema lama MBR berbasis Legacy BIOS dibatasi kapasitas dua terabyte dan empat partisi primer. Sebaliknya skema modern GPT berbasis UEFI mendukung kapasitas lebih dari dua terabyte hingga delapan belas Exabyte, seratus dua puluh delapan partisi primer mandiri, serta cadangan tabel partisi CRC32.',
        highlightedKeywords: ['Platter', 'PATA', '40-wire', 'SATA 3', 'MBR', '2 TB', '4 partisi primer', 'GPT', 'UEFI', '128 partisi', 'NTFS', 'FAT32', '4 GB'],
        visualType: 'hdd-mbr-gpt',
        stageCaption: 'Perbandingan Kapabilitas Skema Partisi MBR (Legacy BIOS) vs GPT (UEFI) & File System',
        examTakeaway: 'Kuasai 4 angka emas: MBR = 2 TB & 4 primer; GPT = >2 TB & 128 primer; FAT32 = maks 4 GB/file; buffer kosong C: = 20–30%.',
      },
    ],
  },
  {
    id: 'cluster-5',
    number: '05',
    shortTitle: 'Instalasi OS & Troubleshoot',
    title: 'Prosedur Instalasi OS & 6 Kasus Troubleshooting Hardware',
    subtitle: 'Alur instalasi Windows dari BIOS Boot Priority hingga driver, plus diagnosa lengkap MaTot, Blank, Hang, Restart, Lambat, dan Virus.',
    ttsWeight: 'Bobot Sangat Tinggi — Studi Kasus Essay',
    summaryPoints: [
      'Urutan instalasi OS: BIOS Boot Priority (Del/F2 → 1st Boot CD/USB → F10) → Press any key → EULA (F8) → Partisi & Format NTFS Quick → Copy & Reboot → Nama/Product Key 25 digit → GMT+07:00 → Driver & Aplikasi.',
      'Mati Total (MaTot): Cek sumber listrik → jumper hijau-hitam PSU → bersihkan pin RAM & reset CMOS → cek kapasitor elko menggelembung & suhu IC NB/SB.',
      'Blank (LED & kipas nyala, layar gelap): Cek tegangan PSU → bersihkan pin tembaga RAM pakai penghapus karet → pindah slot → cek monitor/kabel/VGA → tes hidup tanpa RAM untuk cek bunyi beep.',
      'Hang (mouse macet, NumLock mati-nyala gagal) & Restart: cek suhu prosesor/thermal paste, baterai CMOS (<2V), bad sector HDD via HBCD, dan uji Safe Mode.',
    ],
    trapWarning:
      'Jebakan TTS: Bedakan jelas gejala MATOT (kipas & LED mati semua) vs BLANK (LED menyala & kipas berputar tetapi layar monitor gelap). Langkah pertama perbaikan RAM selalu bersihkan pin emas dengan penghapus karet.',
    segments: [
      {
        id: 'c5-s1',
        title: 'Tahapan Prosedural Instalasi Sistem Operasi Windows',
        durationSec: 27,
        narration:
          'Instalasi sistem operasi diawali dengan masuk menu BIOS menekan tombol Delete atau F2 untuk mengatur First Boot Device ke CDROM atau Flashdisk lalu menyimpan konfigurasi dengan F10. Setelah muncul pesan Press any key to boot, setujui lisensi EULA, buat partisi sistem Drive C dan format dengan sistem berkas NTFS Quick. Setelah penyalinan berkas dan restart otomatis, isikan identitas pengguna, masukkan dua puluh lima karakter Product Key, atur zona waktu GMT plus 7, lalu tutup dengan instalasi driver chipset, VGA, LAN, dan audio.',
        highlightedKeywords: ['BIOS', 'Boot Priority', 'F10', 'EULA', 'NTFS', 'Product Key', '25 karakter', 'GMT+07:00', 'Driver'],
        visualType: 'os-boot-pipeline',
        stageCaption: 'Pipeline 9 Tahap Instalasi Sistem Operasi Sesuai Standar Praktikum STMIK AKI',
        examTakeaway: 'Urutan langkah harus kronologis: BIOS → Boot Media → Partisi NTFS → Copy & Reboot → Product Key → Driver.',
      },
      {
        id: 'c5-s2',
        title: 'Bedah Sistematis 6 Kasus Troubleshooting PC',
        durationSec: 30,
        narration:
          'Dalam ujian praktikum terdapat enam kasus troubleshooting utama. Pada Mati Total, kipas dan LED sama sekali tidak menyala sehingga pemeriksaan dimulai dari stopkontak dan uji jumper kabel hijau-hitam PSU. Pada kasus Blank, kipas berputar dan LED menyala namun layar kosong; langkah utamanya adalah membersihkan pin tembaga RAM menggunakan penghapus karet, mereset baterai CMOS, serta menguji bunyi beep tanpa RAM. Untuk Hang dan Restart, periksa indikator NumLock, overheat heatsink prosesor, bad sector harddisk, dan tegangan CMOS di bawah dua volt.',
        highlightedKeywords: ['Mati Total', 'jumper hijau-hitam', 'Blank', 'penghapus karet', 'Reset CMOS', 'bunyi beep', 'Hang', 'NumLock', 'Overheat'],
        visualType: 'troubleshooting-matrix',
        stageCaption: 'Pohon Diagnosa 6 Kasus Troubleshooting: MaTot, Blank, Hang, Restart, Lambat, Virus',
        examTakeaway: 'Saat menjawab studi kasus Essay, susun jawaban rapi dalam 3 blok: Gejala → Kemungkinan Penyebab → Langkah Perbaikan Bertahap.',
      },
    ],
  },
  {
    id: 'cluster-6',
    number: '06',
    shortTitle: 'Elektronika & Multitester',
    title: 'Komponen Elektronika Dasar & Pengukuran Multitester',
    subtitle: 'Kalkulator gelang warna Resistor, dekoder Kapasitor keramik & ELCO, Dioda/Zener, Transistor PNP/NPN, MOSFET, IC, dan Trafo.',
    ttsWeight: 'Bobot Sedang–Tinggi — Hitungan & ABC',
    summaryPoints: [
      'Resistor: penghambat arus (satuan Ohm Ω). Variable resistor: Potensiometer, Trimpot, NTC (panas→hambatan turun), PTC (panas→hambatan naik), LDR (terang→hambatan turun).',
      'Kapasitor (Farad): penyimpan & perata arus. ELCO punya polaritas (panah = kaki negatif); keramik kode 3 digit (contoh 103 = 10 × 10³ pF = 10.000 pF = 10 nF = 0,01 µF).',
      'Hasil ukur Kapasitor dengan Ohmmeter: gerak lalu kembali = Baik; gerak tidak kembali = Bocor; diam = Putus; menunjuk nol = Short.',
      'Dioda Silikon (0,6 VDC) & Germanium (0,2 VDC) sebagai penyearah (forward-biased vs reverse-biased); Zener penstabil tegangan; Transistor (B-C-E); MOSFET (G-D-S); IC diuji langsung di rangkaian; Trafo hanya bekerja pada tegangan AC.',
    ],
    trapWarning:
      'Jebakan TTS: Jangan lupa urutan kaki MOSFET dari kiri ke kanan saat menghadap kita adalah Gate – Drain – Source (G-D-S), dan IC tidak dapat divonis baik/rusak hanya lewat multitester.',
    segments: [
      {
        id: 'c6-s1',
        title: 'Membaca Resistor, Kapasitor & Menguji Komponen dengan Multitester',
        durationSec: 30,
        narration:
          'Sebelum mengukur komponen pasif dengan multitester analog, lakukan Zero Ohm Adjustment terlebih dahulu. Pada resistor gelang warna coklat, hitam, merah, perak nilainya adalah 10 kali 100 sama dengan seribu ohm dengan toleransi sepuluh persen, sehingga rentang normalnya sembilan ratus hingga seribu seratus ohm. Untuk kapasitor keramik berkode 103, angka ketiga adalah jumlah nol dalam pikofarad sehingga bernilai sepuluh ribu pikofarad atau 0,01 mikrofarad. Jika jarum ohmmeter bergerak lalu kembali ke semula berarti kapasitor baik; jika tidak kembali berarti bocor.',
        highlightedKeywords: ['Zero Ohm Adj', '1000 Ohm', 'toleransi 10%', '103', '10.000 pF', '0,01 uF', 'kembali ke semula', 'bocor', 'short'],
        visualType: 'electronics-bench',
        stageCaption: 'Meja Ukur Elektronika: Gelang Resistor, Kode Kapasitor 103 & Respon Jarum Ohmmeter',
        examTakeaway: 'Gunakan kalkulator interaktif di bawah layar teater ini untuk berlatih variasi gelang warna dan kode kapasitor.',
      },
    ],
  },
  {
    id: 'cluster-7',
    number: '07',
    shortTitle: 'EULA, Crack & Siber',
    title: 'Lisensi EULA, Software Cracking & Keamanan Siber',
    subtitle: 'Hakikat hukum EULA, 4 klausul kritis, anatomi Patch/Keygen/Loader/No-Disc, serta 4 pilar bahaya software bajakan.',
    ttsWeight: 'Bobot Sangat Tinggi — Materi Tambahan Wajib TTS',
    summaryPoints: [
      'EULA (End User License Agreement): kontrak hukum yang mengikat; membeli software komersial berarti membeli HAK IZIN PAKAI (lisensi), bukan kepemilikan kode sumber.',
      'Indikasi persetujuan yuridis EULA: klik "I Accept / I Agree", merusak/membuka segel kemasan CD, menginstal aplikasi, memakai fitur, atau meminta kode aktivasi.',
      '4 Klausul Kritis EULA (Edward Desautels): Pemantauan aktivitas internet, Telemetri data pribadi, Pemanfaatan CPU/RAM/bandwidth, dan Pembukaan port firewall (rawan Backdoor & Trojan).',
      'Alat Crack: Patch (modifikasi byte .exe/.dll, ubah JNZ→JZ/NOP), Keygen (replikasi algoritma serial), Loader (injeksi di RAM tanpa ubah file fisik), No-Disc/Dongle Emulator.',
      '4 Pilar Bahaya Bajakan: (1) Infeksi Malware/Trojan/Spyware-Keylogger/Ransomware, (2) Tanpa security update & crash, (3) Sanksi pidana & perdata UU Hak Cipta, (4) Pelanggaran etika & merusak inovasi.',
    ],
    trapWarning:
      'Jebakan TTS: Pengguna sering mematikan Antivirus saat menjalankan file crack/keygen—inilah celah fatal masuknya Trojan Backdoor, Keylogger, dan Ransomware!',
    segments: [
      {
        id: 'c7-s1',
        title: 'Hakikat Kontrak Hukum EULA & 4 Klausul Kritis yang Wajib Diwaspadai',
        durationSec: 29,
        narration:
          'End User License Agreement atau EULA adalah kontrak hukum resmi antara pengguna akhir dan penerbit software. Saat membeli software legal, konsumen bukan membeli kepemilikan program melainkan hanya membeli hak izin pakai atau lisensi. Mengklik tombol I Accept atau membuka segel kemasan secara yuridis langsung mengikat pengguna. Waspadai empat klausul kritis EULA menurut Edward Desautels: pemantauan aktivitas internet, pengambilan data telemetri pribadi, pemanfaatan sumber daya CPU, RAM, dan bandwidth, serta pembukaan port firewall yang bisa disusupi Backdoor dan Trojan.',
        highlightedKeywords: ['EULA', 'hak izin pakai', 'lisensi', 'I Accept', 'telemetri', 'bandwidth', 'port firewall', 'Backdoor', 'Trojan'],
        visualType: 'eula-legal-shield',
        stageCaption: 'Bedah Hukum EULA: Ikatan Kontrak Lisensi & 4 Klausul Kritis Keamanan Privasi',
        examTakeaway: 'Jangan lupa sebutkan perbedaan "kepemilikan program" vs "hak izin pakai (lisensi)" di pembuka jawaban Essay EULA.',
      },
      {
        id: 'c7-s2',
        title: 'Anatomi Alat Software Cracking & 4 Pilar Bahaya Aplikasi Bajakan',
        durationSec: 32,
        narration:
          'Software cracking adalah tindakan ilegal melumpuhkan proteksi lisensi dengan teknik Reverse Engineering menggunakan disassembler. Empat alat crack utama meliputi Patch yang menimpa byte biner file exe atau dll seperti mengubah instruksi JNZ menjadi JZ atau NOP, Keygen yang mereplikasi algoritma serial number vendor, Loader yang menyuntikkan modifikasi di memori RAM tanpa mengubah file fisik di disk, serta No-Disc atau Dongle Emulator. Memakai software bajakan membawa empat pilar bahaya: infeksi Malware, Spyware Keylogger, dan Ransomware; hilangnya security update dan crash; sanksi pidana serta perdata Undang-Undang Hak Cipta; dan pelanggaran etika yang mematikan ekosistem inovasi.',
        highlightedKeywords: ['Reverse Engineering', 'Patch', 'JNZ', 'Keygen', 'Loader', 'RAM', 'Ransomware', 'Keylogger', 'UU Hak Cipta', 'etika'],
        visualType: 'crack-threat-vector',
        stageCaption: 'Anatomi Teknik Cracking (Patch · Keygen · Loader) & 4 Pilar Risiko Software Bajakan',
        examTakeaway: 'Bedakan tegas: Patch ubah file fisik (.exe/.dll) di disk, sedangkan Loader manipulasi eksekusi di memori RAM.',
      },
    ],
  },
];

export const CPU_TIMELINE: CpuMilestone[] = [
  { year: 1985, vendor: 'Intel', model: 'i386', note: 'Arsitektur 32-bit x86 pertama Intel' },
  { year: 1989, vendor: 'Intel', model: 'i486', note: 'Cache L1 & FPU terintegrasi' },
  { year: 1991, vendor: 'AMD', model: 'Am386', note: 'Kompetitor 32-bit berkecepatan tinggi' },
  { year: 1992, vendor: 'Intel', model: 'Pentium 1', note: 'Arsitektur superskalar P5 legendaris' },
  { year: 1993, vendor: 'AMD', model: 'Am486 DX', note: 'Efisiensi clock tinggi seri 486' },
  { year: 1994, vendor: 'Intel', model: 'Pentium Pro', note: 'Arsitektur P6 untuk workstation/server' },
  { year: 1996, vendor: 'AMD', model: '5x86 & K5', note: 'Prosesor x86 desain mandiri pertama AMD' },
  { year: 1997, vendor: 'Intel', model: 'Pentium II', note: 'Modul kartrid Slot 1 dengan MMX' },
  { year: 1997, vendor: 'AMD', model: 'K6', note: 'Pesaing kuat Pentium II di Socket 7' },
  { year: 1998, vendor: 'AMD', model: 'K6-2', note: 'Memperkenalkan instruksi multimedia 3DNow!' },
  { year: 1999, vendor: 'Intel', model: 'Pentium III', note: 'Instruksi SSE & kecepatan hingga >1 GHz' },
  { year: 1999, vendor: 'AMD', model: 'K6-III', note: 'Cache L2 on-die terintegrasi' },
  { year: 2000, vendor: 'Intel', model: 'Pentium 4', note: 'Arsitektur NetBurst (LGA 775 / Socket 478)' },
  { year: 2000, vendor: 'AMD', model: 'Athlon', note: 'Arsitektur K7 pelopor era 1 GHz' },
  { year: 2001, vendor: 'AMD', model: 'Duron', note: 'Varian ekonomis berbasis arsitektur Athlon' },
  { year: 2004, vendor: 'AMD', model: 'Sempron', note: 'Penerus lini entry-level pengganti Duron' },
  { year: 2006, vendor: 'Intel', model: 'Core Duo / Dual Core', note: 'Peralihan efisiensi multi-core modern' },
  { year: 2006, vendor: 'AMD', model: 'Turion 64', note: 'Prosesor mobile 64-bit hemat daya' },
  { year: 2007, vendor: 'Intel', model: 'Core 2 Duo', note: 'Arsitektur Core 64-bit dominan di desktop' },
  { year: 2008, vendor: 'AMD', model: 'Athlon 64 X2 & Opteron', note: 'Dual-core 64-bit desktop & lini server' },
  { year: 2010, vendor: 'Intel', model: 'Core i3 / i5 & Atom', note: 'Keluarga Nehalem/Westmere & netbook Atom' },
  { year: 2010, vendor: 'AMD', model: 'Phenom', note: 'Prosesor multi-core (Triple/Quad Core)' },
  { year: 2011, vendor: 'Intel', model: 'Core i7', note: 'Performa flagship multi-thread & Turbo Boost' },
  { year: 2011, vendor: 'AMD', model: 'Fusion APU & AMD FX', note: 'Integrasi CPU+GPU APU & lini unlocked FX' },
];

export const RAM_GENERATIONS: RamGenerationSpec[] = [
  {
    id: 'edo',
    name: 'EDO RAM (SIMM)',
    pins: 72,
    notches: '1 notch tengah',
    notchOffsetPercent: 50,
    speeds: 'Era 1990-an (SIMM 30/72 pin)',
    maxCapacity: 'Dipasang berpasangan (min 2/4 keping)',
    moduleType: 'SIMM',
    note: 'Hanya 1 sisi kaki RAM yang aktif. SIMM 30-pin butuh 4 keping, SIMM 72-pin butuh minimal 2 keping.',
  },
  {
    id: 'rdram',
    name: 'RDRAM (Rambus)',
    pins: 232,
    notches: '2 notch tengah + Heatsink',
    notchOffsetPercent: 46,
    secondNotchPercent: 54,
    speeds: 'Era 1999–2000 (Pentium 4 awal)',
    maxCapacity: 'Wajib berpasangan (+ C-RIMM)',
    moduleType: 'RIMM',
    note: 'Dilengkapi heatspreader logam pendingin; mahal dan wajib dipasang berpasangan.',
  },
  {
    id: 'sdram',
    name: 'SDRAM (DIMM)',
    pins: 168,
    notches: '2 notch',
    notchOffsetPercent: 34,
    secondNotchPercent: 64,
    speeds: '100 MHz (PC100), 133 MHz (PC133)',
    maxCapacity: 'Maks 512 MB',
    moduleType: 'DIMM',
    note: 'Ciri paling mudah dikenali di soal ujian: 168 pin dengan DUA celah notch dan cukup 1 keping untuk beroperasi.',
  },
  {
    id: 'ddr1',
    name: 'DDR1 (DDR SDRAM)',
    pins: 184,
    notches: '1 notch',
    notchOffsetPercent: 54,
    speeds: '266 MHz (PC2100), 333 MHz (PC2700), 400 MHz (PC3200)',
    maxCapacity: 'Maks 1 GB',
    moduleType: 'DIMM',
    note: 'Memiliki 184 pin dan 1 notch; transfer data ganda (Double Data Rate) di setiap siklus clock.',
  },
  {
    id: 'ddr2',
    name: 'DDR2',
    pins: 240,
    notches: '1 notch (agak ke kiri)',
    notchOffsetPercent: 48,
    speeds: '533 MHz (PC4200), 667 MHz (PC5300), 800 MHz (PC6400)',
    maxCapacity: 'Maks 2 GB',
    moduleType: 'DIMM',
    note: '240 pin dengan lubang notch bergeser sedikit ke kiri dibanding DDR1.',
  },
  {
    id: 'ddr3',
    name: 'DDR3',
    pins: 240,
    notches: '1 notch (lebih ke kiri lagi)',
    notchOffsetPercent: 40,
    speeds: '1333 MHz (PC10666) ke atas',
    maxCapacity: 'Maks 4 GB (per keping modul modul AKI)',
    moduleType: 'DIMM',
    note: 'Sama-sama 240 pin seperti DDR2, tetapi celah notch lebih jauh ke kiri agar tidak bisa tertukar secara fisik.',
  },
];

export const ATX_24_PINS: AtxPinSpec[] = [
  { pin: 1, signal: '+3.3V', voltage: '+3.3V DC', colorName: 'Oranye', colorHex: '#F97316', role: 'Suplai logika chipset & RAM' },
  { pin: 2, signal: '+3.3V', voltage: '+3.3V DC', colorName: 'Oranye', colorHex: '#F97316', role: 'Suplai logika chipset & RAM' },
  { pin: 3, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground / referensi 0V', isGround: true },
  { pin: 4, signal: '+5V', voltage: '+5V DC', colorName: 'Merah', colorHex: '#EF4444', role: 'Suplai sirkuit logika & USB' },
  { pin: 5, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground / referensi 0V', isGround: true },
  { pin: 6, signal: '+5V', voltage: '+5V DC', colorName: 'Merah', colorHex: '#EF4444', role: 'Suplai sirkuit logika & I/O' },
  { pin: 7, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground / referensi 0V', isGround: true },
  { pin: 8, signal: 'PWR_OK', voltage: '+5V Signal', colorName: 'Abu-abu', colorHex: '#9CA3AF', role: 'Sinyal Power Good bahwa tegangan DC stabil' },
  { pin: 9, signal: '+5VSB', voltage: '+5V Stand-by', colorName: 'Ungu', colorHex: '#A855F7', role: 'Stand-by Power Supply (langsung aktif saat colok PLN, 2A)', isStandby: true },
  { pin: 10, signal: '+12V1', voltage: '+12V DC', colorName: 'Kuning', colorHex: '#EAB308', role: 'Suplai motor kipas, HDD & VRM CPU/VGA' },
  { pin: 11, signal: '+12V1', voltage: '+12V DC', colorName: 'Kuning', colorHex: '#EAB308', role: 'Suplai +12V tambahan (ekstensi +4 pin)' },
  { pin: 12, signal: '+3.3V', voltage: '+3.3V DC', colorName: 'Oranye', colorHex: '#F97316', role: 'Suplai +3.3V tambahan (ekstensi +4 pin)' },
  { pin: 13, signal: '+3.3V Sense', voltage: '+3.3V DC', colorName: 'Oranye / Coklat', colorHex: '#D97706', role: 'Sensor stabilitas jalur +3.3V' },
  { pin: 14, signal: '-12V', voltage: '-12V DC', colorName: 'Biru', colorHex: '#3B82F6', role: 'Tegangan negatif port Serial / audio lama' },
  { pin: 15, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground — cocok untuk jumper uji PSU bersama Pin 16!', isGround: true },
  { pin: 16, signal: 'PS_ON#', voltage: 'Trigger ON', colorName: 'Hijau', colorHex: '#10B981', role: 'Power On — jumper ke Hitam (Ground) untuk menyalakan PSU!', isPsOn: true },
  { pin: 17, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground — cocok untuk jumper uji PSU bersama Pin 16!', isGround: true },
  { pin: 18, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground / referensi 0V', isGround: true },
  { pin: 19, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground / referensi 0V', isGround: true },
  { pin: 20, signal: 'N/C', voltage: 'Kosong', colorName: 'Tidak terhubung', colorHex: '#4B5563', role: 'No Connection (dulunya -5V pada ATX lawas)' },
  { pin: 21, signal: '+5V', voltage: '+5V DC', colorName: 'Merah', colorHex: '#EF4444', role: 'Suplai utama +5V DC' },
  { pin: 22, signal: '+5V', voltage: '+5V DC', colorName: 'Merah', colorHex: '#EF4444', role: 'Suplai utama +5V DC' },
  { pin: 23, signal: '+5V', voltage: '+5V DC', colorName: 'Merah', colorHex: '#EF4444', role: 'Suplai +5V tambahan (ekstensi +4 pin)' },
  { pin: 24, signal: 'COM / GND', voltage: '0V', colorName: 'Hitam', colorHex: '#1F2937', role: 'Ground tambahan (ekstensi +4 pin)', isGround: true },
];

export const MBR_VS_GPT_COMPARISON = [
  {
    parameter: 'Kapasitas Disk Maksimal',
    mbr: 'Maksimal 2 TB per drive fisik',
    gpt: 'Lebih dari 2 TB hingga 18 Exabyte',
    mbrScore: 20,
    gptScore: 100,
  },
  {
    parameter: 'Jumlah Partisi Primer',
    mbr: 'Maksimal 4 Partisi Primer (atau 3 Primer + 1 Extended)',
    gpt: 'Hingga 128 Partisi Primer secara mandiri',
    mbrScore: 25,
    gptScore: 100,
  },
  {
    parameter: 'Sistem Firmware',
    mbr: 'Standar lawas berbasis Legacy BIOS',
    gpt: 'Standar modern berbasis UEFI (Unified EFI)',
    mbrScore: 20,
    gptScore: 100,
  },
  {
    parameter: 'Redundansi & Keamanan Tabel',
    mbr: 'Hanya 1 sektor awal (rawan rusak total)',
    gpt: 'Salinan cadangan tabel partisi di akhir disk (CRC32)',
    mbrScore: 30,
    gptScore: 95,
  },
  {
    parameter: 'Struktur Partisi Tambahan',
    mbr: 'Wajib Extended & Logical Partition untuk menambah drive',
    gpt: 'Semua partisi berstatus Primer mandiri tanpa Extended',
    mbrScore: 35,
    gptScore: 100,
  },
  {
    parameter: 'Kompatibilitas OS',
    mbr: 'OS lawas (Windows XP, Windows 7 32-bit)',
    gpt: 'Standar wajib OS modern (Windows 11, Windows Server)',
    mbrScore: 45,
    gptScore: 100,
  },
];

export const TROUBLESHOOTING_CASES: TroubleshootingCase[] = [
  {
    id: 'ts-matot',
    number: 1,
    title: 'Mati Total (MaTot)',
    shortLabel: 'MaTot',
    symptoms: [
      'Tombol Power ditekan, PC sama sekali tidak bereaksi.',
      'Indikator LED pada panel casing tidak menyala.',
      'Kipas Prosesor & Kipas PSU tidak berputar.',
      'Layar monitor tidak menampilkan apa pun.',
    ],
    causes: [
      'Sumber listrik PLN / kabel power tidak mengalir.',
      'Power Supply Unit (PSU) kekurangan tegangan atau rusak.',
      'Memori RAM rusak atau tidak sesuai.',
      'Prosesor terbakar akibat overheat atau salah pemasangan.',
      'Motherboard short/rusak pada kapasitor elko, chipset, atau BIOS.',
    ],
    steps: [
      { area: 'Sumber Listrik', actions: ['Cek stopkontak dengan Testpen/AVO atau uji beban lain (lampu/radio).'] },
      {
        area: 'Power Supply',
        actions: [
          'Cek kabel power PSU dengan AVO/Testpen.',
          'Jumper kabel Hijau (Pin 16) dengan Hitam (Ground) pada ATX 24-pin; bila kipas berputar, PSU normal.',
          'Ukur keluaran tegangan tiap konektor dengan AVO/PSU Tester; ganti PSU jika mati.',
        ],
      },
      {
        area: 'Memori & Prosesor',
        actions: [
          'Lepas RAM, bersihkan pin emas dengan penghapus karet, pindah slot, dan reset baterai CMOS.',
          'Bongkar heatsink, cek pin prosesor apakah ada yang bengkok/putus, pasang ulang hati-hati.',
        ],
      },
      {
        area: 'Motherboard',
        actions: [
          'Inspeksi fisik kapasitor ELCO dekat soket daya: apakah ada yang menggelembung/bocor.',
          'Sentuh IC Southbridge & Northbridge: jika panas berlebih menandakan motherboard short/rusak.',
        ],
      },
    ],
    essayKeyTip: 'Wajib tulis: cek listrik PLN → uji jumper Hijau-Hitam PSU → cek kapasitor elko menggelembung & suhu IC NB/SB.',
  },
  {
    id: 'ts-blank',
    number: 2,
    title: 'Blank (Hidup Tapi Layar Gelap)',
    shortLabel: 'Blank',
    symptoms: [
      'Tombol Power ditekan, PC hidup dan indikator LED panel casing menyala.',
      'Kipas Prosesor dan kipas PSU berputar normal.',
      'Layar Monitor tetap gelap / tidak ada tampilan (Blank).',
    ],
    causes: [
      'Memori RAM kotor pin kontaknya, longgar, rusak, atau tidak cocok.',
      'PSU kekurangan tegangan pada salah satu rail.',
      'Monitor tidak mendapat daya, kabel pin bengkok, atau rusak.',
      'VGA (onboard atau eksternal PCIe/AGP) bermasalah.',
      'Konfigurasi BIOS error (perlu Reset CMOS) atau pemasangan prosesor kurang pas.',
    ],
    steps: [
      {
        area: 'Memori RAM (Prioritas #1)',
        actions: [
          'Lepas keping RAM, bersihkan pin tembaga emas dengan penghapus karet pensil, lalu tancapkan kembali.',
          'Pindahkan RAM ke slot memori lain atau uji dengan RAM bertipe sama.',
        ],
      },
      {
        area: 'Monitor & VGA',
        actions: [
          'Pastikan LED monitor menyala, cek pesan NO SIGNAL DETECTED, dan periksa pin kabel VGA/HDMI.',
          'Jika pakai VGA eksternal, lepas dan uji VGA onboard (lakukan Reset CMOS terlebih dahulu saat berpindah VGA).',
        ],
      },
      {
        area: 'Motherboard & Diagnosa Beep',
        actions: [
          'Lepas baterai CMOS beberapa menit untuk reset BIOS, lalu pasang kembali.',
          'Hidupkan PC TANPA RAM: jika terdengar bunyi beep (via speaker onboard/C-Panel) berarti motherboard masih normal.',
          'Periksa pemasangan prosesor dan pastikan tidak ada pin bengkok.',
        ],
      },
    ],
    essayKeyTip: 'Kunci emas kasus Blank: bersihkan pin RAM pakai penghapus karet, Reset CMOS, lepas VGA eksternal, dan uji beep tanpa RAM.',
  },
  {
    id: 'ts-hang',
    number: 3,
    title: 'Hang (Hidup Tapi Sering Macet)',
    shortLabel: 'Hang',
    symptoms: [
      'Sistem operasi tiba-tiba macet total saat digunakan.',
      'Kursor mouse tidak bisa digerakkan.',
      'Tombol NumLock pada keyboard ditekan tidak bisa menyala/mati (beku).',
      'Saat di-restart berjalan normal sebentar lalu kembali Hang.',
    ],
    causes: [
      'Sistem operasi terinfeksi virus atau registry/sistem rusak.',
      'Memori RAM bermasalah atau slot berdebu.',
      'Harddisk mengalami Bad Sector atau partisi bermasalah.',
      'Prosesor overheat karena debu heatsink / thermal paste kering.',
      'Tegangan PSU tidak stabil, casing kotor, VGA eksternal error, atau masalah kabel LAN.',
    ],
    steps: [
      {
        area: 'Sistem Operasi & Software',
        actions: [
          'Masuk Safe Mode: bila di Safe Mode tidak Hang, besar kemungkinan sistem operasi bermasalah.',
          'Bersihkan registry, lakukan scanning virus via Mini XP di HBCD, atau install ulang OS sebagai langkah akhir.',
        ],
      },
      {
        area: 'Memori, HDD & Suhu Prosesor',
        actions: [
          'Bersihkan pin RAM dengan penghapus karet dan uji dengan Memtest di HBCD.',
          'Dengarkan suara putaran HDD (kasar/tersendat) dan repair Bad Sector lewat HBCD.',
          'Bersihkan debu heatsink, pastikan kipas CPU kencang, dan oleskan thermal paste baru.',
        ],
      },
      {
        area: 'PSU, VGA & LAN',
        actions: [
          'Ukur kestabilan tegangan PSU, uji tanpa VGA eksternal, dan cabut sementara kabel LAN / reset Hub.',
        ],
      },
    ],
    essayKeyTip: 'Ciri pembeda Hang di modul STMIK AKI: Mouse diam + lampu tombol NumLock keyboard tidak merespons saat ditekan.',
  },
  {
    id: 'ts-restart',
    number: 4,
    title: 'Restart Berulang (Mati-Hidup Sendiri)',
    shortLabel: 'Restart',
    symptoms: [
      'PC melakukan reboot/booting berulang-ulang setelah dipakai sebentar maupun agak lama.',
    ],
    causes: [
      'Tegangan output PSU tidak stabil (drop saat beban naik).',
      'Prosesor mengalami Overheat karena heatsink/kipas tidak maksimal.',
      'Memori RAM tidak stabil, OS rusak/virus, atau HDD Bad Sector.',
      'Baterai CMOS habis (tegangan di bawah 2 Volt).',
    ],
    steps: [
      { area: 'PSU & Baterai CMOS', actions: ['Ukur tegangan semua konektor PSU dengan AVO/PSU tester.', 'Ukur voltase baterai CMOS dengan AVO; jika < 2 Volt segera ganti baru.'] },
      { area: 'Pendinginan Prosesor', actions: ['Bongkar heatsink, bersihkan debu dengan kuas, cek putaran kipas, dan ganti thermal paste.'] },
      { area: 'RAM, HDD & OS', actions: ['Uji RAM dengan Memtest, repair Bad Sector HDD via HBCD, dan tes kestabilan lewat Safe Mode.'] },
    ],
    essayKeyTip: 'Beda penting di kasus Restart: selalu sebutkan pengecekan voltase baterai CMOS (< 2V wajib ganti) dan overheat prosesor.',
  },
  {
    id: 'ts-lambat',
    number: 5,
    title: 'Lambat / Lemot',
    shortLabel: 'Lambat',
    symptoms: ['Komputer merespons sangat lambat saat membuka aplikasi hingga terasa hampir seperti Hang.'],
    causes: [
      'Sistem operasi kotor, terlalu banyak aplikasi terinstal, atau spesifikasi OS terlalu berat.',
      'Infeksi virus yang membebani CPU/RAM.',
      'Harddisk tua/terfragmentasi/Bad Sector atau ruang kosong Drive C terlalu sempit (<20%).',
      'Kapasitas RAM terlalu kecil, prosesor overheat, atau PSU kurang stabil.',
    ],
    steps: [
      { area: 'Optimasi OS & Storage', actions: ['Bersihkan Registry & file sampah, scan virus, lalu lakukan Defragmentasi pada Drive C.'] },
      { area: 'Upgrade & Cek Hardware', actions: ['Tambah kapasitas RAM bertipe sama, cek Bad Sector HDD via HBCD, bersihkan heatsink & ganti thermal paste.'] },
    ],
    essayKeyTip: 'Ingat pula konsep Modul Partisi: sisakan buffer ruang kosong 20%–30% di Drive C agar virtual memory (pagefile.sys) lancar.',
  },
  {
    id: 'ts-virus',
    number: 6,
    title: 'Terinfeksi Virus / Malware',
    shortLabel: 'Virus',
    symptoms: [
      'PC melambat konsisten, sering crash/restart, atau muncul banyak shortcut aneh di tiap folder.',
      'Regedit, Task Manager, dan Folder Option terkunci tidak bisa diakses.',
      'Harddisk/drive sulit dibuka dan aplikasi berjalan tidak semestinya.',
    ],
    causes: [
      'Media penyimpanan eksternal USB (Flashdisk, HDD eksternal, Memory Stick) dengan Autorun aktif.',
      'CD/DVD, jaringan lokal LAN, internet/Wi-Fi, atau transfer Bluetooth.',
    ],
    steps: [
      {
        area: 'Pembersihan & Fresh Install',
        actions: [
          'Scan virus lewat Safe Mode, HBCD, atau lepas HDD dan paralelkan ke PC bersih ber-antivirus terupdate.',
          'Jika parah: backup data via Mini XP HBCD, lakukan Fresh Install (bukan Repair), langsung matikan Autorun/Autoplay, lalu install & update Antivirus SEBELUM memasang driver/aplikasi.',
        ],
      },
      {
        area: 'Pencegahan',
        actions: [
          'Matikan Autorun & Restore Point, scan flashdisk sebelum dibuka, kompres file master (.exe) dengan WinRAR, dan hindari membuka file asing.',
        ],
      },
    ],
    essayKeyTip: 'File target utama virus di modul: .EXE/.DLL (aplikasi), .DOC/.XLS/.PPT (Office), .HTM/.HTML (web), .JPG/.GIF/.PNG (gambar).',
  },
];

export const SEMICONDUCTOR_REFERENCE = [
  {
    name: 'Dioda Biasa (Penyearah)',
    spec: 'Silikon: 0,6 VDC · Germanium: 0,2 VDC (Contoh: 1N4148, 1N4002)',
    principle: 'Forward-biased (Anoda +, Katoda -) menghantarkan arus; Reverse-biased memblokir arus. Fungsi: penyearah arus & pengaman terbaliknya polaritas.',
    multitester: 'Ohmmeter X10/X100: Probe Merah→Katoda & Hitam→Anoda jarum bergerak (bukan nol); dibalik jarum diam = BAIK. Bergerak kedua arah / nol = SHORT.',
  },
  {
    name: 'Dioda Zener',
    spec: 'Bahan Silikon · Tegangan kerja 0,7–12V · Arus kecil 1–50 mA',
    principle: 'Penstabil tegangan/arus pada rangkaian Power Supply agar fluktuasi AC→DC tetap konstan.',
    multitester: 'Cara ukur baik/rusak dengan Ohmmeter sama persis seperti dioda biasa.',
  },
  {
    name: 'Transistor (PNP & NPN)',
    spec: '3 Kaki: Emitor (E), Basis (B), Collector (C) · Tegangan kerja 0,6V',
    principle: 'PNP = anoda-katoda-anoda (katoda disatukan); NPN = katoda-anoda-katoda (anoda disatukan). Simbol rangkaian: Q.',
    multitester: 'Cari kaki Basis (X10/X100): satu probe di kaki A menyentuh B & C bergantian bergerak semua, dibalik diam semua = kaki A adalah BASIS.',
  },
  {
    name: 'MOSFET (FET)',
    spec: 'Urutan kaki kiri→kanan: GATE (input), DRAIN (output), SOURCE (sumber)',
    principle: 'Menaikkan tegangan (contoh: IRF630, K793) atau menurunkan tegangan (contoh: IRF9610, IRF9630) pada PSU Switching.',
    multitester: 'Ohmmeter X10/X1K: uji pasangan Source-Drain & Gate; bila jarum menunjuk nol di pengujian terlarang = RUSAK/SHORT.',
  },
  {
    name: 'Integrated Circuit (IC)',
    spec: 'Pin 1 ditandai lingkaran/titik kecil (Contoh: LM7812, UC3842, TDA9302)',
    principle: 'Gabungan berbagai komponen elektronika terpadu dalam satu kemasan chip.',
    multitester: 'TIDAK BISA diukur baik/rusaknya menggunakan multitester biasa—wajib diuji langsung di rangkaian!',
  },
  {
    name: 'Transformator (Trafo)',
    spec: 'Gulungan Primer & Sekunder pada inti besi · Step-Down vs Step-Up',
    principle: 'HANYA bekerja pada tegangan arus bolak-balik (AC). Trafo adaptor umumnya Step-Down (menurunkan tegangan).',
    multitester: 'Ohmmeter X1K: antar kaki primer bergerak bukan nol, antar kaki sekunder bergerak bukan nol, primer-sekunder & kaki-inti besi TIDAK bergerak = BAIK.',
  },
];

export const EULA_CLAUSES: EulaClause[] = [
  {
    id: 'eula-1',
    number: 1,
    title: 'Pemantauan Aktivitas Internet',
    mechanism: 'Vendor menyertakan klausul izin legal untuk memonitor lalu lintas koneksi internet dan situs yang diakses perangkat pengguna.',
    risk: 'Kebocoran privasi penjelajahan web dan pemetaan profil pengguna secara diam-diam.',
    mitigation: 'Baca ringkasan EULA sebelum klik I Accept dan periksa reputasi resmi software publisher.',
  },
  {
    id: 'eula-2',
    number: 2,
    title: 'Pengambilan Data Pribadi (Telemetri)',
    mechanism: 'Aplikasi diizinkan mengumpulkan identitas akun, spesifikasi perangkat keras (HWID), serta log perilaku penggunaan secara berkala.',
    risk: 'Data pribadi dapat dibagikan kepada pihak ketiga atau pengiklan tanpa kontrol penuh pengguna.',
    mitigation: 'Nonaktifkan opsi telemetri opsional saat instalasi (Custom Install) dan gunakan software terpercaya.',
  },
  {
    id: 'eula-3',
    number: 3,
    title: 'Pemanfaatan Sumber Daya Komputer',
    mechanism: 'Klausul mengizinkan software memakai siklus CPU, kapasitas memori RAM, atau kuota bandwidth internet pengguna di latar belakang.',
    risk: 'Performa komputer melambat, panas meningkat, dan kuota internet tersedot tanpa disadari.',
    mitigation: 'Hindari freeware mencurigakan dari jaringan P2P/BitTorrent dan pantau Task Manager.',
  },
  {
    id: 'eula-4',
    number: 4,
    title: 'Pembukaan Port Firewall Tertentu',
    mechanism: 'Software meminta konfigurasi pengecualian untuk membuka nomor port jaringan pada Windows Firewall.',
    risk: 'Bila peretas mengetahui port yang terbuka, komputer korban rentan disusupi program pintu belakang (Backdoor) dan Trojan pencuri data.',
    mitigation: 'Waspadai jendela pop-up konfirmasi Firewall; tolak akses jaringan publik untuk aplikasi offline.',
  },
];

export const CRACK_TOOLS: CrackToolSpec[] = [
  {
    id: 'crack-patch',
    name: 'Patch',
    mechanism: 'Program kecil yang secara langsung menimpa/memodifikasi byte kode mesin (biner) pada file executable (.exe) atau library (.dll) target.',
    characteristic: 'Mengubah instruksi lompatan bersyarat (jump conditional, misalnya JNZ menjadi JZ atau NOP) agar pemeriksaan registrasi selalu bernilai valid.',
    securityDanger: 'Memodifikasi biner secara ilegal merusak tanda tangan digital file dan sering disisipi payload Trojan.',
  },
  {
    id: 'crack-keygen',
    name: 'Keygen (Key Generator)',
    mechanism: 'Aplikasi buatan cracker hasil Reverse Engineering yang mereplikasi algoritma enkripsi vendor untuk membangkitkan Serial Number / Product Key valid.',
    characteristic: 'Menghasilkan nomor serial tanpa membayar lisensi resmi, umumnya disertai musik chiptune khas komunitas warez.',
    securityDanger: 'File executable keygen dari situs pihak ketiga sangat sering menyembunyikan Spyware Keylogger & pencuri sesi browser.',
  },
  {
    id: 'crack-loader',
    name: 'Loader',
    mechanism: 'Program injektor yang berjalan sesaat sebelum aplikasi utama; TIDAK mengubah file fisik di disk, melainkan memodifikasi alur eksekusi di memori RAM.',
    characteristic: 'Sering dipakai pada trainer game atau untuk membypass proteksi anti-tamper saat program mulai start.',
    securityDanger: 'Menuntut hak akses Administrator dan mematikan antivirus sehingga membuka akses penuh bagi Backdoor.',
  },
  {
    id: 'crack-nodisc',
    name: 'No-Disc Crack / Dongle Emulator',
    mechanism: 'Memodifikasi program agar tidak lagi memeriksa keberadaan CD/DVD fisik asli di drive, atau meniru sinyal hardware token proteksi (USB Dongle).',
    characteristic: 'Memungkinkan software berproteksi fisik berjalan tanpa cakram optik atau dongle asli.',
    securityDanger: 'Emulator driver tingkat kernel berpotensi memicu BSOD, ketidakstabilan OS, dan celah rootkit.',
  },
];

export const PIRACY_PILLARS: PiracyPillar[] = [
  {
    id: 'pillar-1',
    number: 1,
    title: 'Kerentanan Keamanan & Infeksi Malware',
    summary: 'File crack dari situs pihak ketiga hampir selalu disisipi muatan berbahaya (terlebih saat antivirus dimatikan paksa).',
    details: [
      'Malware / Trojan: Membuka pintu belakang (Backdoor) untuk kendali jarak jauh peretas.',
      'Spyware (Keylogger): Merekam ketikan keyboard untuk mencuri password perbankan, email, dan data rahasia.',
      'Ransomware: Mengenkripsi seluruh file penting di harddisk dan memeras korban dengan tebusan uang.',
    ],
  },
  {
    id: 'pillar-2',
    number: 2,
    title: 'Ketidakstabilan Sistem & Ketiadaan Update',
    summary: 'Software bajakan terputus dari server resmi sehingga tidak memperoleh security updates maupun bug fixes.',
    details: [
      'Modifikasi byte biner yang serampangan sering menyebabkan aplikasi crash mendadak dan data kerja korup.',
      'Celah keamanan baru tidak pernah ditambal karena pembaruan otomatis diblokir agar lisensi palsu tidak terdeteksi.',
    ],
  },
  {
    id: 'pillar-3',
    number: 3,
    title: 'Konsekuensi Hukum Pidana & Perdata',
    summary: 'Menggunakan atau mendistribusikan software bajakan melanggar Hak Kekayaan Intelektual (UU Hak Cipta).',
    details: [
      'Pelaku dan institusi dapat dikenakan gugatan perdata denda ganti rugi bernilai besar.',
      'Pelanggaran hak cipta komersial juga memiliki ancaman sanksi hukum pidana penjara.',
    ],
  },
  {
    id: 'pillar-4',
    number: 4,
    title: 'Pelanggaran Etika & Kerugian Ekosistem',
    summary: 'Membajak software merugikan kerja keras pengembang dan merusak keberlanjutan industri teknologi.',
    details: [
      'Mengurangi pendapatan sah developer untuk riset, perawatan, dan inovasi fitur baru.',
      'Alternatif etis dan legal tersedia melalui lisensi edukasi kampus atau perangkat lunak Open Source (FOSS).',
    ],
  },
];
