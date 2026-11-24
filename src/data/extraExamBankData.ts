import type { AbcQuestion, EssayQuestion, GlossaryItem } from '../types/rigbench';

// =========================================================================
// ESSAY ANALISIS KONSEPTUAL (RUBRIK LOKAL — TANPA SOAL HITUNGAN RUMUS)
// =========================================================================

export const EXTRA_ESSAY_QUESTIONS: EssayQuestion[] = [
  {
    id: 'essay-arch-1',
    type: 'essay',
    clusterId: 'arch-1',
    topicTag: 'Unit Fungsional & Register Buffer',
    caseContext:
      'Pada komputer berstruktur Bus Tunggal, prosesor bekerja pada kecepatan elektronik, sedangkan printer karakter bekerja secara elektromekanik yang jauh lebih lambat.',
    prompt:
      'Sebutkan 5 unit fungsional dasar komputer beserta peran singkatnya, lalu jelaskan mengapa Register Buffer sangat dibutuhkan pada perangkat I/O seperti printer agar performa prosesor tidak terhambat!',
    rubric: [
      {
        id: 'r-a1-units',
        label: 'Menyebutkan 5 unit fungsional: Input, Memori, ALU, Output, dan Unit Kontrol',
        weight: 35,
        conceptGroups: [
          ['input'],
          ['memori', 'memory', 'ram'],
          ['alu', 'aritmatika', 'logika'],
          ['output'],
          ['kontrol', 'control'],
        ],
        minGroupHits: 4,
      },
      {
        id: 'r-a1-bus',
        label: 'Memahami struktur Bus Tunggal (hanya 1 transfer/2 unit aktif pada satu waktu; jalur data, alamat, kontrol)',
        weight: 25,
        conceptGroups: [
          ['bus tunggal', 'bus', 'jalur'],
          ['satu transfer', 'dua unit', 'data', 'alamat', 'kontrol', 'paralel'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-a1-buffer',
        label: 'Register Buffer menyimpan data secara elektronik cepat sehingga CPU & Bus langsung bebas mengerjakan tugas lain sementara printer mencetak',
        weight: 40,
        conceptGroups: [
          ['buffer', 'register buffer'],
          ['elektronik', 'sementara', 'menampung', 'timing', 'perbedaan kecepatan'],
          ['bebas', 'tidak terhalang', 'aktifitas lain', 'tugas lain', 'printer mencetak'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Lima unit fungsional dasar komputer adalah: (1) Unit Input menerima instruksi dan data terkode, (2) Unit Memori menyimpan program dan data, (3) ALU (Unit Aritmatika dan Logika) mengeksekusi perhitungan dibantu Register, (4) Unit Output mengirim hasil ke luar, dan (5) Unit Kontrol sebagai pusat saraf yang mengkoordinasikan sinyal timing. Pada struktur Bus Tunggal yang hanya melayani satu transfer pada satu waktu, perbedaan kecepatan antara prosesor elektronik dan printer elektromekanik diatasi dengan Register Buffer. Data ditransfer sangat cepat ke Register Buffer elektronik milik printer; begitu selesai dimuat, bus dan prosesor langsung bebas menjalankan tugas lain sementara printer terus mencetak karakter dari isi buffernya tanpa membebani CPU.',
    examTip: 'Pastikan selalu jelaskan alur "transfer cepat ke Buffer → CPU & Bus langsung bebas → printer mencetak mandiri".',
  },
  {
    id: 'essay-arch-2',
    type: 'essay',
    clusterId: 'arch-2',
    topicTag: 'Performa Prosesor, Pipelining & SPEC',
    caseContext:
      'Sebuah iklan memasarkan prosesor A berkecepatan clock 900 MHz sebagai pasti lebih kencang daripada prosesor B berkecepatan 700 MHz.',
    prompt:
      'Berdasarkan konsep persamaan performa dasar T = (N × S) / R, jelaskan mengapa klaim tersebut belum tentu benar! Jelaskan pula bagaimana teknik Pipelining, Superscalar, arsitektur RISC/CISC, serta Benchmark SPEC berperan dalam kinerja prosesor.',
    rubric: [
      {
        id: 'r-a2-nsr',
        label: 'Menjelaskan N, S, dan R saling terkait; clock 900 MHz belum tentu lebih cepat jika nilai S atau N berbeda',
        weight: 30,
        conceptGroups: [
          ['900', '700', 'clock', 'frekuensi', 'belum tentu'],
          ['nilai s', 'parameter', 'siklus', 'instruksi', 'waktu eksekusi', 'saling'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-a2-pipe',
        label: 'Pipelining menumpangtindihkan instruksi (S efektif ≈ 1) dan Superscalar memakai banyak pipeline paralel (S efektif < 1)',
        weight: 30,
        conceptGroups: [
          ['pipelining', 'pipeline', 'tumpang tindih', 'menumpangtindihkan'],
          ['superscalar', 'paralel', 'kurang dari satu', 'mendekati 1', 'banyak pipeline'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-a2-risccisc',
        label: 'Membedakan RISC (instruksi sederhana, ramah pipeline) vs CISC (instruksi kompleks)',
        weight: 20,
        conceptGroups: [
          ['risc', 'sederhana'],
          ['cisc', 'kompleks'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-a2-spec',
        label: 'Benchmark SPEC mengukur waktu eksekusi program aplikasi riil terstandarisasi dibanding komputer referensi',
        weight: 20,
        conceptGroups: [
          ['spec', 'benchmark'],
          ['aplikasi riil', 'program riil', 'referensi', 'nyata', 'bukan sintetik'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Klaim tersebut belum tentu benar karena waktu eksekusi program T dipengaruhi gabungan tiga parameter yang saling terkait: jumlah eksekusi instruksi (N), rata-rata langkah dasar per instruksi (S), dan clock rate (R). Prosesor 700 MHz dapat mengalahkan 900 MHz apabila memiliki nilai S yang jauh lebih kecil. Nilai S ditekan melalui Pipelining (menumpangtindihkan eksekusi instruksi berurutan sehingga S efektif mendekati 1) dan Superscalar (membuka banyak jalur pipeline paralel sehingga S efektif kurang dari 1). Set instruksi RISC yang sederhana lebih mudah di-pipeline dibandingkan CISC yang kompleks. Karena parameter tunggal tidak handal, performa diukur memakai benchmark SPEC yang menjalankan kumpulan program aplikasi riil terhadap komputer referensi.',
    examTip: 'Tekankan bahwa parameter performa sejati bagi pengguna adalah waktu eksekusi total T, bukan sekadar angka MHz/GHz di iklan.',
  },
  {
    id: 'essay-arch-3',
    type: 'essay',
    clusterId: 'arch-3',
    topicTag: 'Multiprosesor vs Multikomputer',
    prompt:
      'Jelaskan perbedaan arsitektur, cara akses memori, mekanisme komunikasi data, serta pertimbangan biaya antara Sistem Multiprosesor (Shared-Memory) dan Sistem Multikomputer (Message-Passing)!',
    rubric: [
      {
        id: 'r-a3-mp',
        label: 'Multiprosesor: banyak unit prosesor dalam satu sistem yang mengeksekusi tugas paralel dan berbagi akses ke seluruh memori (shared-memory)',
        weight: 35,
        conceptGroups: [
          ['multiprosesor', 'shared-memory', 'shared memory'],
          ['berbagi memori', 'semua memori', 'memori bersama', 'akses memori'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-a3-mp-cost',
        label: 'Multiprosesor memiliki kompleksitas & biaya tinggi karena membutuhkan jaringan interkoneksi yang rumit',
        weight: 20,
        conceptGroups: [
          ['interkoneksi', 'kompleks', 'biaya', 'mahal'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-a3-mc',
        label: 'Multikomputer: kelompok komputer lengkap yang tiap unit hanya mengakses memori lokalnya sendiri',
        weight: 25,
        conceptGroups: [
          ['multikomputer', 'komputer lengkap', 'klaster'],
          ['memori sendiri', 'memori lokal', 'masing-masing'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-a3-msg',
        label: 'Komunikasi pada Multikomputer dilakukan dengan mengirimkan pesan melalui jaringan komunikasi (message-passing)',
        weight: 20,
        conceptGroups: [
          ['message-passing', 'message passing', 'mengirim pesan', 'kirim pesan'],
          ['jaringan komunikasi', 'jaringan'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Sistem Multiprosesor (Shared-Memory) berisi sejumlah unit prosesor yang bekerja paralel di mana seluruh prosesor memiliki akses langsung ke semua ruang memori dalam sistem. Performa tingginya diiringi peningkatan kompleksitas dan biaya karena memerlukan jaringan interkoneksi memori yang rumit. Sebaliknya, Sistem Multikomputer (Message-Passing) tersusun atas sekelompok komputer lengkap yang terinterkoneksi, di mana setiap komputer hanya mengakses memori lokalnya sendiri. Ketika tugas membutuhkan pertukaran data antar komputer, komunikasi dilakukan dengan mengirimkan pesan melalui jaringan komunikasi.',
    examTip: 'Gunakan pasangan istilah persis Modul 1: "multiprosesor shared-memory" vs "multikomputer message-passing".',
  },
  {
    id: 'essay-hist-1',
    type: 'essay',
    clusterId: 'hist-1',
    topicTag: 'Evolusi Alat Hitung Pra-Elektronik',
    prompt:
      'Jelaskan 4 golongan alat pengolah data menurut sejarah komputer, lalu uraikan kontribusi kunci Blaise Pascal, Charles Babbage & Augusta Ada King, serta Herman Hollerith menuju lahirnya komputer modern!',
    rubric: [
      {
        id: 'r-h1-4gol',
        label: 'Menyebutkan 4 golongan: Manual, Mekanik, Mekanik Elektronik, dan Elektronik',
        weight: 25,
        conceptGroups: [
          ['manual'],
          ['mekanik'],
          ['mekanik elektronik', 'motor elektronik', 'uap'],
          ['elektronik'],
        ],
        minGroupHits: 3,
      },
      {
        id: 'r-h1-pascal',
        label: 'Blaise Pascal (1642): menciptakan Pascaline beroda gerigi kuningan untuk pajak (terbatas penjumlahan)',
        weight: 20,
        conceptGroups: [
          ['pascal', 'pascaline'],
          ['roda', 'gerigi', 'penjumlahan', 'pajak', '1642'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-h1-babbage',
        label: 'Charles Babbage (Difference & Analytical Engine general-purpose + kartu perforasi) & Augusta Ada King (programmer wanita pertama, bahasa ADA)',
        weight: 30,
        conceptGroups: [
          ['babbage', 'analytical engine', 'differensial'],
          ['ada', 'augusta', 'programmer wanita', 'kartu perforasi', 'general'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-h1-hollerith',
        label: 'Herman Hollerith (1889): kartu perforasi 80 variabel mempercepat Sensus AS jadi 6 minggu & mendirikan cikal bakal IBM',
        weight: 25,
        conceptGroups: [
          ['hollerith', 'kartu perforasi'],
          ['sensus', '6 minggu', 'enam minggu', 'ibm', '80 variabel'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Empat golongan alat pengolah data adalah: (1) Peralatan Manual (tenaga tangan, misal Abacus), (2) Peralatan Mekanik (digerakkan tangan), (3) Peralatan Mekanik Elektronik (digerakkan otomatis motor/uap), dan (4) Peralatan Elektronik penuh. Blaise Pascal (1642) menciptakan Pascaline dengan 8 roda gerigi kuningan meski terbatas hanya penjumlahan. Charles Babbage merancang Mesin Differensial (1822) dan Analytical Engine (komputer general-purpose pertama berkonsep kartu perforasi), dibantu Augusta Ada King yang diakui sebagai programmer wanita pertama (namanya menjadi bahasa pemrograman ADA). Herman Hollerith (1889) menerapkan kartu perforasi (80 variabel) sehingga Sensus AS selesai dalam 6 minggu dan mendirikan perusahaan yang berkembang menjadi IBM (1924).',
    examTip: 'Selalu sebutkan kelemahan Pascaline (hanya penjumlahan) dan peran Ada Lovelace (programmer wanita pertama) untuk skor maksimal.',
  },
  {
    id: 'essay-hist-2',
    type: 'essay',
    clusterId: 'hist-2',
    topicTag: '5 Generasi Hardware Komputer',
    prompt:
      'Uraikan perbedaan teknologi inti, ciri khas, dan contoh mesin atau pencapaian penting pada Komputer Generasi Pertama hingga Generasi Kelima!',
    rubric: [
      {
        id: 'r-h2-g12',
        label: 'Gen 1 (Tabung Vakum, ENIAC/EDVAC Von Neumann/UNIVAC, bahasa mesin) & Gen 2 (Transistor, Assembly, COBOL/FORTRAN, IBM 1401)',
        weight: 40,
        conceptGroups: [
          ['tabung vakum', 'vacuum tube', 'tube vakum'],
          ['eniac', 'edvac', 'univac', 'von neumann', 'bahasa mesin'],
          ['transistor'],
          ['assembly', 'cobol', 'fortran', 'ibm 1401'],
        ],
        minGroupHits: 3,
      },
      {
        id: 'r-h2-g3',
        label: 'Gen 3: Penggunaan IC (Integrated Circuit, Jack Kilby), ukuran lebih kecil, dan ditemukannya Sistem Operasi (OS)',
        weight: 20,
        conceptGroups: [
          ['ic', 'integrated circuit', 'sirkuit terintegrasi', 'jack kilby'],
          ['sistem operasi', 'operating system', 'lebih kecil'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-h2-g4',
        label: 'Gen 4: LSI/VLSI/ULSI & Mikroprosesor (Intel 4004, IBM PC, Apple Macintosh)',
        weight: 20,
        conceptGroups: [
          ['lsi', 'vlsi', 'ulsi', 'mikroprosesor', 'intel 4004'],
          ['pc', 'ibm pc', 'macintosh', 'chip'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-h2-g5',
        label: 'Gen 5: Kecerdasan Buatan (AI), pemrosesan paralel banyak CPU, dan teknologi superkonduktor',
        weight: 20,
        conceptGroups: [
          ['kecerdasan buatan', 'ai', 'artificial intelligence', 'hal9000'],
          ['paralel', 'serempak', 'superkonduktor', 'icot'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Generasi 1 (1946–1959) memakai tabung vakum, silinder magnetik, dan bahasa mesin (contoh: ENIAC, EDVAC berarsitektur Von Neumann, UNIVAC I). Generasi 2 (1959–1964) beralih ke transistor dan memori inti-magnetik sehingga lebih kecil & hemat daya, memakai Assembly serta muncul COBOL & FORTRAN (contoh: IBM 1401). Generasi 3 (1964–1970) menggunakan IC silikon (Jack Kilby) sehingga panas berkurang & ukuran mengecil, sekaligus ditemukannya Sistem Operasi. Generasi 4 (1979–sekarang sesuai modul) memakai LSI/VLSI/ULSI dan mikroprosesor (Intel 4004) yang melahirkan IBM PC (1981) dan Apple Macintosh (GUI & mouse). Generasi 5 bercirikan kecerdasan buatan (AI), pemrosesan paralel banyak CPU melampaui Von Neumann, dan teknologi superkonduktor.',
    examTip: 'Pastikan kelima kata kunci inti hadir berurutan: Tabung Vakum → Transistor → IC (+OS) → VLSI/Mikroprosesor → AI & Paralel.',
  },
  {
    id: 'essay-hist-3',
    type: 'essay',
    clusterId: 'hist-3',
    topicTag: '3 Elemen Sistem, Klasifikasi & 4 Era Software',
    prompt:
      'Jelaskan hubungan 3 elemen Sistem Komputer (Hardware, Software, Brainware), bedakan Komputer Analog, Digital, dan Hybrid beserta contohnya, lalu ringkas perkembangan 4 Era Software (Pioner hingga Modern)!',
    rubric: [
      {
        id: 'r-h3-elements',
        label: 'Menjelaskan 3 elemen sistem komputer (Hardware fisik, Software program, Brainware manusia) yang saling bergantung',
        weight: 30,
        conceptGroups: [
          ['hardware', 'perangkat keras'],
          ['software', 'perangkat lunak'],
          ['brainware', 'manusia'],
        ],
        minGroupHits: 3,
      },
      {
        id: 'r-h3-adh',
        label: 'Membedakan Analog (kualitatif/kontinu), Digital (kuantitatif/PC), dan Hybrid (kombinasi, misal Facsimile)',
        weight: 35,
        conceptGroups: [
          ['analog', 'kualitatif', 'kontinu'],
          ['digital', 'kuantitatif'],
          ['hybrid', 'kombinasi', 'facsimile'],
        ],
        minGroupHits: 3,
      },
      {
        id: 'r-h3-eras',
        label: 'Menyebutkan ciri 4 Era Software: Pioner (batch/punched card), Stabil (multi-user/real-time/database), Mikro (PC/sistem vs aplikasi), Modern (objek/embedded/pakar)',
        weight: 35,
        conceptGroups: [
          ['pioner', 'batch', 'punched card'],
          ['stabil', 'multi user', 'multitasking', 'real time', 'basis data', 'database'],
          ['mikro', 'sistem tersebar', 'perorangan', 'aplikasi'],
          ['modern', 'objek', 'sistem pakar', 'tertanam', 'suara'],
        ],
        minGroupHits: 3,
      },
    ],
    idealAnswer:
      'Sistem komputer terdiri dari tiga elemen tak terpisahkan: Hardware (perangkat keras fisik), Software (program berisi instruksi pengolah data), dan Brainware (manusia operator/pengendali); hardware tidak berfungsi tanpa software, dan keduanya tidak bermanfaat tanpa brainware. Berdasarkan data yang diolah: Komputer Analog mengolah data kualitatif secara kontinu (contoh alat ukur suhu/voltase rumah sakit), Komputer Digital mengolah data kuantitatif seperti huruf/angka (contoh PC), dan Komputer Hybrid memadukan keduanya (contoh Facsimile). Perkembangan software terdiri dari 4 era: (1) Era Pioner (sambungan kabel/punched card, proses batch), (2) Era Stabil (produk software, multitasking, multi-user, real-time, database), (3) Era Mikro (PC & jaringan, pemisahan software sistem vs aplikasi), dan (4) Era Modern (teknologi objek, sistem pakar, software tertanam di HP/TV/AC, pengenalan suara/gambar).',
    examTip: 'Jangan tertukar: Analog = kualitatif kontinu, Digital = kuantitatif!',
  },
];

// =========================================================================
// PILIHAN GANDA KONSEPTUAL (TANPA SOAL HITUNGAN RUMUS)
// =========================================================================

export const EXTRA_ABC_QUESTIONS: AbcQuestion[] = [
  // --- ARCH 1 ---
  {
    id: 'abc-arch-01',
    type: 'abc',
    clusterId: 'arch-1',
    topicTag: 'Tipe Komputer',
    prompt:
      'Tipe komputer dengan dimensi seukuran desktop tetapi memiliki kemampuan I/O grafis resolusi tinggi dan daya komputasi jauh lebih besar untuk aplikasi engineering serta desain interaktif adalah...',
    options: [
      { key: 'A', text: 'Notebook Portable' },
      { key: 'B', text: 'Workstation' },
      { key: 'C', text: 'Mainframe Enterprise' },
      { key: 'D', text: 'Palmtop Handheld' },
    ],
    correctKey: 'B',
    explanation:
      'Menurut Modul 1 bagian 1.1, Workstation tetap memakai dimensi desktop namun memiliki grafis resolusi tinggi dan daya komputasi signifikan untuk aplikasi engineering & desain interaktif.',
  },
  {
    id: 'abc-arch-02',
    type: 'abc',
    clusterId: 'arch-1',
    topicTag: 'Hierarki Memori & Register',
    prompt:
      'Manakah pernyataan yang PALING TEPAT mengenai kecepatan akses elemen penyimpanan pada komputer berdasarkan Modul 1?',
    options: [
      { key: 'A', text: 'Cache lebih cepat daripada Register karena berada di luar ALU' },
      { key: 'B', text: 'Memori utama (RAM) lebih cepat daripada Cache karena kapasitasnya lebih besar' },
      { key: 'C', text: 'Register di dalam prosesor memiliki waktu akses lebih cepat daripada unit Cache tercepat' },
      { key: 'D', text: 'Penyimpanan sekunder (CD-ROM/Disk) beroperasi pada kecepatan elektronik yang sama dengan Register' },
    ],
    correctKey: 'C',
    explanation:
      'Modul 1 (1.2.3) menegaskan bahwa operand disimpan di Register internal prosesor yang waktu aksesnya lebih cepat daripada unit Cache tercepat dalam hierarki memori.',
  },
  {
    id: 'abc-arch-03',
    type: 'abc',
    clusterId: 'arch-1',
    topicTag: 'Struktur Bus & Register Buffer',
    prompt:
      'Mengapa peralatan I/O lambat seperti printer karakter dilengkapi dengan Register Buffer pada arsitektur Bus Tunggal?',
    options: [
      { key: 'A', text: 'Agar prosesor cepat dapat segera bebas setelah mengisi buffer tanpa harus menunggu printer selesai mencetak' },
      { key: 'B', text: 'Agar komputer tidak lagi membutuhkan Unit Kontrol maupun sinyal timing' },
      { key: 'C', text: 'Untuk menggantikan fungsi seluruh Memori Utama (RAM) saat eksekusi program' },
      { key: 'D', text: 'Agar beberapa perangkat bisa langsung menulis ke jalur bus secara serentak tanpa kontrol bus' },
    ],
    correctKey: 'A',
    explanation:
      'Register Buffer elektronik memperhalus perbedaan timing antara CPU cepat dan I/O lambat sehingga bus & prosesor segera bebas mengerjakan aktivitas lain.',
  },

  // --- ARCH 2 ---
  {
    id: 'abc-arch-04',
    type: 'abc',
    clusterId: 'arch-2',
    topicTag: 'OS & Multiprogramming',
    prompt:
      'Pola eksekusi konkuren oleh Sistem Operasi yang menumpangtindihkan pencetakan printer dengan pemuatan program aplikasi berikutnya dari disk agar resource komputer optimal disebut...',
    options: [
      { key: 'A', text: 'Message-Passing' },
      { key: 'B', text: 'Multiprogramming / Multitasking' },
      { key: 'C', text: 'Batch Processing Murni' },
      { key: 'D', text: 'Reverse Engineering' },
    ],
    correctKey: 'B',
    explanation:
      'Modul 1 (1.5) mendefinisikan pola eksekusi konkuren beberapa program oleh OS untuk memaksimalkan penggunaan resource sebagai multiprogramming atau multitasking.',
  },
  {
    id: 'abc-arch-05',
    type: 'abc',
    clusterId: 'arch-2',
    topicTag: 'Pipelining & Superscalar',
    prompt:
      'Apa perbedaan utama antara teknik Pipelining dan eksekusi Superscalar terhadap nilai efektif S (siklus per instruksi)?',
    options: [
      { key: 'A', text: 'Pipelining menaikkan S menjadi 2, sedangkan Superscalar menaikkan S menjadi 4' },
      { key: 'B', text: 'Pipelining menumpangtindihkan instruksi sehingga S efektif mendekati 1, sedangkan Superscalar memakai banyak pipeline paralel hingga S efektif bisa kurang dari 1' },
      { key: 'C', text: 'Pipelining hanya bekerja pada memori sekunder, sedangkan Superscalar hanya pada printer' },
      { key: 'D', text: 'Keduanya bertujuan menaikkan jumlah instruksi N agar program berjalan lebih lama' },
    ],
    correctKey: 'B',
    explanation:
      'Pipelining menyelesaikan hingga 1 instruksi per siklus clock (S efektif ≈ 1), sedangkan Superscalar memulai beberapa instruksi tiap siklus clock sehingga S efektif < 1.',
  },
  {
    id: 'abc-arch-06',
    type: 'abc',
    clusterId: 'arch-2',
    topicTag: 'RISC vs CISC & SPEC',
    prompt:
      'Pernyataan yang benar mengenai set instruksi RISC dan pengukuran performa SPEC adalah...',
    options: [
      { key: 'A', text: 'RISC memakai instruksi kompleks sehingga sulit di-pipeline, sedangkan SPEC memakai program artifisial sintetik' },
      { key: 'B', text: 'Prosesor 900 MHz selalu lebih cepat dari 700 MHz tanpa melihat nilai S' },
      { key: 'C', text: 'RISC memakai instruksi sederhana yang lebih mudah di-pipeline, dan SPEC mengukur performa menggunakan kumpulan program aplikasi riil' },
      { key: 'D', text: 'Optimizing compiler hanya menambah jumlah instruksi N agar prosesor lebih sibuk' },
    ],
    correctKey: 'C',
    explanation:
      'Set instruksi sederhana (RISC) memudahkan pipelining yang efisien, dan SPEC dipilih komunitas komputer karena mengukur aplikasi riil (bukan program sintetik).',
  },

  // --- ARCH 3 ---
  {
    id: 'abc-arch-07',
    type: 'abc',
    clusterId: 'arch-3',
    topicTag: 'Multiprosesor Shared-Memory',
    prompt:
      'Sistem komputer paralel dengan banyak unit prosesor yang semuanya dapat mengakses ruang memori bersama dalam satu sistem disebut...',
    options: [
      { key: 'A', text: 'Multikomputer Message-Passing' },
      { key: 'B', text: 'Multiprosesor Shared-Memory' },
      { key: 'C', text: 'Komputer Analog Kontinu' },
      { key: 'D', text: 'Bus Tunggal Buffer' },
    ],
    correctKey: 'B',
    explanation:
      'Pada Multiprosesor Shared-Memory, seluruh prosesor memiliki akses ke semua memori dalam sistem melalui jaringan interkoneksi.',
  },
  {
    id: 'abc-arch-08',
    type: 'abc',
    clusterId: 'arch-3',
    topicTag: 'Multikomputer Message-Passing',
    prompt:
      'Bagaimana cara pertukaran data antar komputer pada sistem Multikomputer (Message-Passing)?',
    options: [
      { key: 'A', text: 'Langsung membaca RAM milik komputer lain lewat satu bus memori bersama' },
      { key: 'B', text: 'Mengirimkan pesan melalui jaringan komunikasi karena tiap komputer hanya mengakses memori lokalnya sendiri' },
      { key: 'C', text: 'Menggunakan kartu perforasi 80 variabel secara manual' },
      { key: 'D', text: 'Mematikan seluruh prosesor lain agar hanya satu CPU yang bekerja' },
    ],
    correctKey: 'B',
    explanation:
      'Setiap node dalam Multikomputer hanya mengakses memori sendiri dan bertukar data melalui pengiriman pesan (message-passing) di jaringan komunikasi.',
  },
  {
    id: 'abc-arch-09',
    type: 'abc',
    clusterId: 'arch-3',
    topicTag: 'Trade-Off Sistem Paralel',
    prompt:
      'Salah satu konsekuensi utama peningkatan performa pada sistem Multiprosesor Shared-Memory adalah...',
    options: [
      { key: 'A', text: 'Hilangnya kebutuhan terhadap Unit Kontrol dan memori' },
      { key: 'B', text: 'Biaya dan kompleksitas meningkat akibat kebutuhan jaringan interkoneksi yang lebih rumit' },
      { key: 'C', text: 'Prosesor hanya boleh mengeksekusi instruksi satu per satu secara serial' },
      { key: 'D', text: 'Komputer tidak dapat menjalankan lebih dari satu aplikasi' },
    ],
    correctKey: 'B',
    explanation:
      'Modul 1 (1.7) menyatakan bahwa performa tinggi Multiprosesor hadir bersama peningkatan kompleksitas dan biaya jaringan interkoneksi.',
  },

  // --- HIST 1 ---
  {
    id: 'abc-hist-01',
    type: 'abc',
    clusterId: 'hist-1',
    topicTag: 'Alat Mekanik Pascaline',
    prompt:
      'Apa kelemahan utama kalkulator roda numerik kuningan Pascaline ciptaan Blaise Pascal pada tahun 1642?',
    options: [
      { key: 'A', text: 'Membutuhkan daya listrik PLN sebesar 160 kW' },
      { key: 'B', text: 'Hanya terbatas untuk melakukan operasi penjumlahan' },
      { key: 'C', text: 'Tidak dapat menghitung bilangan berbasis sepuluh' },
      { key: 'D', text: 'Harus dihubungkan dengan jaringan LAN terlebih dahulu' },
    ],
    correctKey: 'B',
    explanation:
      'Pascaline menggunakan 8 roda putar bergerigi berbasis sepuluh, tetapi kelemahannya hanya terbatas untuk penjumlahan (baru dilengkapi perkalian oleh Leibniz 1694 dan 4 operasi oleh Arithometer Colmar).',
  },
  {
    id: 'abc-hist-02',
    type: 'abc',
    clusterId: 'hist-1',
    topicTag: 'Analytical Engine & Ada Lovelace',
    prompt:
      'Siapakah asisten Charles Babbage pada proyek Analytical Engine yang diakui sebagai programmer wanita pertama dan diabadikan menjadi nama bahasa pemrograman oleh Departemen Pertahanan AS tahun 1980?',
    options: [
      { key: 'A', text: 'Augusta Ada King (Ada Lovelace)' },
      { key: 'B', text: 'Herman Hollerith' },
      { key: 'C', text: 'Jack Kilby' },
      { key: 'D', text: 'Vannevar Bush' },
    ],
    correctKey: 'A',
    explanation:
      'Augusta Ada King membantu menyusun instruksi untuk Analytical Engine sehingga diakui sebagai programmer wanita pertama dan namanya diabadikan sebagai bahasa ADA (1980).',
  },
  {
    id: 'abc-hist-03',
    type: 'abc',
    clusterId: 'hist-1',
    topicTag: 'Kartu Perforasi & Cikal Bakal IBM',
    prompt:
      'Penemu mesin tabulasi kartu perforasi (80 variabel) tahun 1889 yang memangkas waktu Sensus AS menjadi 6 minggu sekaligus pendiri perusahaan cikal bakal IBM adalah...',
    options: [
      { key: 'A', text: 'Gottfried Wilhelm von Leibniz' },
      { key: 'B', text: 'John V. Atanasoff' },
      { key: 'C', text: 'Herman Hollerith' },
      { key: 'D', text: 'Howard H. Aiken' },
    ],
    correctKey: 'C',
    explanation:
      'Herman Hollerith menciptakan mesin kartu perforasi untuk Sensus AS 1890 dan mendirikan Tabulating Machine Company (1896) yang kemudian menjadi IBM (1924).',
  },

  // --- HIST 2 ---
  {
    id: 'abc-hist-04',
    type: 'abc',
    clusterId: 'hist-2',
    topicTag: 'Generasi 1 & Arsitektur Von Neumann',
    prompt:
      'Komputer Generasi Pertama tahun 1945 yang dirancang John von Neumann dengan konsep memori penampung program sekaligus data dan dikendalikan satu CPU sentral adalah...',
    options: [
      { key: 'A', text: 'Colossus' },
      { key: 'B', text: 'EDVAC' },
      { key: 'C', text: 'IBM 1401' },
      { key: 'D', text: 'Intel 4004' },
    ],
    correctKey: 'B',
    explanation:
      'John von Neumann mendesain EDVAC (1945) dengan memori penyimpan program & data serta CPU sentral sebagai koordinator tunggal.',
  },
  {
    id: 'abc-hist-05',
    type: 'abc',
    clusterId: 'hist-2',
    topicTag: 'Generasi 2 & Generasi 3',
    prompt:
      'Penemuan Integrated Circuit (IC) dari piringan silikon pasir kuarsa oleh Jack Kilby serta mulai ditemukannya Sistem Operasi (OS) merupakan ciri utama komputer...',
    options: [
      { key: 'A', text: 'Generasi Pertama (1946–1959)' },
      { key: 'B', text: 'Generasi Kedua (1959–1964)' },
      { key: 'C', text: 'Generasi Ketiga (1964–1970)' },
      { key: 'D', text: 'Generasi Kelima' },
    ],
    correctKey: 'C',
    explanation:
      'Generasi Ketiga (1964–1970) bercirikan penggunaan IC (Jack Kilby), ukuran komputer yang makin kecil, dan ditemukannya Sistem Operasi.',
  },
  {
    id: 'abc-hist-06',
    type: 'abc',
    clusterId: 'hist-2',
    topicTag: 'Generasi 4 & Generasi 5',
    prompt:
      'Manakah pasangan teknologi dan ciri yang TEPAT untuk Komputer Generasi Keempat dan Generasi Kelima?',
    options: [
      { key: 'A', text: 'Gen 4: Tabung Vakum & COBOL · Gen 5: Transistor & Assembly' },
      { key: 'B', text: 'Gen 4: LSI/VLSI/ULSI & Mikroprosesor (Intel 4004) · Gen 5: AI, Pemrosesan Paralel & Superkonduktor' },
      { key: 'C', text: 'Gen 4: Kartu Perforasi Sensus · Gen 5: Silinder Magnetik' },
      { key: 'D', text: 'Gen 4: Relai Elektromagnetik Mark I · Gen 5: Pascaline' },
    ],
    correctKey: 'B',
    explanation:
      'Generasi 4 ditandai LSI/VLSI/ULSI & mikroprosesor (Intel 4004, IBM PC, Macintosh); Generasi 5 ditandai AI, pemrosesan paralel, dan superkonduktor.',
  },

  // --- HIST 3 ---
  {
    id: 'abc-hist-07',
    type: 'abc',
    clusterId: 'hist-3',
    topicTag: 'Klasifikasi Berdasarkan Data',
    prompt:
      'Komputer yang mengolah data KUALITATIF secara kontinu dan paralel (seperti alat pengukur suhu atau voltase listrik di rumah sakit) termasuk golongan...',
    options: [
      { key: 'A', text: 'Komputer Analog' },
      { key: 'B', text: 'Komputer Digital' },
      { key: 'C', text: 'Komputer Subnotebook' },
      { key: 'D', text: 'Komputer Era Pioner' },
    ],
    correctKey: 'A',
    explanation:
      'Modul 6 (6.4.1) menggolongkan pengolah data kualitatif kontinu (suhu, kecepatan suara, voltase RS) sebagai Komputer Analog.',
  },
  {
    id: 'abc-hist-08',
    type: 'abc',
    clusterId: 'hist-3',
    topicTag: 'Klasifikasi Ukuran Fisik',
    prompt:
      'Jenis komputer berukuran di antara Notebook dan Palmtop yang lebih ringkas karena sebagian perangkatnya (biasanya disk drive) tidak dipasang adalah...',
    options: [
      { key: 'A', text: 'Tower' },
      { key: 'B', text: 'Desktop' },
      { key: 'C', text: 'Subnotebook' },
      { key: 'D', text: 'Mainframe' },
    ],
    correctKey: 'C',
    explanation:
      'Subnotebook berukuran antara notebook dan palmtop karena meniadakan sebagian perangkat seperti disk drive agar lebih ringkas.',
  },
  {
    id: 'abc-hist-09',
    type: 'abc',
    clusterId: 'hist-3',
    topicTag: '4 Era Perkembangan Software',
    prompt:
      'Pada era perkembangan software manakah perangkat lunak mulai bergeser menjadi produk komersial, mendukung multi-user, multitasking, real-time, serta mulai dikenal sistem basis data (database)?',
    options: [
      { key: 'A', text: 'Era Pioner (1950-an)' },
      { key: 'B', text: 'Era Stabil (1960–1970-an)' },
      { key: 'C', text: 'Era Mikro (1980-an)' },
      { key: 'D', text: 'Era Manual (Abacus)' },
    ],
    correctKey: 'B',
    explanation:
      'Era Stabil (6.4.5) ditandai munculnya perusahaan software komersial, dukungan multi-user, multitasking, real-time, dan sistem basis data yang memisahkan program dari data.',
  },
];

// =========================================================================
// GLOSARIUM TAMBAHAN (MODUL 1 & MODUL 6)
// =========================================================================

export const EXTRA_GLOSSARY_ITEMS: GlossaryItem[] = [
  // Arsitektur & Performa
  {
    id: 'gl-arch-word',
    term: 'Word & Panjang Word',
    category: 'Arsitektur & Performa',
    definition:
      'Kelompok bit berukuran tetap (umumnya 16 hingga 64 bit) yang disimpan atau diambil dari memori utama dalam satu operasi dasar melalui alamat tertentu.',
  },
  {
    id: 'gl-arch-register',
    term: 'Register Prosesor',
    category: 'Arsitektur & Performa',
    definition:
      'Elemen penyimpanan kecepatan sangat tinggi di dalam prosesor untuk menampung satu word operand sebelum dan sesudah diproses ALU.',
    examTrap: 'Waktu akses Register LEBIH CEPAT daripada unit Cache tercepat!',
  },
  {
    id: 'gl-arch-control',
    term: 'Unit Kontrol & Sinyal Timing',
    category: 'Arsitektur & Performa',
    definition:
      'Pusat saraf komputer yang mengirim sinyal timing untuk mengkoordinasikan dan menyinkronkan waktu transfer data antar memori, ALU, dan I/O.',
  },
  {
    id: 'gl-arch-buffer',
    term: 'Register Buffer (Bus I/O)',
    category: 'Arsitektur & Performa',
    definition:
      'Register elektronik pada peralatan I/O (seperti printer) yang menampung sementara data dari CPU agar prosesor dan bus segera bebas tanpa menunggu perangkat mekanik yang lambat.',
  },
  {
    id: 'gl-arch-multi',
    term: 'Multiprogramming / Multitasking',
    category: 'Arsitektur & Performa',
    definition:
      'Pola eksekusi konkuren beberapa program aplikasi yang diatur Sistem Operasi agar CPU, disk, dan printer bekerja tumpang-tindih tanpa banyak menganggur.',
  },
  {
    id: 'gl-arch-pipeline',
    term: 'Pipelining & Superscalar',
    category: 'Arsitektur & Performa',
    definition:
      'Pipelining menumpangtindihkan eksekusi instruksi berurutan (S efektif ≈ 1); Superscalar membuka banyak pipeline paralel sekaligus (S efektif < 1).',
  },
  {
    id: 'gl-arch-risccisc',
    term: 'RISC vs CISC',
    category: 'Arsitektur & Performa',
    definition:
      'RISC (Reduced Instruction Set) memakai instruksi sederhana yang mudah di-pipeline (N besar, S kecil); CISC (Complex Instruction Set) memakai instruksi kompleks (N kecil, S besar).',
  },
  {
    id: 'gl-arch-spec',
    term: 'Benchmark SPEC',
    category: 'Arsitektur & Performa',
    definition:
      'Standar pengukuran performa komputer (System Performance Evaluation Corporation) menggunakan sekumpulan program aplikasi riil dibandingkan terhadap komputer referensi.',
  },
  {
    id: 'gl-arch-parallel',
    term: 'Shared-Memory vs Message-Passing',
    category: 'Arsitektur & Performa',
    definition:
      'Multiprosesor Shared-Memory berbagi satu ruang memori global antar CPU; Multikomputer Message-Passing terdiri dari komputer bermemori lokal yang saling berkirim pesan lewat jaringan.',
  },

  // Sejarah & Klasifikasi
  {
    id: 'gl-hist-pascaline',
    term: 'Pascaline (1642)',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Kalkulator mekanik roda gerigi kuningan (8 digit berbasis sepuluh) karya Blaise Pascal untuk membantu ayahnya menghitung pajak.',
    examTrap: 'Kelemahannya hanya bisa menjumlah; 4 operasi dasar baru dicapai Arithometer Thomas de Colmar.',
  },
  {
    id: 'gl-hist-analytical',
    term: 'Analytical Engine & Ada Lovelace',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Rancangan komputer general-purpose pertama karya Charles Babbage menggunakan kartu perforasi; Augusta Ada King menulis instruksinya dan diakui sebagai programmer wanita pertama.',
  },
  {
    id: 'gl-hist-hollerith',
    term: 'Kartu Perforasi Hollerith (1889)',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Kartu berlubang penyimpan 80 variabel ciptaan Herman Hollerith yang menyelesaikan Sensus AS dalam 6 minggu dan melahirkan cikal bakal IBM (1924).',
  },
  {
    id: 'gl-hist-vonneumann',
    term: 'Arsitektur Von Neumann (EDVAC 1945)',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Konsep desain komputer oleh John von Neumann dengan satu memori penampung program sekaligus data serta unit pemrosesan sentral (CPU) sebagai koordinator tunggal.',
  },
  {
    id: 'gl-hist-ic',
    term: 'Integrated Circuit / IC (Jack Kilby)',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Sirkuit terintegrasi dalam piringan silikon pasir kuarsa (1958) yang menjadi ciri utama Komputer Generasi Ketiga (1964–1970) bersamaan dengan lahirnya Sistem Operasi.',
  },
  {
    id: 'gl-hist-vlsi',
    term: 'LSI, VLSI, ULSI & Intel 4004',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Tingkatan pemadatan ratusan hingga jutaan komponen ke satu keping chip pada Generasi Keempat; Intel 4004 (1971) adalah mikroprosesor pionir yang menyatukan CPU, memori, & I/O.',
  },
  {
    id: 'gl-hist-brainware',
    term: 'Hardware · Software · Brainware',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Tiga elemen sistem komputer yang tak terpisahkan: perangkat fisik (Hardware), program instruksi (Software), dan manusia operator/pengendali (Brainware).',
  },
  {
    id: 'gl-hist-analog',
    term: 'Komputer Analog, Digital & Hybrid',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Analog mengolah data kualitatif kontinu (suhu/voltase RS), Digital mengolah data kuantitatif (PC), dan Hybrid menggabungkan keduanya (contoh: Facsimile).',
  },
  {
    id: 'gl-hist-sweras',
    term: '4 Era Perkembangan Software',
    category: 'Sejarah & Klasifikasi',
    definition:
      'Urutan evolusi software: Era Pioner (batch/punched card) → Era Stabil (multi-user/real-time/database) → Era Mikro (PC/sistem vs aplikasi) → Era Modern (objek/pakar/embedded).',
  },
];
