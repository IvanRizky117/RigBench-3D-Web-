import type { CurriculumCluster, MaterialTrackId } from '../types/rigbench';

export interface MaterialTrackMeta {
  id: MaterialTrackId;
  label: string;
  shortLabel: string;
  subtitle: string;
  sourceLabel: string;
}

export const MATERIAL_TRACKS: MaterialTrackMeta[] = [
  {
    id: 'praktikum',
    label: 'Praktikum PC',
    shortLabel: 'Praktikum PC',
    subtitle: '7 klaster anatomi hardware, kelistrikan PSU, storage, troubleshooting, elektronika & EULA',
    sourceLabel: 'Modul STMIK AKI',
  },
  {
    id: 'arsitektur',
    label: 'Arsitektur Komputer',
    shortLabel: 'Arsitektur',
    subtitle: '3 klaster unit fungsional, bus & register buffer, multiprogramming OS, pipelining, RISC/CISC & paralel',
    sourceLabel: 'Modul 1 · D3 TKJ',
  },
  {
    id: 'sejarah',
    label: 'Sejarah PC',
    shortLabel: 'Sejarah PC',
    subtitle: '3 klaster evolusi alat hitung, 5 generasi hardware, definisi pakar, klasifikasi & 4 era software',
    sourceLabel: 'Modul 6 · D3 TKJ',
  },
];

export const EXTRA_CURRICULUM_CLUSTERS: CurriculumCluster[] = [
  // =========================================================================
  // SUB-TAB 2: MODUL 1 — PENGENALAN ARSITEKTUR KOMPUTER (3 KLASTER)
  // =========================================================================
  {
    id: 'arch-1',
    track: 'arsitektur',
    number: 'A1',
    shortTitle: 'Unit & Struktur Bus',
    title: 'Tipe Komputer, 5 Unit Fungsional & Struktur Bus',
    subtitle:
      'Rentang komputer PC hingga Supercomputer, 5 unit fungsional (Input, Memori & Cache, ALU+Register, Output, Kontrol), Bus Tunggal vs Multi-Bus, serta Register Buffer.',
    ttsWeight: 'Bobot Tinggi — Arsitektur Dasar & Bus',
    summaryPoints: [
      '5 Tipe Komputer berdasarkan daya & skala: Personal Computer (desktop/notebook), Workstation (desain grafis/engineering), Enterprise/Mainframe (data korporasi), Server (basis data & backbone internet), dan Supercomputer (cuaca & simulasi pesawat).',
      '5 Unit Fungsional mandiri: Input, Memori (Primer RAM berbasis word 16–64 bit & hierarki Cache vs Sekunder), ALU + Register (akses tercepat melebihi Cache), Output, dan Unit Kontrol (pusat saraf pengirim sinyal timing).',
      'Bus adalah sekelompok jalur paralel (1 bit per jalur) yang membawa data, alamat, dan kontrol. Struktur Bus Tunggal murah & fleksibel tetapi hanya melayani 1 transfer pada satu waktu; Multi-Bus mencapai konkurensi lebih tinggi dengan biaya lebih besar.',
      'Register Buffer elektronik pada periferal I/O (seperti printer) menampung sementara data transfer cepat dari CPU sehingga prosesor segera bebas mengerjakan tugas lain tanpa terhambat perangkat elektromekanik yang lambat.',
    ],
    trapWarning:
      'Jebakan Ujian: Urutan kecepatan akses dari tercepat ke terlambat adalah Register (dalam prosesor) → Cache → Memori Utama (RAM) → Penyimpanan Sekunder. Jangan pernah menempatkan Cache lebih cepat daripada Register!',
    segments: [
      {
        id: 'a1-s1',
        title: '5 Tipe Komputer & 5 Unit Fungsional Utama',
        durationSec: 40,
        narration:
          'Halo teman-teman! Bayangkan komputer itu seperti kantor pintar mini yang super gesit. Dari ukurannya, ada lima jenis: Personal Computer buat tugas harian di rumah, Workstation buat desain gambar berat, Mainframe dan Server buat simpan data kantor serta internet, sampai Supercomputer raksasa buat ramal cuaca! Di dalam setiap komputer, ada lima bagian kerja utama. Pertama loket penerima perintah dari keyboard dan mouse, ini namanya Unit Input. Kedua lemari penyimpan data tiga tingkat dari laci super cepat Cache, rak beralamat RAM berisi paket data bernama word, sampai piringan Disk, inilah Unit Memori. Ketiga mesin hitung raksasa bernama ALU lengkap dengan saku emas super cepat bernama Register. Keempat mesin cetak atau layar penampil hasil, yaitu Unit Output. Kelima ada si konduktor pengatur giliran kerja lewat sinyal timing, namanya Unit Kontrol!',
        highlightedKeywords: [
          'Personal Computer',
          'Workstation',
          'Server',
          'Supercomputer',
          'Unit Input',
          'Cache',
          'RAM',
          'word',
          'Unit Memori',
          'ALU',
          'Register',
          'Unit Output',
          'sinyal timing',
          'Unit Kontrol',
        ],
        visualType: 'arch-units-overview',
        stageCaption: 'Diorama 3D Kantor Pintar: 5 Jenis Komputer & 5 Bagian Kerja Utama (Input hingga Kontrol)',
        examTakeaway:
          'Ingat 5 unit fungsional wajib: Input, Memori, ALU (+Register), Output, dan Unit Kontrol (pusat saraf sinyal timing).',
      },
      {
        id: 'a1-s2',
        title: 'Struktur Bus Tunggal vs Multi-Bus & Register Buffer I/O',
        durationSec: 36,
        narration:
          'Nah, gimana lima meja kerja tadi saling kirim barang? Mereka pakai jalan tol kabel paralel bernama Bus yang membawa paket Data, Alamat tujuan, dan sinyal Kontrol! Kalau jalannya cuma satu jalur bolak-balik, itu disebut Bus Tunggal: biayanya murah, tapi harus gantian satu-satu. Biar banyak barang bisa jalan barengan tanpa macet, dipakai jalan banyak jalur bernama Multi-Bus yang lebih mahal. Terus ada satu masalah seru: otak prosesor atau CPU kerjanya secepat kilat, sedangkan printer cetaknya pelan banget! Biar CPU nggak ikut bengong nungguin printer, dipasang kotak antrean kaca bernama Register Buffer. CPU tinggal setor paket sekejap ke Buffer lalu bebas kerja lagi, sementara printer menyedot kertas pelan-pelan dari kotak Buffer!',
        highlightedKeywords: [
          'Bus',
          'Data',
          'Alamat',
          'Kontrol',
          'Bus Tunggal',
          'Multi-Bus',
          'CPU',
          'printer',
          'Register Buffer',
        ],
        visualType: 'arch-bus-buffer',
        stageCaption: 'Jalan Tol Kabel Bus Tunggal vs Multi-Bus & Kotak Antrean Kaca Register Buffer menuju Printer',
        examTakeaway:
          'Fungsi utama Register Buffer: menampung data sementara agar CPU yang secepat kilat tidak tersandera printer yang lambat.',
      },
    ],
  },
  {
    id: 'arch-2',
    track: 'arsitektur',
    number: 'A2',
    shortTitle: 'OS, Pipeline & Performa',
    title: 'Sistem Operasi (t0–t5), Performa, Pipelining & RISC/CISC',
    subtitle:
      'Analogi kantor Compiler & Multiprogramming OS (t0–t5), hitung performa MTK SD T=(N×S)/R, Dapur Burger Pipelining & Superscalar, Kurir Motor RISC vs Truk CISC & SPEC.',
    ttsWeight: 'Bobot Sangat Tinggi — Analisis Performa',
    summaryPoints: [
      'Compiler menerjemahkan source code bahasa tingkat tinggi (C/Java) menjadi program objek bahasa mesin; Sistem Operasi (OS) membagi resource secara konkuren lewat Multiprogramming/Multitasking (diagram t0–t5) agar CPU tidak menganggur saat disk atau printer bekerja.',
      'Persamaan performa dasar T = (N × S) / R: agar waktu eksekusi T makin singkat, desainer menurunkan N (jumlah eksekusi instruksi via compiler), menurunkan S (siklus per instruksi via pipelining), dan menaikkan R (clock rate = 1/P).',
      'Pipelining menumpangtindihkan eksekusi instruksi berurutan (seperti dapur burger 4 stasiun) sehingga nilai efektif S mendekati 1; eksekusi Superscalar memakai banyak pipeline paralel (2 meja dapur) sehingga nilai efektif S bisa kurang dari 1.',
      'RISC memakai instruksi sederhana (ibarat kurir motor lincah: N besar, S kecil, ramah pipeline) vs CISC memakai instruksi kompleks (ibarat truk besar: N kecil, S besar). Pengukuran performa paling valid memakai program aplikasi riil standar SPEC, bukan angka MHz semata.',
    ],
    trapWarning:
      'Jebakan Ujian Klasik: Prosesor dengan clock 900 MHz BELUM TENTU lebih cepat dari prosesor 700 MHz! Karena N, S, dan R saling memengaruhi—prosesor 700 MHz dengan nilai S lebih kecil (langkah lebih rapi) bisa selesai lebih cepat.',
    segments: [
      {
        id: 'a2-s1',
        title: '1. Kantor Manajer OS: Compiler, Jadwal t0–t5 & Multiprogramming',
        durationSec: 42,
        narration:
          'Yuk kita pelajari pelan-pelan cara kerja kantor di dalam komputer. Pertama, ada petugas penerjemah di meja kiri. Tugasnya mengubah tulisan bahasa manusia menjadi kode angka mesin. Nama resminya adalah Compiler. Kedua, ada si Manajer Kantor pengatur jadwal, yaitu Sistem Operasi atau OS. Sekarang, lihat papan jadwal di dinding belakang dari t0 sampai t5. Jarum merah bergerak maju tiap tahap. Saat tugas pertama butuh ambil berkas dari disk, atau mau cetak ke printer, Manajer OS yang turun tangan. Nah, coba bayangkan masalahnya. Waktu printer sedang mencetak pelan-pelan, si CPU malah ikut diam menganggur! Sayang banget kan waktunya? Makanya komputer modern memakai cara kerja barengan bernama Multiprogramming atau Multitasking. Begitu printer sibuk mencetak tugas pertama, Manajer OS langsung menyodorkan Tugas 2 ke meja CPU. Hasilnya, printer jalan terus, dan CPU juga tetap kerja aktif tanpa bengong!',
        highlightedKeywords: [
          'Compiler',
          'Sistem Operasi',
          'papan jadwal',
          't0',
          't5',
          'printer',
          'menganggur',
          'Multiprogramming',
          'Multitasking',
          'Tugas 2',
        ],
        visualType: 'arch-os-multi',
        stageCaption: 'Video 1/4 · Kantor Manajer OS: Penerjemah Compiler, Jadwal Bertahap t0–t5 & Multiprogramming',
        examTakeaway:
          'Bedakan Elapsed Time (total waktu t5−t0 termasuk menunggu disk & printer) dengan Waktu Prosesor (hanya saat CPU aktif bekerja).',
      },
      {
        id: 'a2-s2',
        title: '2. Hitung Pelan MTK SD: Rumus T = (N × S) / R & Jebakan MHz',
        durationSec: 46,
        narration:
          'Sekarang kita belajar pelan-pelan cara menghitung kecepatan komputer, cukup pakai matematika SD! Bayangkan kamu sedang membungkus sepuluh kotak paket di meja ini. Lihat kotaknya muncul satu per satu, sampai genap sepuluh paket. Angka sepuluh ini kita sebut huruf N, yaitu banyaknya tugas. Selanjutnya, tiap satu paket butuh dua langkah kerja: lipat kardus, lalu tempel lakban. Jadi total langkah untuk sepuluh paket adalah sepuluh dikali dua, sama dengan dua puluh langkah. Jumlah langkah per paket ini kita sebut huruf S. Lalu, misalkan kecepatan tanganmu adalah dua langkah setiap detik. Kecepatan ini kita sebut huruf R. Nah, berapa detik sampai semua selesai? Tinggal dua puluh langkah dibagi dua, hasilnya sepuluh detik! Di ujian, hitungan tadi ditulis rumus T sama dengan N dikali S dibagi R. Terakhir, hati-hati jebakan ujian! Prosesor 900 MHz belum tentu menang lawan 700 MHz. Lihat dua pelari di lintasan ini: angka MHz itu cuma cepatnya gerak kaki. Pelari 900 MHz memang kakinya cepat, tapi langkahnya muter-muter dan ribet. Akhirnya pelari 700 MHz yang langkahnya pendek dan rapi justru menyentuh garis finis lebih dulu!',
        highlightedKeywords: [
          'sepuluh kotak paket',
          'huruf N',
          'dua langkah',
          'huruf S',
          'huruf R',
          'sepuluh detik',
          'T sama dengan N dikali S dibagi R',
          '900 MHz',
          '700 MHz',
        ],
        visualType: 'arch-perf-math',
        stageCaption: 'Video 2/4 · Demo Hitung 10 Paket (T = N × S / R) & Adu Langkah 900 MHz vs 700 MHz',
        examTakeaway:
          'Rumus performa dasar T = (N × S) / R. Angka clock 900 MHz belum tentu lebih cepat dari 700 MHz jika jumlah langkah S lebih besar.',
      },
      {
        id: 'a2-s3',
        title: '3. Dapur Burger: Cara Biasa Lambat vs Pipelining & Superscalar',
        durationSec: 44,
        narration:
          'Gimana caranya supaya komputer menyelesaikan pekerjaan jauh lebih cepat? Yuk lihat di Dapur Burger ini! Pertama, perhatikan cara kerja biasa yang lambat. Cuma ada satu koki yang mengerjakan satu burger sendirian dari awal sampai akhir. Potong roti dulu, lalu isi daging, lalu tambah sayur, baru dibungkus. Koki lain cuma diam menunggu, jadi lama sekali! Sekarang, kita ubah jadi kerja estafet empat koki yang disebut Pipelining. Koki pertama khusus potong roti. Koki kedua khusus isi daging. Koki ketiga khusus pasang sayur dan keju. Koki keempat khusus membungkus. Begitu meja ban berjalan menyala, keempat koki bekerja serentak tanpa saling tunggu! Setiap satu detak waktu, selalu ada satu burger matang yang selesai. Dalam ujian, artinya rata-rata langkah S mendekati angka satu. Nah, gimana kalau mau dua kali lipat lebih cepat lagi? Tinggal buka satu meja dapur lagi tepat di sebelahnya! Sekarang dua jalur dapur berjalan barengan, sehingga dua burger matang sekaligus dalam satu detak. Cara membuka banyak jalur paralel ini disebut Superscalar, dan nilai efektif S menjadi kurang dari satu!',
        highlightedKeywords: [
          'satu koki',
          'Pipelining',
          'potong roti',
          'isi daging',
          'sayur dan keju',
          'membungkus',
          'mendekati angka satu',
          'dua jalur dapur',
          'Superscalar',
          'kurang dari satu',
        ],
        visualType: 'arch-perf-pipe',
        stageCaption: 'Video 3/4 · Demo 1 Koki Lambat vs Estafet 4 Koki (Pipelining) & 2 Jalur Dapur (Superscalar)',
        examTakeaway:
          'Hafalkan angka sakti ujian: Pipelining membuat S efektif ≈ 1 (estafet 4 stasiun); Superscalar membuat S efektif < 1 (banyak jalur paralel).',
      },
      {
        id: 'a2-s4',
        title: '4. Kurir Motor RISC vs Truk Besar CISC & Uji Kerja Nyata SPEC',
        durationSec: 38,
        narration:
          'Terakhir di bab ini, ada dua gaya rancangan perintah di dalam prosesor. Lihat garis start di jalan depan ini! Gaya pertama adalah RISC, ibarat kurir motor yang super lincah. Sekali jalan dia memang cuma bawa paket kecil dan sederhana, tapi karena lincah, jalannya ngebut banget dan sangat cocok dengan sistem estafet Pipelining! Gaya kedua adalah CISC, ibarat truk kargo besar. Sekali angkut dia bisa membawa banyak barang rumit sekaligus, jadi jumlah bolak-baliknya sedikit, tapi jalannya lebih berat dan pelan. Nah, kalau kita mau membandingkan komputer mana yang benar-benar paling kencang, jangan cuma percaya angka di brosur! Cara paling adil adalah langsung dites mengerjakan tugas aplikasi nyata sehari-hari. Standar pengujian dunia nyata ini di ujian disebut SPEC. Komputer yang menyelesaikan kumpulan program uji SPEC paling cepat, dialah pemenang sejatinya!',
        highlightedKeywords: [
          'garis start',
          'RISC',
          'kurir motor',
          'Pipelining',
          'CISC',
          'truk kargo besar',
          'brosur',
          'SPEC',
        ],
        visualType: 'arch-risc-spec',
        stageCaption: 'Video 4/4 · Start-Finis Kurir Motor RISC vs Truk Besar CISC & Podium Uji Kerja Nyata SPEC',
        examTakeaway:
          'RISC = instruksi sederhana (N besar, S kecil, ramah pipeline); CISC = instruksi kompleks (N kecil, S besar); SPEC = tolok ukur aplikasi nyata paling valid.',
      },
    ],
  },
  {
    id: 'arch-3',
    track: 'arsitektur',
    number: 'A3',
    shortTitle: 'Komputasi Paralel',
    title: 'Multiprosesor (Shared-Memory) vs Multikomputer (Message-Passing)',
    subtitle:
      'Analogi 4 koki baca 1 papan resep bersama (Multiprosesor / Shared-Memory) vs 4 dapur terpisah saling kirim chat WA (Multikomputer / Message-Passing).',
    ttsWeight: 'Bobot Sedang–Tinggi — Perbandingan Arsitektur',
    summaryPoints: [
      'Sistem Multiprosesor menggabungkan sejumlah unit prosesor dalam satu sistem yang mengeksekusi banyak tugas atau sub-tugas secara paralel.',
      'Ciri khas Multiprosesor Shared-Memory: ibarat 4 koki membaca 1 papan resep besar bersama—komunikasi super cepat, tetapi jalur kabel interkoneksinya sangat rumit dan mahal.',
      'Sistem Multikomputer menghubungkan kelompok komputer lengkap yang masing-masing hanya mengakses memori lokalnya sendiri.',
      'Ciri khas Multikomputer Message-Passing: ibarat 4 dapur terpisah dengan buku resep sendiri; kalau butuh bahan dari dapur lain, mereka saling kirim pesan lewat jaringan komunikasi.',
    ],
    trapWarning:
      'Jebakan Ujian: Jangan pernah menukar pasangan istilahnya! Multiprosesor = Shared-Memory (berbagi memori bersama); Multikomputer = Message-Passing (memori lokal terpisah, tukar data lewat kirim pesan).',
    segments: [
      {
        id: 'a3-s1',
        title: '4 Koki 1 Papan Resep (Multiprosesor) vs 4 Dapur Chat WA (Multikomputer)',
        durationSec: 35,
        narration:
          'Kalau kerjaan dapur terlalu menumpuk untuk satu koki, kita punya dua cara keroyokan! Lihat sisi kiri panggung: ada empat koki yang sama-sama membaca satu papan resep raksasa di tengah. Ini gambaran Sistem Multiprosesor atau Shared-Memory! Karena semua prosesor langsung melihat satu memori bersama, kerjanya super ngebut, tapi kabel penghubung atau interkoneksinya jadi super rumit dan mahal! Sekarang geser ke sisi kanan: ada empat dapur terpisah yang masing-masing punya buku resep sendiri alias memori lokal. Kalau dapur satu butuh data dari dapur lain, mereka saling kirim pesan seperti lewat chat WA! Nah, cara bertukar paket pesan lewat jaringan ini disebut Sistem Multikomputer atau Message-Passing!',
        highlightedKeywords: [
          'satu papan resep',
          'Multiprosesor',
          'Shared-Memory',
          'interkoneksinya',
          'memori lokal',
          'chat WA',
          'Multikomputer',
          'Message-Passing',
        ],
        visualType: 'arch-parallel',
        stageCaption: '4 Koki Berbagi 1 Papan Resep (Multiprosesor Shared-Memory) vs 4 Dapur Chat WA (Multikomputer)',
        examTakeaway:
          'Hafalkan kuncinya: Multiprosesor → Shared-Memory (1 memori bersama, kabel mahal); Multikomputer → Message-Passing (memori lokal, saling kirim pesan).',
      },
    ],
  },

  // =========================================================================
  // SUB-TAB 3: MODUL 6 — SEJARAH KOMPUTER (3 KLASTER)
  // =========================================================================
  {
    id: 'hist-1',
    track: 'sejarah',
    number: 'S1',
    shortTitle: 'Era Manual–Mekanik',
    title: 'Evolusi Alat Hitung: Dari Biji Kayu Abacus hingga Sakelar Lampu 1/0',
    subtitle:
      'Cerita perjalanan manusia menghitung: Abacus, kotak gerigi Pascaline, Arithometer, mesin uap Babbage & Ada Lovelace, kartu lubang Hollerith (IBM) hingga Boolean.',
    ttsWeight: 'Bobot Tinggi — Tokoh, Tahun & Penemuan',
    summaryPoints: [
      '4 Golongan alat pengolah data: (1) Peralatan Manual (tenaga tangan: Abacus ~5000 tahun lalu di Asia Kecil), (2) Peralatan Mekanik (gerigi manual: Pascaline 1642, Leibniz 1694, Arithometer Colmar), (3) Mekanik Elektronik/Uap (Babbage, Hollerith, Vannevar Bush), (4) Peralatan Elektronik penuh (Atanasoff-Berry 1940).',
      'Blaise Pascal (1642) menciptakan Pascaline dari kuningan dengan 8 roda gerigi (kelemahan: hanya penjumlahan); Leibniz (1694) menambah perkalian; Thomas de Colmar membuat Arithometer untuk 4 operasi aritmatika dasar.',
      'Charles Babbage merancang Mesin Differensial (1822, tenaga uap) dan Analytical Engine (komputer general-purpose pertama, 50.000 komponen, kartu perforasi). Asistennya, Augusta Ada King (Ada Lovelace), menjadi programmer wanita pertama dan diabadikan sebagai bahasa ADA (1980).',
      'Herman Hollerith (1889) memakai kartu perforasi (80 variabel) mempercepat Sensus AS dari 7–10 tahun menjadi 6 minggu dan mendirikan cikal bakal IBM (1924). Lalu Atanasoff & Berry (1940) menerapkan aljabar Boolean George Boole ke sirkuit listrik pertama.',
    ],
    trapWarning:
      'Jebakan Ujian: Kelemahan Pascaline (1642) adalah HANYA bisa melakukan penjumlahan! Sedangkan Arithometer karya Thomas de Colmar sudah sanggup 4 fungsi (+, −, ×, ÷), dan Programmer wanita pertama adalah Augusta Ada King (asisten Babbage).',
    segments: [
      {
        id: 'h1-s1',
        title: 'Kisah Manusia Menghitung: Biji Kayu Abacus sampai Sakelar Listrik 1 dan 0',
        durationSec: 42,
        narration:
          'Yuk jalan-jalan keliling waktu melihat bagaimana manusia dulu menghitung sebelum ada HP! Sekitar lima ribu tahun lalu di pasar Asia Kecil, orang menggeser biji-biji kayu dengan tangan di rak Abacus, inilah era Manual. Masuk era Mekanik tahun 1642, anak muda Blaise Pascal bikin kotak gerigi kuningan bernama Pascaline, tapi sayangnya cuma bisa dipakai tambah-tambahan! Lalu Leibniz di 1694 menambah fitur perkalian, dan Thomas de Colmar bikin Arithometer yang sudah bisa tambah, kurang, kali, bagi! Lanjut ke era mesin uap: Charles Babbage merancang mesin hitung serbaguna raksasa bernama Analytical Engine, dibantu Augusta Ada King sang programmer wanita pertama di dunia! Tahun 1889, Herman Hollerith memakai kartu kertas berlubang alias kartu perforasi yang memangkas hitungan sensus Amerika dari sepuluh tahun jadi enam minggu saja, hingga melahirkan perusahaan IBM! Puncaknya tahun 1940, Atanasoff dan Berry bikin mesin listrik memakai sakelar nyala mati satu dan nol dari logika Boolean George Boole!',
        highlightedKeywords: [
          'Abacus',
          'Blaise Pascal',
          'Pascaline',
          'cuma bisa dipakai tambah-tambahan',
          'Arithometer',
          'Charles Babbage',
          'Analytical Engine',
          'Augusta Ada King',
          'Herman Hollerith',
          'kartu perforasi',
          'IBM',
          'Atanasoff',
          'Boolean',
        ],
        visualType: 'hist-pre-electronic',
        stageCaption: 'Perjalanan Waktu 3D: Biji Kayu Abacus → Gerigi Pascaline → Mesin Babbage & Kartu IBM → Sakelar Boolean',
        examTakeaway:
          'Kunci hafalan tokoh: Pascal (1642, hanya tambah) · Colmar (4 operasi) · Babbage & Ada Lovelace · Hollerith (1889, kartu lubang/IBM) · Atanasoff-Berry (1940, Boolean).',
      },
    ],
  },
  {
    id: 'hist-2',
    track: 'sejarah',
    number: 'S2',
    shortTitle: '5 Generasi Hardware',
    title: '5 Generasi Komputer: Dari Mesin Panas Boros Listrik hingga AI Cerdas',
    subtitle:
      'Kisah penyusutan ukuran, panas, dan daya listrik komputer dari Tabung Vakum raksasa (Gen 1) hingga Mikroprosesor rumahan & AI super dingin (Gen 5).',
    ttsWeight: 'Bobot Sangat Tinggi — Hafalan Inti Ujian',
    summaryPoints: [
      'Generasi 1 (1946–1959): Tabung Vakum (Vacuum Tube), silinder magnetik, bahasa mesin biner, ukuran raksasa & boros daya. Mesin ikonik: Colossus (1943), Mark I, ENIAC (18.000 tabung vakum, 160 kW), EDVAC (1945, John von Neumann — stored program & CPU sentral), UNIVAC I (1951, komersial pertama).',
      'Generasi 2 (1959–1964): Transistor, memori inti-magnetik, lebih kecil & hemat energi, ganti bahasa mesin ke Assembly, lahir bahasa tingkat tinggi COBOL & FORTRAN. Mesin: Stretch, LARC, IBM 1401.',
      'Generasi 3 (1964–1970): IC / Integrated Circuit (Jack Kilby, Texas Instrument 1958, piringan silikon pasir kuarsa), ukuran makin ringkas, dan ditemukannya Sistem Operasi (OS) untuk menjalankan beberapa program serentak.',
      'Generasi 4 (1979–sekarang sesuai PDF): LSI, VLSI, ULSI & Mikroprosesor (Intel 4004 tahun 1971), lahir IBM PC (1981), Apple Macintosh (populerkan GUI & mouse), jaringan LAN. Generasi 5: Kecerdasan Buatan/AI (imajinasi HAL9000), Pemrosesan Paralel melampaui Von Neumann, Superkonduktor & proyek ICOT Jepang.',
    ],
    trapWarning:
      'Jebakan Ujian: Ingat pasangan emas tiap generasi! Gen 1 = Tabung Vakum & Bahasa Mesin; Gen 2 = Transistor, Assembly, COBOL/FORTRAN; Gen 3 = IC (Jack Kilby) & Sistem Operasi; Gen 4 = LSI/VLSI/ULSI & Mikroprosesor (Intel 4004); Gen 5 = AI, Pemrosesan Paralel & Superkonduktor.',
    segments: [
      {
        id: 'h2-s1',
        title: 'Gen 1 (Tabung Vakum Panas Boros) ke Gen 2 (Transistor Hemat Daya)',
        durationSec: 36,
        narration:
          'Bayangkan komputer zaman dulu itu nggak muat di meja, tapi sebesar satu ruangan kelas dan panasnya kayak oven! Itulah Generasi Pertama tahun 1946 sampai 1959 yang memakai lampu kaca besar bernama Tabung Vakum, silinder magnetik, dan bahasa mesin biner. Contoh paling terkenal adalah ENIAC yang butuh delapan belas ribu tabung vakum dan listrik super boros 160 kW! Lalu ada EDVAC tahun 1945 karya John von Neumann yang mengenalkan otak CPU sentral, serta UNIVAC I tahun 1951 sebagai komputer pertama yang dijual bebas. Untungnya di Generasi Kedua tahun 1959 sampai 1964, tabung kaca panas itu diganti komponen kecil bernama Transistor! Komputer langsung menyusut jauh lebih hemat listrik, kode biner rumit berganti singkatan bahasa Assembly, lalu muncul bahasa COBOL dan FORTRAN yang sukses dipakai di mesin IBM 1401!',
        highlightedKeywords: [
          'Generasi Pertama',
          'Tabung Vakum',
          'ENIAC',
          '160 kW',
          'EDVAC',
          'John von Neumann',
          'UNIVAC I',
          'Generasi Kedua',
          'Transistor',
          'Assembly',
          'COBOL',
          'FORTRAN',
          'IBM 1401',
        ],
        visualType: 'hist-gen-12',
        stageCaption: 'Perbandingan Meteran Panas & Listrik: Gen 1 Tabung Vakum 160 kW → Gen 2 Transistor Hemat Daya',
        examTakeaway:
          'Gen 1 = Tabung Vakum panas & boros (ENIAC, EDVAC Von Neumann, UNIVAC I); Gen 2 = Transistor lebih hemat (Assembly, COBOL, FORTRAN, IBM 1401).',
      },
      {
        id: 'h2-s2',
        title: 'Gen 3 (Chip IC Dingin), Gen 4 (PC Rumahan) & Gen 5 (AI Cerdas)',
        durationSec: 38,
        narration:
          'Walau transistor sudah lebih kecil, mesinnya masih sering kepanasan. Maka di Generasi Ketiga tahun 1964 sampai 1970, Jack Kilby memadatkan ribuan komponen ke satu keping silikon pasir kuarsa bernama Integrated Circuit atau IC! Di sini juga pertama kali lahir Sistem Operasi supaya komputer bisa buka banyak program barengan. Lanjut ke Generasi Keempat mulai 1979 hingga sekarang: jutaan sirkuit dipadatkan lewat teknologi LSI, VLSI, sampai ULSI menjadi satu otak mungil bernama Mikroprosesor seperti Intel 4004! Komputer akhirnya cukup ditaruh di meja rumah lewat IBM PC tahun 1981 dan Apple Macintosh yang mempopulerkan layar gambar GUI serta mouse! Terakhir Generasi Kelima menuju komputer super dingin, hemat, dan bisa berpikir sendiri lewat Kecerdasan Buatan atau AI seperti HAL9000, pemrosesan paralel banyak otak, kabel superkonduktor, serta proyek ICOT di Jepang!',
        highlightedKeywords: [
          'Generasi Ketiga',
          'Jack Kilby',
          'Integrated Circuit',
          'Sistem Operasi',
          'Generasi Keempat',
          'VLSI',
          'Mikroprosesor',
          'Intel 4004',
          'IBM PC',
          'Apple Macintosh',
          'GUI',
          'Generasi Kelima',
          'Kecerdasan Buatan',
          'pemrosesan paralel',
          'superkonduktor',
          'ICOT',
        ],
        visualType: 'hist-gen-345',
        stageCaption: 'Evolusi Sejuk & Cerdas: Gen 3 Chip IC + OS → Gen 4 Mikroprosesor PC → Gen 5 AI Paralel',
        examTakeaway:
          'Gen 3 = Chip IC (Jack Kilby) + Sistem Operasi; Gen 4 = LSI/VLSI/ULSI + Mikroprosesor (Intel 4004) + PC rumahan; Gen 5 = AI + Paralel + Superkonduktor.',
      },
    ],
  },
  {
    id: 'hist-3',
    track: 'sejarah',
    number: 'S3',
    shortTitle: 'Klasifikasi & 4 Era SW',
    title: 'Analogi Mobil 3 Elemen, Jam Analog vs Angka Digital & 4 Era Software',
    subtitle:
      'Asal kata computare, analogi Mobil–Peta–Supir (Hardware–Software–Brainware), jarum jam Analog vs angka pasti Digital, bentuk Tower–Palmtop & 4 Era Software.',
    ttsWeight: 'Bobot Tinggi — Klasifikasi & Konsep Sistem',
    summaryPoints: [
      'Komputer berasal dari bahasa Latin "computare" (menghitung). 3 Elemen tak terpisahkan: ibarat Mobil = Hardware (fisik), Peta Jalan = Software (aturan/instruksi), dan Supir = Brainware (manusia pengendali).',
      'Klasifikasi berdasarkan Data: Analog (ibarat jarum jam bergerak halus / data kualitatif kontinu, misal pengukur suhu rumah sakit), Digital (ibarat angka pasti 0–9 / data kuantitatif, misal PC), dan Hybrid (gabungan keduanya, misal Facsimile).',
      'Klasifikasi Penggunaan: Special Purpose (tujuan khusus) vs General Purpose (tujuan umum). Klasifikasi Bentuk Fisik: Tower, Desktop, Portable, Notebook, Subnotebook (tanpa disk drive), dan Palmtop/Handheld (baterai AA).',
      '4 Era Perkembangan Software: Era Pioner (1950-an, kabel/punched card, proses batch), Era Stabil (1960–1970-an, multi-user, multitasking, real-time, database), Era Mikro (1980-an, PC murah, software sistem vs aplikasi), dan Era Modern (1990–2000+, objek, sistem pakar, tertanam di HP/TV/AC & pengenalan suara/gambar).',
    ],
    trapWarning:
      'Jebakan Ujian: Ukuran fisik komputer TIDAK menentukan kemampuannya (kecil bukan berarti lemah!). Dan jangan tertukar: Analog = data KUALITATIF (jarum halus kontinu), Digital = data KUANTITATIF (angka pasti).',
    segments: [
      {
        id: 'h3-s1',
        title: 'Analogi Mobil 3 Elemen Sistem & Jam Analog vs Angka Digital',
        durationSec: 38,
        narration:
          'Di ruang terakhir ini, yuk pahami arti komputer dengan cara super gampang! Kata komputer berasal dari bahasa Latin computare yang artinya menghitung, lalu dirumuskan para pakar seperti Hamacher, Blissmer, dan Fuori. Supaya bisa jalan, komputer butuh tiga unsur seperti naik mobil: bodi mobil yang bisa kita sentuh itu ibarat Hardware, peta jalan berisi petunjuk arah itu ibarat Software, dan supir yang menyetir adalah manusia alias Brainware! Tanpa salah satunya, mobil nggak bakal jalan! Nah, jenis komputer menurut datanya juga gampang dibedakan: Komputer Analog itu kayak jarum jam dinding yang bergerak mengalir halus terus-terusan atau data kualitatif. Komputer Digital itu kayak layar angka pasti nol sampai sembilan atau data kuantitatif seperti PC. Kalau gabungan keduanya disebut Hybrid, contohnya mesin Facsimile! Ada juga tipe khusus Special Purpose, serbaguna General Purpose, serta bentuk fisik dari Tower besar sampai Palmtop segenggam tangan!',
        highlightedKeywords: [
          'computare',
          'Hamacher',
          'Blissmer',
          'Fuori',
          'Hardware',
          'Software',
          'Brainware',
          'Analog',
          'kualitatif',
          'Digital',
          'kuantitatif',
          'Hybrid',
          'Special Purpose',
          'Tower',
          'Palmtop',
        ],
        visualType: 'hist-class-def',
        stageCaption: 'Analogi 3 Elemen (Mobil–Peta–Supir), Jam Jarum Analog vs Layar Angka Digital & Bentuk Tower–Palmtop',
        examTakeaway:
          'Mobil = Hardware, Peta = Software, Supir = Brainware; Analog = jarum halus (kualitatif kontinu), Digital = angka pasti (kuantitatif).',
      },
      {
        id: 'h3-s2',
        title: '4 Era Software: Dari Kartu Lubang Antre sampai HP Pintar',
        durationSec: 33,
        narration:
          'Bukan cuma mesin fisiknya yang makin keren, program atau perangkat lunaknya juga naik kelas lewat empat tangga! Tangga pertama Era Pioner di tahun 1950-an: program masih berupa colokan kabel dan kartu lubang punched card yang harus antre satu-satu alias proses batch seperti di ENIAC. Tangga kedua Era Stabil di 1960 sampai 1970-an: software mulai dijual bebas, bisa dipakai ramai-ramai alias multi-user, multitasking seketika secara real-time, dan lahir sistem basis data! Tangga ketiga Era Mikro di 1980-an: karena PC murah masuk rumah, software terbagi jelas jadi software sistem pengatur mesin dan software aplikasi buat pengguna. Puncaknya tangga keempat Era Modern sejak 1990-an: lahir teknologi objek dan sistem pakar, bahkan software kini tertanam di HP, TV, dan AC yang pintar mengenali suara serta gambar!',
        highlightedKeywords: [
          'Era Pioner',
          'punched card',
          'batch',
          'Era Stabil',
          'multi-user',
          'real-time',
          'basis data',
          'Era Mikro',
          'software sistem',
          'Era Modern',
          'teknologi objek',
          'sistem pakar',
        ],
        visualType: 'hist-sw-eras',
        stageCaption: '4 Tangga Evolusi Software: Pioner (Kartu Antre) → Stabil (Ramai-Ramai) → Mikro (PC) → Modern (HP Pintar)',
        examTakeaway:
          'Ciri cepat: Pioner = kartu lubang & batch; Stabil = multi-user/real-time/database; Mikro = PC rumahan & murah; Modern = objek/sistem pakar/HP & TV.',
      },
    ],
  },
];

// =========================================================================
// STRUCTURED DATASETS FOR INTERACTIVE LABS (MODUL 1 & MODUL 6)
// =========================================================================

export const COMPUTER_TYPES_M1 = [
  {
    id: 'pc',
    name: 'Personal Computer (PC)',
    form: 'Desktop & Notebook Portable',
    role: 'Digunakan di rumah, sekolah, dan kantor bisnis; lengkap dengan unit olah, penyimpanan, display, audio, dan keyboard.',
    scale: 'Skala Harian',
  },
  {
    id: 'workstation',
    name: 'Workstation',
    form: 'Dimensi Desktop Berdaya Tinggi',
    role: 'Kemampuan input/output grafis resolusi tinggi dan daya komputasi lebih kuat dari PC untuk aplikasi engineering & desain interaktif.',
    scale: 'Teknik & CAD',
  },
  {
    id: 'enterprise',
    name: 'Enterprise / Mainframe',
    form: 'Sistem Korporasi Multi-Prosesor',
    role: 'Pengolahan data bisnis bervolume besar pada korporasi menengah hingga besar dengan kapasitas simpan raksasa.',
    scale: 'Korporasi',
  },
  {
    id: 'server',
    name: 'Server & Internet Backbone',
    form: 'Rack Penyimpanan Basis Data',
    role: 'Menangani banyak permintaan akses data dari komunitas pendidikan, bisnis, dan personal lewat jaringan serat optik Internet.',
    scale: 'Layanan Global',
  },
  {
    id: 'supercomputer',
    name: 'Supercomputer',
    form: 'High-End Multi-Unit Terpisah',
    role: 'Perhitungan numerik skala raksasa seperti prakiraan cuaca global serta desain dan simulasi pesawat terbang.',
    scale: 'Komputasi Ekstrem',
  },
];

export const FUNCTIONAL_UNITS_M1 = [
  {
    id: 'input',
    label: 'Unit Input',
    speedTier: 'Elektromekanik / I/O',
    role: 'Menerima informasi terkode dari operator manusia (keyboard, mouse, joystick, mikrofon) atau komputer lain via komunikasi digital.',
    keyFact: 'Menyampaikan instruksi program & data mentah ke memori atau prosesor.',
  },
  {
    id: 'memory',
    label: 'Unit Memori',
    speedTier: 'Elektronik (ns) + Sekunder',
    role: 'Menyimpan program & data dalam unit word (16–64 bit) beralamat berurutan. Terbagi menjadi Memori Primer (Cache & RAM utama) serta Penyimpanan Sekunder (HDD/CD-ROM).',
    keyFact: 'Waktu akses RAM modern berkisar beberapa nanosecond hingga ~100 ns dan tetap di tiap lokasi alamat.',
  },
  {
    id: 'alu',
    label: 'Unit Aritmatika & Logika (ALU)',
    speedTier: 'Elektronik Tercepat (Register)',
    role: 'Mengeksekusi operasi tambah, kali, bagi, dan perbandingan bilangan. Operand ditampung sementara di Register internal prosesor.',
    keyFact: 'Waktu akses Register LEBIH CEPAT daripada Cache tercepat sekalipun!',
  },
  {
    id: 'output',
    label: 'Unit Output',
    speedTier: 'Elektromekanik / Display',
    role: 'Mengirimkan hasil komputasi ke dunia luar (printer impact/inkjet/laser, display grafik). Display grafik juga bisa berperan ganda sebagai I/O.',
    keyFact: 'Kecepatan cetak mekanik tetap jauh lebih lambat dibanding kecepatan elektron prosesor.',
  },
  {
    id: 'control',
    label: 'Unit Kontrol',
    speedTier: 'Pusat Saraf Timing',
    role: 'Mengkoordinasikan seluruh kerja Input, Memori, ALU, dan Output dengan membangkitkan sinyal timing & sinkronisasi melalui jalur kontrol.',
    keyFact: 'Menentukan kapan tepatnya tiap transfer data atau eksekusi instruksi berlangsung.',
  },
];

export const OS_TIMELINE_M1 = [
  {
    slot: 't0 → t1',
    actor: 'Rutin OS + Disk',
    activity: 'OS menginisiasi loading program aplikasi dari disk ke memori utama, lalu menyerahkan kendali eksekusi.',
    multiBenefit: 'Dalam mode Multiprogramming, printer dapat mencetak hasil program sebelumnya secara bersamaan!',
  },
  {
    slot: 't1 → t2',
    actor: 'Program User (CPU Aktif)',
    activity: 'Prosesor mengeksekusi instruksi program aplikasi hingga titik di mana file data dari disk dibutuhkan.',
    multiBenefit: 'Periode ini dihitung sebagai bagian dari Waktu Prosesor aktif.',
  },
  {
    slot: 't2 → t3',
    actor: 'Rutin OS + Disk',
    activity: 'Program meminta OS mentransfer file data dari disk ke memori; selesai transfer, kendali dikembalikan ke program.',
    multiBenefit: 'CPU dapat mengalihkan fokus ke program lain selama menunggu transfer mekanik disk.',
  },
  {
    slot: 't3 → t4',
    actor: 'Program User (CPU Aktif)',
    activity: 'Program melakukan komputasi inti terhadap data sampai hasil siap dikirim untuk dicetak.',
    multiBenefit: 'Cache pada chip mempercepat eksekusi loop instruksi & data yang berulang.',
  },
  {
    slot: 't4 → t5',
    actor: 'Rutin OS + Printer',
    activity: 'Program meminta OS menjalankan printer untuk mencetak hasil akhir. Total t5 − t0 disebut Elapsed Time.',
    multiBenefit: 'Saat printer sibuk mencetak, OS langsung me-load program aplikasi berikutnya dari disk!',
  },
];

export const RISC_VS_CISC_DATA = [
  {
    aspect: 'Kompleksitas Instruksi',
    risc: 'Instruksi sederhana dengan langkah dasar sedikit per instruksi.',
    cisc: 'Instruksi kompleks yang mencakup banyak langkah dasar sekaligus.',
  },
  {
    aspect: 'Dampak pada Parameter N & S',
    risc: 'Nilai N cenderung lebih besar, namun nilai S kecil dan seragam.',
    cisc: 'Nilai N lebih rendah (lebih sedikit instruksi), namun nilai S lebih besar.',
  },
  {
    aspect: 'Kemudahan Pipelining',
    risc: 'Jauh lebih mudah diimplementasikan ke dalam eksekusi pipeline yang efisien (S efektif mendekati 1).',
    cisc: 'Lebih sulit ditumpangtindihkan secara merata karena variasi panjang langkah tiap instruksi.',
  },
  {
    aspect: 'Prinsip Desain Modern',
    risc: 'Mengutamakan kesederhanaan set instruksi & optimasi compiler (Reduced Instruction Set).',
    cisc: 'Prosesor modern memadukan banyak pertukaran desain antara prinsip RISC dan CISC.',
  },
];

export const PARALLEL_ARCH_DATA = {
  multiprocessor: {
    title: 'Multiprosesor (Shared-Memory)',
    tagline: 'Banyak Prosesor · Satu Ruang Memori Bersama',
    mechanism:
      'Sejumlah unit prosesor bekerja paralel menyelesaikan banyak tugas atau memecah sub-tugas besar, dan semua prosesor memiliki akses langsung ke seluruh memori sistem.',
    strength: 'Komunikasi antar prosesor sangat cepat melalui ruang memori bersama.',
    tradeoff: 'Kompleksitas tinggi dan biaya mahal karena membutuhkan jaringan interkoneksi yang rumit.',
  },
  multicomputer: {
    title: 'Multikomputer (Message-Passing)',
    tagline: 'Kumpulan Komputer Lengkap · Memori Lokal Mandiri',
    mechanism:
      'Sekelompok komputer utuh yang terinterkoneksi; setiap komputer hanya mengakses memori lokalnya sendiri dan bertukar data dengan mengirim pesan melalui jaringan komunikasi.',
    strength: 'Lebih mudah diskalakan dan biaya interkoneksi memori global jauh lebih rendah.',
    tradeoff: 'Pertukaran data antar node bergantung pada latensi pengiriman pesan jaringan.',
  },
};

export interface HistoryPioneerItem {
  id: string;
  category: 'Manual' | 'Mekanik' | 'Mekanik Elektronik' | 'Elektronik';
  year: string;
  name: string;
  inventor: string;
  keyInnovation: string;
  examNote: string;
}

export const HISTORY_PIONEERS_M6: HistoryPioneerItem[] = [
  {
    id: 'p-abacus',
    category: 'Manual',
    year: '~5000 Thn Lalu',
    name: 'Abacus',
    inventor: 'Peradaban Asia Kecil',
    keyInnovation: 'Alat hitung manual tertua menggunakan biji-bijian geser di atas rak untuk transaksi perdagangan.',
    examNote: 'Dianggap awal mula mesin komputasi; populer sebelum pensil & kertas menyebar di Eropa.',
  },
  {
    id: 'p-pascaline',
    category: 'Mekanik',
    year: '1642',
    name: 'Pascaline',
    inventor: 'Blaise Pascal (usia 18 tahun)',
    keyInnovation: 'Kotak persegi kuningan dengan 8 roda putar bergerigi berbasis sepuluh untuk membantu ayahnya menghitung pajak.',
    examNote: 'Kelemahan utama: HANYA terbatas untuk operasi penjumlahan!',
  },
  {
    id: 'p-leibniz',
    category: 'Mekanik',
    year: '1694',
    name: 'Penyempurnaan Pascaline',
    inventor: 'Gottfried Wilhelm von Leibniz',
    keyInnovation: 'Mempelajari gambar rancangan Pascal lalu mengembangkan mesin roda gerigi yang mampu melakukan perkalian.',
    examNote: 'Matematikawan & filsuf Jerman yang melampaui batas penjumlahan Pascaline.',
  },
  {
    id: 'p-arithometer',
    category: 'Mekanik',
    year: 'Abad 19',
    name: 'Kalkulator Mekanik (Arithometer)',
    inventor: 'Charles Xavier Thomas de Colmar',
    keyInnovation: 'Mesin kalkulasi mekanik praktis yang sanggup mengerjakan 4 fungsi aritmatika dasar (+, −, ×, ÷).',
    examNote: 'Sering ditanyakan sebagai pembeda dari Pascaline yang hanya bisa menjumlah.',
  },
  {
    id: 'p-babbage',
    category: 'Mekanik Elektronik',
    year: '1822 & 1830-an',
    name: 'Difference Engine & Analytical Engine',
    inventor: 'Charles Babbage & Augusta Ada King',
    keyInnovation:
      'Mesin uap persamaan diferensial (1822) lalu Analytical Engine (50.000 komponen, kartu perforasi) sebagai konsep komputer general-purpose pertama.',
    examNote:
      'Augusta Ada King (Ada Lovelace) adalah programmer wanita pertama; diabadikan menjadi bahasa ADA oleh Dept. Pertahanan AS (1980).',
  },
  {
    id: 'p-hollerith',
    category: 'Mekanik Elektronik',
    year: '1889',
    name: 'Mesin Tabulasi Kartu Perforasi',
    inventor: 'Herman Hollerith',
    keyInnovation:
      'Kartu berlubang penyimpan 80 variabel yang memangkas Sensus AS (estimasi 7–10 tahun) menjadi hanya 6 minggu!',
    examNote: 'Mendirikan Tabulating Machine Company (1896) yang berkembang menjadi IBM pada 1924.',
  },
  {
    id: 'p-bush',
    category: 'Mekanik Elektronik',
    year: '1931',
    name: 'Kalkulator Persamaan Diferensial',
    inventor: 'Vannevar Bush',
    keyInnovation: 'Mesin besar & berat berisikan ratusan gerigi dan poros untuk menyelesaikan persamaan diferensial kompleks.',
    examNote: 'Digunakan kalangan akademisi sebelum peralihan penuh ke sirkuit elektronik.',
  },
  {
    id: 'p-abc',
    category: 'Elektronik',
    year: '1940',
    name: 'Komputer Elektrik Boolean Pertama',
    inventor: 'John V. Atanasoff & Clifford Berry',
    keyInnovation: 'Menerapkan aljabar Boolean biner George Boole (benar-salah → terhubung-terputus) pada sirkuit listrik.',
    examNote: 'Proyek komputer elektrik pertama tahun 1940 meski terhenti karena kendala pendanaan.',
  },
];

export const FIVE_GENERATIONS_M6 = [
  {
    gen: 1,
    yearsPdf: '1946–1959',
    coreTech: 'Tabung Vakum (Vacuum Tube)',
    machines: 'Colossus (1943), Mark I (Harvard-IBM), ENIAC, EDVAC (1945), UNIVAC I (1951)',
    traits: [
      'Menggunakan tabung vakum sehingga ukuran sangat besar (ENIAC: 18.000 tabung vakum, 70.000 resistor, 160 kW).',
      'Penyimpanan data memakai silinder magnetik.',
      'Instruksi dibuat spesifik per tugas memakai bahasa mesin (kode biner berbeda tiap komputer).',
      'EDVAC memperkenalkan arsitektur John von Neumann (memori penampung program+data & CPU sentral); UNIVAC I jadi komputer komersial pertama.',
    ],
    modernNote: 'Pondasi arsitektur Von Neumann dari EDVAC masih menjadi dasar komputer modern hingga kini.',
  },
  {
    gen: 2,
    yearsPdf: '1959–1964',
    coreTech: 'Transistor',
    machines: 'Stretch (IBM), LARC (Sperry-Rand), IBM 1401',
    traits: [
      'Menggantikan tabung vakum dengan transistor sehingga ukuran jauh lebih kecil dan hemat energi.',
      'Pengembangan memori inti-magnetik meningkatkan keandalan dan kecepatan.',
      'Bahasa mesin digantikan Bahasa Assembly (kode singkatan).',
      'Muncul bahasa pemrograman tingkat tinggi COBOL dan FORTRAN serta industri piranti lunak.',
    ],
    modernNote: 'IBM 1401 menjadi standar bisnis keuangan pertengahan 1960-an dan memicu lahirnya profesi programmer & analyst.',
  },
  {
    gen: 3,
    yearsPdf: '1964–1970',
    coreTech: 'Integrated Circuit (IC)',
    machines: 'Komputer berbasis semikonduktor IC & Sistem Operasi',
    traits: [
      'Penggunaan IC (dikembangkan Jack Kilby di Texas Instrument 1958) memadatkan komponen dalam piringan silikon dari pasir kuarsa.',
      'Mengatasi masalah panas berlebih pada transistor dan memperkecil ukuran komputer secara drastis.',
      'Ditemukannya Sistem Operasi (OS) yang memungkinkan beberapa program berbeda berjalan serentak.',
    ],
    modernNote: 'Integrasi semikonduktor pada satu chip silikon menjadi awal hukum penyusutan ukuran komputer modern.',
  },
  {
    gen: 4,
    yearsPdf: '1979–sekarang (versi PDF)',
    coreTech: 'LSI, VLSI, ULSI & Mikroprosesor',
    machines: 'Chip Intel 4004 (1971), Minikomputer, IBM PC (1981), Apple Macintosh, Intel 486–Pentium IV & AMD K6/Athlon',
    traits: [
      'Pemadatan sirkuit: LSI (ratusan), VLSI (ribuan), hingga ULSI (jutaan komponen dalam satu keping chip).',
      'Intel 4004 (1971) menyatukan CPU, memori, dan kontrol I/O dalam satu chip mikroprosesor.',
      'IBM PC (1981) memicu lonjakan PC rumah/kantor; Apple Macintosh mempopulerkan GUI & mouse; hadir jaringan LAN.',
    ],
    modernNote: 'Catatan Modern: Evolusi mikroprosesor berlanjut ke era CPU multi-core (Core i-series, Ryzen) dan SoC smartphone berarsitektur nanometer.',
  },
  {
    gen: 5,
    yearsPdf: 'Masa Kini / Masa Depan',
    coreTech: 'AI, Pemrosesan Paralel & Superkonduktor',
    machines: 'Imajinasi HAL9000 (Arthur C. Clarke) & Proyek ICOT Jepang',
    traits: [
      'Adanya kecerdasan buatan (Artificial Intelligence) yang meniru nalar manusia, memahami konteks, lisan, dan belajar sendiri.',
      'Kemampuan pemrosesan paralel yang mengkoordinasikan banyak CPU serempak melampaui batas model Von Neumann tunggal.',
      'Pengembangan teknologi superkonduktor (aliran listrik tanpa hambatan) serta riset lembaga ICOT di Jepang.',
    ],
    modernNote: 'Catatan Modern: Banyak visi Gen 5 kini terwujud nyata lewat AI Generatif, akselerator GPU/NPU paralel, dan riset komputasi kuantum.',
  },
];

export const FOUR_SOFTWARE_ERAS_M6 = [
  {
    era: '1. Era Pioner',
    period: '1950–1960',
    traits: ['Proses batch berurutan', 'Sambungan kabel & Punched Card', 'Distribusi terbatas & pembuatan khusus'],
    summary: 'Perangkat lunak masih menyatu erat dengan perangkat keras (1 program untuk 1 mesin khusus, contoh: ENIAC); hasil berupa print-out.',
  },
  {
    era: '2. Era Stabil',
    period: '1960–1980',
    traits: ['Multi-user & Multitasking', 'Pemrosesan Real-time', 'Sistem Basis Data (Database) & Produk Software'],
    summary: 'Perusahaan software mulai bermunculan; perangkat lunak menjadi produk terpisah yang memisahkan program pemroses dengan data.',
  },
  {
    era: '3. Era Mikro',
    period: '1980–1990',
    traits: ['Sistem tersebar (PC & LAN)', 'Software Sistem vs Aplikasi', 'Perangkat lunak murah & awal penanaman kecerdasan'],
    summary: 'Sejalan dengan meluasnya PC perorangan, software terbagi jelas antara pengelola internal (sistem) dan kebutuhan pengguna (aplikasi).',
  },
  {
    era: '4. Era Modern',
    period: '1990–2000+',
    traits: ['Sistem desktop & Teknologi objek', 'Sistem pakar & Pemrosesan paralel', 'Embedded software (HP/TV/AC) & pengenalan suara/gambar'],
    summary: 'Software tertanam di mana-mana (bukan hanya komputer), dikembangkan tim multidisiplin, saling terhubung, dan makin cerdas.',
  },
];

export const EXPERT_DEFINITIONS_M6 = [
  {
    expert: 'Hamacher',
    focus: 'Mesin Elektronik + Stored Program',
    definition:
      'Mesin penghitung elektronik yang cepat dan dapat menerima informasi input digital, memprosesnya sesuai program tersimpan di memori, dan menghasilkan output berupa informasi.',
  },
  {
    expert: 'Blissmer',
    focus: '4 Tugas Utama Komputer',
    definition:
      'Alat elektronik yang mampu: (1) menerima input, (2) memproses input sesuai programnya, (3) menyimpan perintah & hasil pengolahan, dan (4) menyediakan output berupa informasi.',
  },
  {
    expert: 'Fuori',
    focus: 'Kecepatan & Otomasi Tanpa Campur Tangan',
    definition:
      'Suatu pemroses data yang dapat melakukan perhitungan besar secara cepat, termasuk perhitungan aritmetika dan operasi logika, tanpa campur tangan manusia.',
  },
];

export const SYSTEM_ELEMENTS_M6 = [
  {
    id: 'hardware',
    name: 'Hardware (Perangkat Keras)',
    role: 'Peralatan yang secara fisik terlihat dan dapat dijamah (CPU, RAM, monitor, keyboard, storage).',
    dependency: 'Tidak akan berfungsi apa pun tanpa instruksi dari Software.',
  },
  {
    id: 'software',
    name: 'Software (Perangkat Lunak)',
    role: 'Program yang berisi rangkaian instruksi/perintah untuk melakukan pengolahan data.',
    dependency: 'Membutuhkan media fisik Hardware untuk berjalan dan dieksekusi.',
  },
  {
    id: 'brainware',
    name: 'Brainware (Pengguna)',
    role: 'Manusia yang mengoperasikan, merancang, dan mengendalikan seluruh sistem komputer.',
    dependency: 'Tanpa Brainware, kombinasi Hardware dan Software tidak akan memberi manfaat.',
  },
];

export const CLASSIFICATION_DATA_M6 = {
  byData: [
    {
      name: 'Komputer Analog',
      desc: 'Mengolah data KUALITATIF, bekerja secara kontinu dan paralel, biasanya tanpa bahasa perantara.',
      example: 'Alat ukur suhu, kecepatan suara, atau voltase listrik di rumah sakit.',
    },
    {
      name: 'Komputer Digital',
      desc: 'Mengolah data KUANTITATIF (huruf, angka, kombinasi, karakter khusus) dan biasanya memerlukan bahasa perantara.',
      example: 'Personal Computer (PC), laptop, dan server modern.',
    },
    {
      name: 'Komputer Hybrid',
      desc: 'Kombinasi kemampuan komputer analog (kontinu) dan komputer digital (kuantitatif).',
      example: 'Mesin Facsimile (sesuai contoh Modul 6).',
    },
  ],
  byPurpose: [
    {
      name: 'Special Purpose Computer',
      desc: 'Dirancang khusus untuk menyelesaikan satu jenis masalah atau tugas tertentu saja.',
      example: 'Komputer pemecah sandi Colossus, pengontrol mesin pabrik, atau alat diagnosa medis khusus.',
    },
    {
      name: 'General Purpose Computer',
      desc: 'Dirancang serbaguna untuk menjalankan beragam aplikasi dan program sesuai kebutuhan pengguna.',
      example: 'PC rumah/kantor, workstation, dan komputer ENIAC sebagai general-purpose awal.',
    },
  ],
  bySize: [
    {
      name: 'Tower (Menara)',
      desc: 'Relatif besar, diletakkan di samping/bawah meja; memiliki ruang lapang dan banyak expansion slot untuk kartu tambahan.',
    },
    {
      name: 'Desktop (Meja)',
      desc: 'Sedikit lebih kecil dari Tower, diletakkan di atas meja; paling populer karena harga relatif lebih murah.',
    },
    {
      name: 'Portable',
      desc: 'Bagian dirangkai dalam satu kotak untuk pekerjaan lapangan (insinyur/peneliti), namun kurang populer karena masih berat.',
    },
    {
      name: 'Notebook',
      desc: 'Seukuran buku kertas kuarto (8,5 × 11 inci), tebal 1–1,5 inci, berat sekitar 4–6 kg (era modul PDF).',
    },
    {
      name: 'Subnotebook',
      desc: 'Berukuran antara Notebook dan Palmtop; lebih ringkas karena sebagian perangkat (biasanya disk drive) tidak dipasang.',
    },
    {
      name: 'Palmtop (Handheld)',
      desc: 'Sangat kecil hingga dapat digenggam dan cukup memakai baterai AA; kelemahan: layar & keyboard terlalu kecil.',
    },
  ],
};

export interface GenerationQuizItem {
  id: string;
  clue: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const GENERATION_QUIZ_ITEMS_M6: GenerationQuizItem[] = [
  {
    id: 'gq-1',
    clue: 'Memakai 18.000 tabung vakum (160 kW), penyimpanan silinder magnetik, dan bahasa mesin biner.',
    options: ['Generasi 1 (1946–1959)', 'Generasi 2 (1959–1964)', 'Generasi 3 (1964–1970)', 'Generasi 4'],
    correctIndex: 0,
    explanation: 'Tabung vakum, silinder magnetik, ENIAC, dan bahasa mesin biner adalah ciri utama Generasi Pertama.',
  },
  {
    id: 'gq-2',
    clue: 'Transistor menggantikan tabung vakum, muncul bahasa Assembly, COBOL, FORTRAN, dan IBM 1401.',
    options: ['Generasi 1', 'Generasi 2 (1959–1964)', 'Generasi 3 (1964–1970)', 'Generasi 4'],
    correctIndex: 1,
    explanation: 'Generasi Kedua ditandai penggunaan transistor, memori inti-magnetik, Assembly, serta COBOL & FORTRAN.',
  },
  {
    id: 'gq-3',
    clue: 'Jack Kilby menciptakan IC silikon dari pasir kuarsa, dan Sistem Operasi (OS) pertama kali ditemukan.',
    options: ['Generasi 1', 'Generasi 2', 'Generasi 3 (1964–1970)', 'Generasi 5'],
    correctIndex: 2,
    explanation: 'Integrated Circuit (IC) dan ditemukannya Sistem Operasi merupakan ciri khas Generasi Ketiga.',
  },
  {
    id: 'gq-4',
    clue: 'Penggunaan LSI, VLSI, ULSI, chip Mikroprosesor Intel 4004, serta lahirnya IBM PC & Apple Macintosh.',
    options: ['Generasi 2', 'Generasi 3', 'Generasi 4 (VLSI & Mikroprosesor)', 'Generasi 5'],
    correctIndex: 2,
    explanation: 'Generasi Keempat memadatkan jutaan komponen (LSI/VLSI/ULSI) ke mikroprosesor sehingga lahir PC rumahan.',
  },
  {
    id: 'gq-5',
    clue: 'Mengusung kecerdasan buatan (AI), pemrosesan paralel banyak CPU melampaui Von Neumann, dan superkonduktor.',
    options: ['Generasi 3', 'Generasi 4', 'Generasi 5 (AI & Paralel)', 'Era Pioner'],
    correctIndex: 2,
    explanation: 'Generasi Kelima berfokus pada AI (contoh imajinatif HAL9000), pemrosesan paralel, superkonduktor, dan proyek ICOT Jepang.',
  },
];
