import type { AssemblyStep, MainboardComponentSpec } from '../types/rigbench';

/**
 * 24 Exact Mainboard Component Points based on E-Book Praktikum HW-SW STMIK AKI (Hal. 1-2)
 * plus Separate C-Panel / Front Panel Cluster on the Anti-Static Workbench.
 *
 * Board Dimensions in Three.js world units:
 * Width (X): 10.0 (-5.0 to +5.0), Depth (Z): 8.4 (-4.2 to +4.2), Top PCB Surface: Y = 0.16
 */
export const MAINBOARD_COMPONENTS: MainboardComponentSpec[] = [
  {
    id: 'cpu-socket',
    pinNumber: '#01',
    name: 'Soket Prosesor (LGA 775 / Socket T)',
    shortName: 'Soket Prosesor',
    category: 'mainboard',
    busDomain: 'northbridge',
    position: [2.1, 0.45, -1.6],
    cameraOffset: [2.1, 3.3, 1.3],
    functionEssay:
      'Dudukan fisik tempat memasang prosesor (CPU). Jenis soket menentukan arsitektur dan tipe prosesor yang kompatibel (contoh LGA 775 untuk Intel Pentium 4 / Core 2 Duo, AM2/AM3 untuk AMD), dilengkapi bingkai pengunci logam dan tuas penekan.',
    examTrap:
      'Prosesor memiliki penanda sudut segitiga/lekukan yang wajib dicocokkan dengan soket. Memasang miring atau memaksa menekan akan membengkokkan pin dan menyebabkan PC Mati Total.',
    keySpecs: ['Tipe: LGA 775 (775 kontak)', 'Pengunci: Tuas logam ZIF + retention frame', 'Jalur utama: FSB menuju Northbridge'],
  },
  {
    id: 'ram-slots',
    pinNumber: '#02',
    name: 'Slot Memori (DIMM DDR2 / DDR)',
    shortName: 'Slot Memori',
    category: 'mainboard',
    busDomain: 'northbridge',
    position: [1.9, 0.52, 1.85],
    cameraOffset: [1.9, 3.2, 4.6],
    functionEssay:
      'Slot tempat memasang memori utama komputer (RAM). Jenis slot menyesuaikan generasi memori yang didukung motherboard (SDRAM 168 pin, DDR1 184 pin, DDR2/DDR3 240 pin) dan dilengkapi klip pengunci di kedua sisi.',
    examTrap:
      'Posisi notch (celah kunci) DDR1, DDR2, dan DDR3 berbeda meski DDR2 & DDR3 sama-sama 240 pin. Tekan kedua ujung RAM hingga terdengar bunyi klik.',
    keySpecs: ['Konfigurasi: 4 Slot DIMM Dual-Channel', 'Pengunci: Klip putih di kedua ujung', 'Terhubung langsung ke Northbridge (MCH)'],
  },
  {
    id: 'northbridge',
    pinNumber: '#03',
    name: 'Chipset Northbridge (MCH)',
    shortName: 'Northbridge',
    category: 'mainboard',
    busDomain: 'northbridge',
    position: [0.1, 0.62, -0.8],
    cameraOffset: [0.1, 3.1, 2.0],
    functionEssay:
      'Memory Controller Hub (MCH) yang menjembatani lalu lintas data berkecepatan tinggi antara Prosesor (CPU), Main Memory (RAM), dan kartu grafis (AGP / PCIe x16), serta mengatur manajemen daya (power management).',
    examTrap:
      'Sering tertukar dengan Southbridge! Ingat: Northbridge = kecepatan tinggi (CPU, RAM, VGA) dan terletak dekat soket CPU dengan heatsink aluminium besar.',
    keySpecs: ['Peran: High-Speed Data Bridge', 'Komponen terhubung: CPU, RAM, PCIe x16 / AGP', 'Pendingin: Heatsink sirip aluminium diagonal'],
  },
  {
    id: 'southbridge',
    pinNumber: '#04',
    name: 'Chipset Southbridge (ICH)',
    shortName: 'Southbridge',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-1.45, 0.48, 0.95],
    cameraOffset: [-1.45, 3.1, 3.6],
    functionEssay:
      'I/O Controller Hub (ICH) yang mengendalikan periferal berkecepatan lebih rendah seperti kontroler IDE/SATA, slot PCI, ROM BIOS, Keyboard & Mouse, port USB, Ethernet LAN, modem, dan audio.',
    examTrap:
      'Jika IC Southbridge atau Northbridge terasa panas berlebih saat disentuh ketika PC Mati Total/Blank, mengindikasikan motherboard mengalami short/rusak.',
    keySpecs: ['Peran: Peripheral & I/O Controller', 'Komponen terhubung: SATA, IDE, PCI, BIOS, USB, LAN, Audio', 'Terhubung ke Northbridge via DMI Bus'],
  },
  {
    id: 'pcie-x16',
    pinNumber: '#05',
    name: 'Slot PCI Express x16',
    shortName: 'PCIe x16',
    category: 'mainboard',
    busDomain: 'northbridge',
    position: [-1.5, 0.42, -1.65],
    cameraOffset: [-1.5, 2.9, 1.0],
    functionEssay:
      'Slot ekspansi serial berkecepatan tinggi khusus untuk memasang kartu grafis (VGA Card) generasi terbaru dengan bandwidth hingga 8.0 GB/s dan tuas pengunci di ujung slot.',
    examTrap:
      'Jangan tertukar dengan slot AGP yang lebih pendek dan merupakan generasi sebelum PCI Express.',
    keySpecs: ['Fungsi khusus: Kartu Grafis (VGA Modern)', 'Jalur: 16 lane serial langsung ke Northbridge', 'Panjang slot terpanjang dengan kait pengunci'],
  },
  {
    id: 'pcie-x1',
    pinNumber: '#06',
    name: 'Slot PCI Express x1',
    shortName: 'PCIe x1',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-2.4, 0.36, -2.5],
    cameraOffset: [-2.4, 2.6, 0.1],
    functionEssay:
      'Slot ekspansi berukuran pendek untuk memasang periferal tambahan (expansion card) selain kartu grafis VGA, seperti kartu jaringan (NIC), sound card PCIe, atau kartu ekspansi USB/SATA.',
    examTrap:
      'PCIe x1 bukan untuk VGA utama; bentuk fisiknya paling pendek di antara jajaran slot ekspansi.',
    keySpecs: ['Fungsi: Periferal tambahan non-VGA', 'Bandwidth: 500 MB/s per arah via Southbridge', 'Ukuran fisik pendek (1 lane)'],
  },
  {
    id: 'agp-slot',
    pinNumber: '#07',
    name: 'Slot AGP (Accelerated Graphics Port)',
    shortName: 'Slot AGP',
    category: 'mainboard',
    busDomain: 'northbridge',
    position: [-2.7, 0.4, -1.2],
    cameraOffset: [-2.7, 2.8, 1.3],
    functionEssay:
      'Slot khusus untuk memasang kartu grafis (VGA Card) generasi sebelum hadirnya PCI Express. Posisinya sedikit menjorok ke dalam dibanding slot PCI biasa.',
    examTrap:
      'Di soal TTS sering ditanyakan perbandingan AGP vs PCIe x16: keduanya khusus VGA, namun AGP adalah generasi pendahulu sebelum PCI Express.',
    keySpecs: ['Fungsi: VGA Card generasi sebelum PCIe', 'Warna khas: Coklat / Oranye gelap', 'Terhubung ke Northbridge'],
  },
  {
    id: 'pci-slots',
    pinNumber: '#08',
    name: 'Slot PCI (Peripheral Component Interconnect)',
    shortName: 'Slot PCI',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-3.85, 0.38, -1.35],
    cameraOffset: [-3.85, 2.8, 1.2],
    functionEssay:
      'Slot ekspansi umum berwarna putih/krem yang digunakan untuk memasang kartu tambahan seperti LAN Card, Sound Card, Modem internal, atau TV Tuner dengan kecepatan di bawah AGP dan PCI Express.',
    examTrap:
      'Slot PCI dikendalikan oleh Southbridge (bukan Northbridge) dan kecepatannya lebih rendah dari AGP/PCIe.',
    keySpecs: ['Fungsi: Kartu ekspansi umum (LAN/Sound/Modem)', 'Warna standar: Putih gading', 'Kendali bus: Southbridge (133 MB/s)'],
  },
  {
    id: 'bios-rom',
    pinNumber: '#09',
    name: 'Chip IC ROM BIOS',
    shortName: 'ROM BIOS',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-3.75, 0.3, 1.2],
    cameraOffset: [-3.75, 2.4, 3.2],
    functionEssay:
      'Basic Input-Output System berupa program kecil (firmware) di dalam chip IC ROM/Flash bersifat non-volatile yang menyimpan konfigurasi motherboard, menjalankan POST (cek hardware), dan memuat sistem operasi saat booting.',
    examTrap:
      'ROM bersifat non-volatile (tidak hilang saat listrik mati), berbeda dengan RAM yang volatile. BIOS dikendalikan melalui jalur Southbridge.',
    keySpecs: ['Sifat memori: Non-Volatile (ROM/Flash)', 'Tugas utama: POST, baca OS dari disk, tampilkan pesan layar', 'Daya simpan konfigurasi: Baterai CMOS'],
  },
  {
    id: 'cmos-battery',
    pinNumber: '#10',
    name: 'Baterai CMOS (CR2032 3V)',
    shortName: 'Baterai CMOS',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-1.4, 0.32, 2.35],
    cameraOffset: [-1.4, 2.3, 4.4],
    functionEssay:
      'Baterai koin lithium 3V (CR2032) khusus untuk memberikan daya cadangan pada memori CMOS/BIOS agar konfigurasi hardware, urutan boot, serta jam & tanggal sistem tetap tersimpan saat PC dimatikan.',
    examTrap:
      'Pada kasus PC Blank atau Restart, lepas baterai CMOS untuk mereset BIOS. Jika diukur AVO tegangannya di bawah 2 Volt, baterai wajib diganti.',
    keySpecs: ['Tipe: Lithium Coin Cell CR2032', 'Tegangan normal: 3 Volt DC (< 2V = ganti)', 'Fungsi troubleshooting: Reset konfigurasi BIOS'],
  },
  {
    id: 'sata-ports',
    pinNumber: '#11',
    name: 'Port SATA (Serial ATA)',
    shortName: 'Port SATA',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-2.65, 0.36, 2.5],
    cameraOffset: [-2.65, 2.4, 4.6],
    functionEssay:
      'Antarmuka transfer data serial modern berkecepatan tinggi untuk menghubungkan Harddisk (HDD), SSD, dan Optical Drive (DVD-ROM) dengan kabel tipis 7-konduktor yang mendukung hot-swapping dan Native Command Queuing (NCQ).',
    examTrap:
      'Kecepatan SATA 1 = 1,5 GB/s, SATA 2 = 3 GB/s, SATA 3 = 6 GB/s. Kabelnya jauh lebih ramping dibanding kabel pita IDE sehingga sirkulasi udara casing lebih baik.',
    keySpecs: ['Transfer: Serial 7-pin (4 jalur sinyal aktif)', 'Generasi: SATA 1 (1,5) / SATA 2 (3) / SATA 3 (6 GB/s)', 'Fitur: Hot-swapping & NCQ'],
  },
  {
    id: 'ide-port',
    pinNumber: '#12',
    name: 'Port IDE / PATA (ATA133 40-Pin)',
    shortName: 'Port IDE',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-0.85, 0.4, 3.45],
    cameraOffset: [-0.85, 2.5, 5.6],
    functionEssay:
      'Antarmuka media penyimpanan paralel (Parallel ATA) generasi sebelum SATA. Menggunakan kabel pita lebar 40-wire (panjang maks 18 inci / 46 cm) dan membutuhkan pengaturan jumper fisik Master, Slave, atau Cable Select.',
    examTrap:
      'Jangan tertukar jumlah kawat kabel: IDE Harddisk/CDROM = 40-wire, sedangkan Floppy Disk Drive = 34-wire. Garis merah di tepi kabel menandakan Pin 1.',
    keySpecs: ['Kabel pita: 40-wire (maks 18 inci / 46 cm)', 'Pengaturan: Jumper Master / Slave / Cable Select', 'Pin 1: Ditandai garis merah dekat konektor daya'],
  },
  {
    id: 'floppy-port',
    pinNumber: '#13',
    name: 'Port Floppy Disk (FDD 34-Pin)',
    shortName: 'Port Floppy',
    category: 'mainboard',
    busDomain: 'southbridge',
    position: [-4.2, 0.38, 2.55],
    cameraOffset: [-4.2, 2.5, 4.7],
    functionEssay:
      'Antarmuka 34-pin untuk menghubungkan media penyimpanan removable generasi lawas yaitu Disket / Floppy Disk Drive (FDD) menggunakan kabel pita 34-wire.',
    examTrap:
      'Ukurannya sedikit lebih pendek dari Port IDE (34 pin vs 40 pin). Jangan tertukar saat menyebutkan jumlah wire di soal ujian.',
    keySpecs: ['Jumlah pin: 34-pin (kabel 34-wire)', 'Perangkat: Floppy Disk Drive (Disket)', 'Kendali: Southbridge'],
  },
  {
    id: 'atx-power',
    pinNumber: '#14',
    name: 'Port Power ATX 24-Pin (+ 4-Pin 12V)',
    shortName: 'Port Power ATX',
    category: 'mainboard',
    busDomain: 'power',
    position: [1.55, 0.46, 3.45],
    cameraOffset: [1.55, 2.7, 5.7],
    functionEssay:
      'Soket utama pemberi catu daya tegangan DC (+3.3V, +5V, +12V, -12V, +5VSB) dari Power Supply Unit (PSU) ke seluruh rangkaian motherboard, dilengkapi klip pengait agar konektor tidak terbalik.',
    examTrap:
      'Untuk uji mandiri PSU pada kasus PC Mati Total, jumper kabel Hijau (PS_ON, pin 16) dengan kabel Hitam (Ground/COM) untuk melihat apakah kipas PSU berputar.',
    keySpecs: ['Konektor utama: ATX 20+4 pin + ATX 12V 4-pin', 'Pin 16 Hijau: PS_ON (trigger nyala PSU)', 'Pin 9 Ungu: +5V Stand-by (langsung aktif saat colok PLN)'],
  },
  {
    id: 'back-panel-block',
    pinNumber: '#15',
    name: 'Blok Back Panel I/O (Kumpulan Port Belakang)',
    shortName: 'Back Panel I/O',
    category: 'mainboard',
    busDomain: 'io',
    position: [0.0, 0.65, -3.72],
    cameraOffset: [0.0, 2.3, -6.9],
    functionEssay:
      'Kumpulan port antarmuka eksternal yang terletak di sisi belakang casing komputer PC untuk menghubungkan periferal luar (mouse, keyboard, printer, jaringan LAN, USB, audio, dan perangkat multimedia).',
    examTrap:
      'Titik #15 adalah keseluruhan blok Back Panel, sedangkan rincian 9 port individual di dalamnya adalah titik #16 hingga #24.',
    keySpecs: ['Lokasi: Sisi belakang casing PC', 'Mencakup 9 jenis port (#16 s/d #24)', 'Terintegrasi dengan I/O Shield logam'],
  },
  // 9 Separate Back Panel I/O Ports (#16 - #24)
  {
    id: 'ps2-mouse',
    pinNumber: '#16',
    name: 'Port PS/2 Mouse (Hijau)',
    shortName: 'PS/2 Mouse',
    category: 'back-panel',
    busDomain: 'io',
    position: [3.35, 0.72, -3.98],
    cameraOffset: [3.35, 1.45, -6.1],
    functionEssay:
      'Port bulat 6-pin berwarna hijau khusus untuk menghubungkan perangkat input Mouse generasi PS/2 ke motherboard.',
    examTrap:
      'Hafalkan warna standar PC99: Hijau = PS/2 Mouse (#16), Ungu = PS/2 Keyboard (#17). Jangan sampai terbalik!',
    keySpecs: ['Kode warna: Hijau', 'Konektor: Mini-DIN 6-pin', 'Perangkat: Mouse PS/2'],
  },
  {
    id: 'ps2-keyboard',
    pinNumber: '#17',
    name: 'Port PS/2 Keyboard (Ungu)',
    shortName: 'PS/2 Keyboard',
    category: 'back-panel',
    busDomain: 'io',
    position: [3.35, 0.38, -3.98],
    cameraOffset: [3.35, 1.1, -6.1],
    functionEssay:
      'Port bulat 6-pin berwarna ungu khusus untuk memasang perangkat input Keyboard generasi PS/2 ke komputer.',
    examTrap:
      'Port PS/2 tidak mendukung hot-plug sempurna seperti USB; mencolok saat PC menyala bisa membuat keyboard tidak terdeteksi hingga restart.',
    keySpecs: ['Kode warna: Ungu', 'Konektor: Mini-DIN 6-pin', 'Perangkat: Keyboard PS/2'],
  },
  {
    id: 'parallel-port',
    pinNumber: '#18',
    name: 'Port Paralel (LPT / DB25 Pink)',
    shortName: 'Port Paralel',
    category: 'back-panel',
    busDomain: 'io',
    position: [1.85, 0.74, -3.98],
    cameraOffset: [1.85, 1.5, -6.2],
    functionEssay:
      'Port 25-pin (DB25) berwarna pink/magenta untuk memasang periferal berkecepatan rendah dengan lebar transfer data 8-bit secara paralel, umumnya digunakan untuk printer sebelum era USB.',
    examTrap:
      'Ingat kata kunci Essay: "lebar data 8-bit" dan "printer sebelum generasi USB". Kini sudah digantikan oleh Port USB.',
    keySpecs: ['Lebar data: 8-bit paralel', 'Konektor: DB25 Female warna pink', 'Kegunaan klasik: Printer dot-matrix / inkjet lama'],
  },
  {
    id: 'serial-port',
    pinNumber: '#19',
    name: 'Port Serial (COM / DB9 Teal)',
    shortName: 'Port Serial',
    category: 'back-panel',
    busDomain: 'io',
    position: [2.15, 0.38, -3.98],
    cameraOffset: [2.15, 1.15, -6.2],
    functionEssay:
      'Port 9-pin (DB9) berwarna hijau kebiruan (teal) untuk memasang periferal kecepatan rendah dengan mode transfer data serial (bit demi bit). Saat ini jarang digunakan pada PC rumahan namun masih dipakai di konfigurasi perangkat jaringan/industri.',
    examTrap:
      'Beda dengan Paralel (8-bit serentak): Serial mengirim data berurutan bit demi bit.',
    keySpecs: ['Mode transfer: Serial (bit-by-bit)', 'Konektor: DB9 Male (9 pin)', 'Status: Digantikan USB pada PC modern'],
  },
  {
    id: 'spdif-port',
    pinNumber: '#20',
    name: 'Port SPDIF (Digital Audio Out)',
    shortName: 'Port SPDIF',
    category: 'back-panel',
    busDomain: 'io',
    position: [0.65, 0.42, -3.98],
    cameraOffset: [0.65, 1.2, -6.1],
    functionEssay:
      'Sony/Philips Digital Interface (SPDIF) digunakan untuk menghubungkan komputer dengan perangkat audio digital eksternal seperti sistem Home Theatre atau amplifier digital.',
    examTrap:
      'Sering muncul di soal ABC Back Panel: jawaban wajibnya adalah periferal audio digital / Home Theatre.',
    keySpecs: ['Sinyal: Audio digital (Coaxial RCA / Optical)', 'Perangkat target: Home Theatre / AV Receiver', 'Bebas gangguan noise analog'],
  },
  {
    id: 'firewire-port',
    pinNumber: '#21',
    name: 'Port Firewire (IEEE 1394)',
    shortName: 'Port Firewire',
    category: 'back-panel',
    busDomain: 'io',
    position: [-0.35, 0.68, -3.98],
    cameraOffset: [-0.35, 1.45, -6.1],
    functionEssay:
      'Port IEEE 1394 untuk menghubungkan peralatan eksternal berkecepatan tinggi secara stabil, khususnya perangkat Video Capture, kamera DV, atau streaming video.',
    examTrap:
      'Kata kunci khas Firewire di modul STMIK AKI: "peralatan eksternal kecepatan tinggi seperti video capture atau streaming video".',
    keySpecs: ['Standar: IEEE 1394', 'Perangkat utama: Video Capture & Camcorder DV', 'Transfer data isokronus kecepatan tinggi'],
  },
  {
    id: 'rj45-port',
    pinNumber: '#22',
    name: 'Port RJ45 (Ethernet LAN)',
    shortName: 'Port RJ45 LAN',
    category: 'back-panel',
    busDomain: 'io',
    position: [-1.45, 0.78, -3.98],
    cameraOffset: [-1.45, 1.55, -6.1],
    functionEssay:
      'Port konektor jaringan 8-pin untuk menghubungkan komputer ke jaringan lokal (LAN / Switch / Router) menggunakan kabel UTP/STP berujung konektor RJ45.',
    examTrap:
      'Jangan tertukar dengan RJ11 (modem telepon yang lebih sempit). RJ45 memiliki 8 pin untuk jaringan Ethernet LAN.',
    keySpecs: ['Konektor: 8P8C / RJ45', 'Fungsi: Koneksi jaringan lokal (LAN)', 'Dilengkapi LED indikator link & aktivitas'],
  },
  {
    id: 'usb-ports',
    pinNumber: '#23',
    name: 'Port USB (Universal Serial Bus)',
    shortName: 'Port USB',
    category: 'back-panel',
    busDomain: 'io',
    position: [-1.45, 0.38, -3.98],
    cameraOffset: [-1.45, 1.15, -6.1],
    functionEssay:
      'Antarmuka universal standar generasi modern untuk menghubungkan berbagai periferal eksternal (flashdisk, mouse, keyboard, printer, webcam) yang menggantikan peran port Paralel dan Serial.',
    examTrap:
      'USB bersifat hot-swappable (plug & play tanpa restart) dan dikendalikan oleh Southbridge.',
    keySpecs: ['Menggantikan: Port Paralel & Serial', 'Fitur: Plug-and-Play & Hot-Swap', 'Kendali: Southbridge (Hi-Speed USB 2.0/3.0)'],
  },
  {
    id: 'audio-ports',
    pinNumber: '#24',
    name: 'Port Audio (Line-In, Line-Out, Mic)',
    shortName: 'Port Audio',
    category: 'back-panel',
    busDomain: 'io',
    position: [-2.85, 0.56, -3.98],
    cameraOffset: [-2.85, 1.35, -6.1],
    functionEssay:
      'Kumpulan jack audio analog 3,5 mm untuk menghubungkan komputer dengan sistem tata suara seperti speaker (Line-Out hijau), mikrofon (Mic merah muda), dan input audio eksternal (Line-In biru).',
    examTrap:
      'Kode warna standar 3,5 mm: Hijau = Speaker/Line-Out, Pink = Mikrofon, Biru = Line-In.',
    keySpecs: ['Hijau: Line-Out / Speaker', 'Pink: Mikrofon (Mic-In)', 'Biru: Line-In (sumber audio luar)'],
  },
  // Separate Cluster on Workbench: C-Panel / Front Panel
  {
    id: 'c-panel',
    pinNumber: 'FP',
    name: 'Klaster C-Panel / Front Panel & Header F_PANEL',
    shortName: 'C-Panel / Front Panel',
    category: 'c-panel',
    busDomain: 'front-panel',
    position: [6.4, 0.52, 2.25],
    cameraOffset: [5.5, 3.1, 5.4],
    functionEssay:
      'Kumpulan kabel konektor dari panel depan casing komputer menuju pin header F_PANEL motherboard, terdiri dari Power SW (tombol daya), Reset SW (tombol restart), Power LED (+/-), HDD LED (+/-), Speaker buzzer POST, dan Front USB.',
    examTrap:
      'Kabel LED (Power LED & HDD LED) memiliki polaritas (+ dan -); jika terbalik lampu tidak menyala. Sedangkan Power SW & Reset SW adalah saklar sesaat (non-polaritas). Kabel Front USB tidak boleh tertukar dengan pin Firewire karena dapat merusak perangkat!',
    keySpecs: [
      'Power SW & Reset SW: Saklar momentary (tanpa polaritas)',
      'Power LED & HDD LED: Wajib tepat kutub (+) dan (-)',
      'Speaker Buzzer: Menghasilkan bunyi beep diagnostik POST',
    ],
    pinoutDetails: [
      { pin: 'Pin 1 & 3 (Oranye)', label: 'HDD LED (Merah-Putih)', color: '#F97316', purpose: 'Indikator aktivitas baca/tulis harddisk (polaritas wajib tepat)' },
      { pin: 'Pin 2 (Hijau)', label: '+P LED (Hijau)', color: '#22C55E', purpose: 'Kutub positif (+) indikator lampu daya casing menyala' },
      { pin: 'Pin 4 (Hijau)', label: '-P LED (Putih)', color: '#E2E8F0', purpose: 'Kutub negatif (-) pasangan indikator lampu daya casing' },
      { pin: 'Pin 5 & 7 (Biru)', label: 'RESET SW (Biru-Putih)', color: '#3B82F6', purpose: 'Tombol restart paksa sistem tanpa memutus listrik utama' },
      { pin: 'Pin 6 & 8 (Merah)', label: 'POWER SW (Oranye-Putih)', color: '#EF4444', purpose: 'Trigger tombol power menyalakan Main Power Supply PSU' },
      { pin: 'Pin 9 (Hitam)', label: 'Key / NC (Pin 10 Kosong)', color: '#64748B', purpose: 'Pin kunci orientasi konektor 9-pin (Pin 10 tidak memiliki jarum)' },
    ],
  },
];

export const ASSEMBLY_STEPS: AssemblyStep[] = [
  {
    stepNumber: 1,
    id: 'step-open-socket',
    title: 'Buka Tuas Pengunci Soket Prosesor',
    targetComponentId: 'cpu-socket',
    instruction: 'Tekan dan geser tuas logam pengunci Soket LGA 775 (#01) ke atas untuk membuka pelat penahan prosesor sebelum pemasangan.',
    caution: 'Jangan menyentuh deretan pin mikroskopis di dalam soket karena sangat mudah bengkok dan sensitif terhadap listrik statis (ESD).',
    verificationText: 'Tuas soket terbuka penuh 90° dan siap menerima prosesor.',
  },
  {
    stepNumber: 2,
    id: 'step-install-cpu',
    title: 'Pasang Prosesor & Kunci Tuas Soket',
    targetComponentId: 'cpu-socket',
    instruction: 'Cocokkan tanda segitiga sudut pada prosesor dengan sudut soket (#01), letakkan rata tanpa tekanan paksa, lalu tutup pelat dan kaitkan tuas pengunci kembali.',
    caution: 'Pemasangan tidak tepat dapat membengkokkan pin atau menyebabkan prosesor overheat dan terbakar.',
    verificationText: 'Prosesor terpasang presisi dan terkunci rapat pada Soket LGA 775.',
  },
  {
    stepNumber: 3,
    id: 'step-heatsink',
    title: 'Oleskan Thermal Paste & Pasang Heatsink Fan',
    targetComponentId: 'cpu-socket',
    instruction: 'Oleskan thermal paste tipis di permukaan IHS prosesor, posisikan heatsink & kipas tepat di atasnya, lalu kunci 4 titik dudukan secara menyilang & colok konektor CPU_FAN.',
    caution: 'Arahkan kabel kipas pada jarak terpendek ke header CPU_FAN agar tidak tersangkut bilah kipas.',
    verificationText: 'Heatsink & kipas pendingin terpasang kokoh, konektor daya kipas tersambung.',
  },
  {
    stepNumber: 4,
    id: 'step-install-ram',
    title: 'Buka Klip Slot Memori & Pasang Keping RAM',
    targetComponentId: 'ram-slots',
    instruction: 'Buka kedua klip putih pada Slot Memori (#02), sejajarkan celah (notch) bawah keping RAM dengan tonjolan slot, lalu tekan kedua ujung secara seimbang hingga terdengar bunyi "klik".',
    caution: 'Memaksa RAM dengan arah terbalik akan merusak keping memori atau slot motherboard.',
    verificationText: 'Modul RAM terpasang sempurna dan kedua klip pengunci menutup otomatis.',
  },
  {
    stepNumber: 5,
    id: 'step-install-vga',
    title: 'Pasang Kartu Grafis pada Slot PCIe x16',
    targetComponentId: 'pcie-x16',
    instruction: 'Sejajarkan konektor emas kartu VGA dengan Slot PCIe x16 (#05), tekan lurus ke bawah hingga kait pengunci ujung slot terkunci rapat.',
    caution: 'Pastikan kartu grafis terpasang lurus sejajar agar tidak terjadi layar Blank akibat kontak pin longgar.',
    verificationText: 'Kartu grafis terkunci di jalur berkecepatan tinggi PCIe x16 menuju Northbridge.',
  },
  {
    stepNumber: 6,
    id: 'step-atx-power',
    title: 'Hubungkan Kabel Daya ATX 24-Pin & 4-Pin 12V',
    targetComponentId: 'atx-power',
    instruction: 'Sambungkan konektor utama ATX 20+4 pin dari PSU ke Port Power (#14) serta konektor tambahan ATX 12V 4-pin di dekat area prosesor hingga pengait klik.',
    caution: 'Pastikan saklar tegangan belakang PSU berada pada posisi 220V–230V sebelum menyalakan daya.',
    verificationText: 'Suplai daya utama DC (+3.3V, +5V, +12V, +5VSB) tersambung ke mainboard.',
  },
  {
    stepNumber: 7,
    id: 'step-storage-cable',
    title: 'Pasang Kabel Data Storage (SATA / IDE)',
    targetComponentId: 'sata-ports',
    instruction: 'Tancapkan kabel data tipis 7-pin ke Port SATA (#11) untuk Harddisk modern (atau kabel pita 40-wire ke Port IDE #12 dengan garis merah Pin 1 menghadap ke konektor daya).',
    caution: 'Pada harddisk IDE yang lebih dari satu unit, atur jumper fisik satu sebagai Master dan satunya sebagai Slave.',
    verificationText: 'Jalur data penyimpanan terhubung ke kontroler Southbridge.',
  },
  {
    stepNumber: 8,
    id: 'step-cpanel',
    title: 'Hubungkan Kabel C-Panel / Front Panel',
    targetComponentId: 'c-panel',
    instruction: 'Pasang kabel Power SW, Reset SW, Power LED (+/-), HDD LED (+/-), Speaker buzzer, dan Front USB dari klaster C-Panel ke pin header F_PANEL motherboard sesuai diagram pinout.',
    caution: 'Periksa kutub (+) dan (-) pada kabel LED; polaritas terbalik membuat indikator LED casing tidak menyala.',
    verificationText: 'Seluruh 8 langkah perakitan TAS selesai! PC siap diuji coba POST & booting.',
  },
];
