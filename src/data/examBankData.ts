import type { AbcQuestion, EssayQuestion, GlossaryItem } from '../types/rigbench';
import {
  EXTRA_ABC_QUESTIONS,
  EXTRA_ESSAY_QUESTIONS,
  EXTRA_GLOSSARY_ITEMS,
} from './extraExamBankData';

export const ESSAY_QUESTIONS: EssayQuestion[] = [
  {
    id: 'essay-01',
    type: 'essay',
    clusterId: 'cluster-1',
    topicTag: 'Arsitektur Chipset',
    prompt:
      'Jelaskan perbedaan arsitektur dan fungsi antara Chipset Northbridge (MCH) dan Southbridge (ICH) pada motherboard, serta sebutkan minimal 3 komponen yang dikendalikan oleh masing-masing chipset!',
    rubric: [
      {
        id: 'r-nb-speed',
        label: 'Northbridge (MCH) mengelola jalur lalu lintas data berkecepatan tinggi & power management',
        weight: 25,
        conceptGroups: [
          ['northbridge', 'mch', 'memory controller'],
          ['cepat', 'kecepatan tinggi', 'high speed', 'power management', 'menjembatani'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-nb-parts',
        label: 'Komponen Northbridge: Prosesor (CPU), Main Memory (RAM), dan Kartu Grafis (AGP / PCIe x16)',
        weight: 25,
        conceptGroups: [
          ['cpu', 'prosesor', 'processor'],
          ['ram', 'memori', 'memory'],
          ['vga', 'grafis', 'agp', 'pcie', 'pci express'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-sb-speed',
        label: 'Southbridge (ICH) mengendalikan periferal dan antarmuka I/O berkecepatan lebih rendah',
        weight: 25,
        conceptGroups: [
          ['southbridge', 'ich', 'io controller'],
          ['lambat', 'kecepatan rendah', 'periferal', 'peripheral', 'i/o', 'input output'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-sb-parts',
        label: 'Komponen Southbridge: SATA/IDE, slot PCI, ROM BIOS, USB, LAN, Keyboard/Mouse, dan Audio',
        weight: 25,
        conceptGroups: [
          ['sata', 'ide', 'harddisk', 'storage'],
          ['bios', 'rom', 'pci'],
          ['usb', 'lan', 'audio', 'keyboard', 'mouse', 'modem'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Northbridge (Memory Controller Hub / MCH) bertugas menjembatani arus data berkecepatan tinggi serta mengatur power management. Komponen yang dikendalikan Northbridge meliputi Prosesor (CPU), Main Memory (RAM), dan kartu grafis pada slot AGP atau PCI Express x16. Sebaliknya, Southbridge (I/O Controller Hub / ICH) menangani periferal berkecepatan lebih rendah, meliputi kontroler penyimpanan SATA/IDE, slot PCI konvensional, chip ROM BIOS, port USB, Ethernet LAN, Keyboard & Mouse, modem, dan audio.',
    examTip: 'Pastikan komponen cepat (CPU, RAM, VGA) tidak pernah tertukar ke kelompok Southbridge.',
  },
  {
    id: 'essay-02',
    type: 'essay',
    clusterId: 'cluster-5',
    topicTag: 'Studi Kasus Blank',
    caseContext:
      'Kasus Lab: Saat tombol Power ditekan, indikator LED panel casing menyala, kipas PSU dan kipas Prosesor berputar normal, namun layar monitor tetap gelap (Blank).',
    prompt:
      'Analisislah kemungkinan penyebab kasus PC Blank tersebut dan tuliskan langkah-langkah troubleshooting sistematis untuk memperbaikinya sesuai modul praktikum STMIK AKI!',
    rubric: [
      {
        id: 'r-blank-causes',
        label: 'Menyebutkan penyebab utama (RAM kotor/rusak, VGA bermasalah, Monitor/kabel, PSU kurang tegangan, atau BIOS perlu reset)',
        weight: 25,
        conceptGroups: [
          ['ram', 'memori', 'memory'],
          ['vga', 'monitor', 'kabel', 'psu', 'bios', 'prosesor'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-blank-ram',
        label: 'Langkah RAM: melepas keping RAM, membersihkan pin emas dengan penghapus karet, dan memindahkan slot',
        weight: 30,
        conceptGroups: [
          ['lepas', 'cabut', 'bersihkan', 'gosok'],
          ['penghapus', 'karet', 'eraser'],
          ['slot', 'tancap', 'pasang kembali', 'ganti ram'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-blank-cmos-beep',
        label: 'Langkah Motherboard/BIOS: Reset CMOS dengan melepas baterai & uji nyala tanpa RAM untuk mendengar bunyi beep',
        weight: 25,
        conceptGroups: [
          ['cmos', 'reset bios', 'baterai'],
          ['beep', 'tanpa ram', 'tanpa memori', 'speaker'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-blank-vga-mon',
        label: 'Langkah Monitor & VGA: cek LED monitor/No Signal/pin kabel dan uji lepas VGA eksternal ke VGA onboard',
        weight: 20,
        conceptGroups: [
          ['monitor', 'no signal', 'brightness', 'kabel'],
          ['vga eksternal', 'vga onboard', 'onboard', 'lepas vga', 'slot pcie', 'agp'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Penyebab PC Blank antara lain memori RAM kotor/rusak/tidak cocok, VGA onboard atau eksternal bermasalah, monitor atau kabel data rusak, PSU kekurangan tegangan, konfigurasi BIOS error, atau pemasangan prosesor kurang pas. Langkah perbaikan sistematis: (1) Lepas keping RAM, bersihkan pin tembaga emas memakai karet penghapus pensil, lalu pasang ulang atau pindah ke slot lain. (2) Cek LED power monitor, pesan No Signal Detected, dan pastikan pin kabel data tidak bengkok. (3) Jika memakai VGA eksternal, lepas dan uji dengan VGA onboard (lakukan Reset CMOS terlebih dahulu). (4) Reset BIOS dengan melepas baterai CMOS beberapa menit lalu pasang kembali. (5) Hidupkan PC tanpa RAM untuk mendengar bunyi beep; jika berbunyi beep berarti motherboard normal. (6) Cek tegangan tiap konektor PSU dengan AVO/PSU tester serta periksa pemasangan prosesor.',
    examTip: 'Penghapus karet untuk pin RAM dan tes beep tanpa RAM adalah dua poin wajib bernilai tinggi.',
  },
  {
    id: 'essay-03',
    type: 'essay',
    clusterId: 'cluster-5',
    topicTag: 'Studi Kasus Mati Total',
    caseContext:
      'Kasus Lab: Sebuah PC ditekan tombol powernya namun tidak ada reaksi sama sekali—LED mati, kipas PSU tidak berputar, dan kipas prosesor diam.',
    prompt:
      'Jelaskan urutan prosedur diagnosa PC Mati Total (MaTot), khususnya cara menguji PSU secara mandiri dan cara mendeteksi kerusakan fisik pada motherboard!',
    rubric: [
      {
        id: 'r-matot-power',
        label: 'Langkah awal: memeriksa sumber listrik PLN & kabel power menggunakan Testpen/AVO atau beban lain',
        weight: 20,
        conceptGroups: [
          ['listrik', 'stopkontak', 'pln', 'sumber listrik', 'kabel power'],
          ['testpen', 'avo', 'multitester', 'lampu', 'beban'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-matot-jumper',
        label: 'Uji mandiri PSU: menjumper kabel Hijau (PS_ON / Pin 16) dengan kabel Hitam (Ground) dan mengecek putaran kipas PSU',
        weight: 35,
        conceptGroups: [
          ['jumper', 'hubungkan', 'sambung', 'shortkan'],
          ['hijau', 'ps_on', 'pin 16'],
          ['hitam', 'ground', 'gnd', 'com'],
          ['kipas', 'fan', 'berputar'],
        ],
        minGroupHits: 3,
      },
      {
        id: 'r-matot-cap',
        label: 'Cek fisik Motherboard: memeriksa kapasitor ELCO dekat soket daya apakah menggelembung atau bocor',
        weight: 25,
        conceptGroups: [
          ['kapasitor', 'elko', 'elco', 'kondensator'],
          ['gelembung', 'menggelembung', 'bocor', 'kembung', 'pecah', 'meledak'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-matot-chip',
        label: 'Cek suhu IC Northbridge/Southbridge (panas berlebih menandakan motherboard short) serta cek RAM/prosesor',
        weight: 20,
        conceptGroups: [
          ['northbridge', 'southbridge', 'nb', 'sb', 'chipset', 'ic'],
          ['panas', 'overheat', 'short', 'konslet', 'rusak'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Langkah diagnosa PC Mati Total (MaTot): (1) Periksa ketersediaan sumber listrik PLN dan kabel konektor PSU menggunakan Testpen, AVO meter, atau beban lain seperti lampu. (2) Uji mandiri PSU dengan melepas konektor ATX 24-pin lalu menjumper kabel warna Hijau (PS_ON, pin 16) dengan kabel warna Hitam (Ground); jika kipas PSU berputar dan tegangan keluaran AVO sesuai (+3.3V, +5V, +12V), PSU dalam kondisi baik. (3) Periksa dan bersihkan pin RAM serta reset baterai CMOS, dan cek apakah ada pin prosesor yang bengkok atau terbakar. (4) Inspeksi motherboard: periksa kapasitor ELCO di sekitar soket daya apakah ada yang menggelembung/bocor, serta pegang IC Northbridge dan Southbridge—jika terasa panas berlebih menandakan motherboard mengalami short/rusak.',
    examTip: 'Jangan lupa sebutkan warna kabel jumper PSU secara eksplisit: HIJAU dan HITAM.',
  },
  {
    id: 'essay-04',
    type: 'essay',
    clusterId: 'cluster-4',
    topicTag: 'Skema Partisi MBR vs GPT',
    prompt:
      'Bandingkan secara mendalam skema tabel partisi Master Boot Record (MBR) dan GUID Partition Table (GPT) dari segi kapasitas maksimal, batas partisi primer, firmware, struktur partisi, dan keamanan tabel!',
    rubric: [
      {
        id: 'r-mbr-cap',
        label: 'Kapasitas maksimal: MBR terbatas 2 TB, sedangkan GPT mendukung >2 TB (hingga 18 Exabyte)',
        weight: 25,
        conceptGroups: [
          ['2 tb', '2tb', 'dua terabyte'],
          ['18 eb', 'exabyte', 'lebih dari 2', '>2', 'tak terbatas', 'tanpa batas'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-mbr-part',
        label: 'Batas partisi primer: MBR maks 4 partisi primer (atau 3 primer + 1 extended), GPT hingga 128 partisi primer',
        weight: 25,
        conceptGroups: [
          ['4 partisi', 'empat partisi', 'extended', 'logical'],
          ['128', 'seratus dua puluh delapan'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-mbr-fw',
        label: 'Firmware: MBR berbasis Legacy BIOS, sedangkan GPT berbasis UEFI (wajib untuk Windows 11/modern)',
        weight: 25,
        conceptGroups: [
          ['legacy', 'bios'],
          ['uefi', 'unified efi'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-mbr-redundancy',
        label: 'Keamanan & Redundansi: MBR hanya 1 sektor awal (rawan rusak), GPT punya salinan cadangan di akhir disk (CRC32)',
        weight: 25,
        conceptGroups: [
          ['1 sektor', 'satu sektor', 'sektor awal', 'rawan'],
          ['cadangan', 'backup', 'redundansi', 'akhir disk', 'crc32', 'salinan'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Perbandingan MBR vs GPT: (1) Kapasitas disk: MBR terbatas maksimal 2 TB per drive fisik, sedangkan GPT mendukung kapasitas di atas 2 TB hingga 18 Exabyte. (2) Jumlah partisi primer: MBR hanya mendukung maksimal 4 partisi primer (atau 3 primer + 1 extended untuk menampung logical partition), sedangkan GPT mendukung hingga 128 partisi primer mandiri tanpa memerlukan extended partition. (3) Firmware: MBR menggunakan standar lawas Legacy BIOS, sedangkan GPT menggunakan antarmuka modern UEFI (standar wajib Windows 11). (4) Redundansi keamanan: MBR hanya menyimpan tabel partisi di 1 sektor awal sehingga rawan rusak total, sedangkan GPT menyimpan salinan cadangan tabel partisi di akhir disk disertai pemeriksaan integritas CRC32.',
    examTip: 'Hafal 4 pasang angka/istilah kunci: 2TB vs >2TB/18EB, 4 vs 128 primer, BIOS vs UEFI, 1 sektor vs cadangan CRC32.',
  },
  {
    id: 'essay-05',
    type: 'essay',
    clusterId: 'cluster-4',
    topicTag: 'Praktikum Disk Management',
    prompt:
      'Jelaskan langkah-langkah membuat partisi baru dari ruang kosong Drive C: menggunakan Windows Disk Management (diskmgmt.msc) tanpa menghapus data yang ada, serta sebutkan partisi tersembunyi yang pantang dihapus!',
    rubric: [
      {
        id: 'r-dm-open-shrink',
        label: 'Membuka diskmgmt.msc, klik kanan Drive C:, pilih Shrink Volume, dan memasukkan kapasitas MB hingga muncul Unallocated Space',
        weight: 30,
        conceptGroups: [
          ['disk management', 'diskmgmt'],
          ['shrink', 'mengecilkan', 'kecilkan'],
          ['unallocated', 'hitam', 'belum dialokasikan'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-dm-wizard',
        label: 'Klik kanan ruang Unallocated → pilih New Simple Volume Wizard dan menentukan huruf drive (D:/E:)',
        weight: 25,
        conceptGroups: [
          ['new simple volume', 'volume baru', 'simple volume'],
          ['huruf', 'drive letter', 'd:', 'e:', 'f:'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-dm-format',
        label: 'Memilih sistem berkas NTFS, label volume, centang Perform a quick format, lalu Finish hingga berwarna biru (Healthy Primary)',
        weight: 25,
        conceptGroups: [
          ['ntfs'],
          ['quick format', 'format', 'label', 'finish', 'biru', 'healthy'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-dm-safety',
        label: 'Peringatan keselamatan: dilarang menghapus/memformat EFI System Partition dan Recovery Partition',
        weight: 20,
        conceptGroups: [
          ['efi', 'bootloader'],
          ['recovery', 'pemulihan'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Langkah membuat partisi baru tanpa menghapus data via Disk Management: (1) Buka utilitas Disk Management (klik kanan Start → Disk Management atau ketik diskmgmt.msc di Run). (2) Klik kanan pada Drive C: yang memiliki ruang kosong berlebih lalu pilih Shrink Volume, masukkan kapasitas yang ingin disisihkan dalam satuan MB, lalu klik Shrink hingga muncul blok hitam Unallocated Space. (3) Klik kanan ruang Unallocated tersebut lalu pilih New Simple Volume untuk menjalankan wizard. (4) Tetapkan ukuran volume dan pilih huruf drive baru yang belum terpakai (misal D: atau E:). (5) Pilih sistem berkas NTFS, isi Volume Label, centang Perform a quick format, lalu klik Next → Finish hingga berubah biru menjadi Healthy Primary Partition. Peringatan penting: jangan pernah menghapus atau memformat EFI System Partition maupun Recovery Partition karena menyimpan berkas bootloader dan pemulihan darurat Windows.',
    examTip: 'Sebutkan urutan: Shrink Volume → Unallocated Space → New Simple Volume → NTFS Quick → larangan hapus EFI & Recovery.',
  },
  {
    id: 'essay-06',
    type: 'essay',
    clusterId: 'cluster-4',
    topicTag: 'File System NTFS vs FAT32',
    prompt:
      'Mengapa partisi instalasi Windows modern wajib diformat menggunakan NTFS dan bukan FAT32? Jelaskan perbedaan fitur keamanan, batas ukuran berkas, dan fungsi menyisakan ruang kosong 20%–30% di Drive C:!',
    rubric: [
      {
        id: 'r-fs-ntfs',
        label: 'Keunggulan NTFS: hak akses pengguna (permissions), enkripsi data, kompresi otomatis, dan journaling untuk pemulihan kerusakan',
        weight: 40,
        conceptGroups: [
          ['permission', 'hak akses', 'izin akses'],
          ['enkripsi', 'encrypt', 'kompresi', 'compress'],
          ['journal', 'journaling', 'pemulihan', 'recovery'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-fs-fat32',
        label: 'Kelemahan utama FAT32: batas maksimal ukuran satu berkas (file) hanya 4 GB meski kompatibel luas',
        weight: 35,
        conceptGroups: [
          ['fat32', 'fat 32'],
          ['4 gb', '4gb', 'empat gb', 'empat gigabyte'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-fs-buffer',
        label: 'Alasan ruang kosong 20%–30% di Drive C: untuk virtual memory (pagefile.sys), temporary files, dan Windows Update agar tidak lag',
        weight: 25,
        conceptGroups: [
          ['20%', '30%', 'ruang kosong', 'buffer'],
          ['virtual memory', 'pagefile', 'temporary', 'update', 'lag', 'lambat', 'kinerja'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Partisi instalasi Windows wajib memakai NTFS (New Technology File System) karena NTFS memiliki fitur keamanan dan keandalan modern: pengaturan hak akses pengguna (permissions), enkripsi data, kompresi berkas otomatis, serta pencatatan transaksi (journaling) untuk pemulihan saat mati listrik mendadak. Sebaliknya, FAT32 memiliki kelemahan fatal yaitu batas maksimal ukuran satu file tunggal hanya 4 GB sehingga tidak mampu menyimpan berkas besar seperti ISO atau video HD. Selain itu, partisi sistem Drive C: wajib menyisakan buffer ruang kosong minimal 20%–30% agar virtual memory (pagefile.sys), berkas sementara (temporary files), dan Windows Update berjalan lancar tanpa menyebabkan sistem lag.',
    examTip: 'Pastikan angka "4 GB" untuk batas file FAT32 dan "pagefile.sys / virtual memory" muncul di jawabanmu.',
  },
  {
    id: 'essay-07',
    type: 'essay',
    clusterId: 'cluster-7',
    topicTag: 'Hakikat Hukum & Klausul EULA',
    prompt:
      'Jelaskan hakikat hukum dokumen EULA (End User License Agreement), sebutkan tindakan yang membuat pengguna sah terikat EULA, serta uraikan 4 klausul kritis EULA menurut Edward Desautels yang wajib diwaspadai!',
    rubric: [
      {
        id: 'r-eula-nature',
        label: 'Hakikat EULA: kontrak hukum mengikat; membeli software berarti membeli hak izin pakai (lisensi), bukan kepemilikan program/kode sumber',
        weight: 30,
        conceptGroups: [
          ['kontrak', 'perjanjian', 'hukum', 'mengikat'],
          ['hak izin pakai', 'izin pakai', 'lisensi', 'bukan membeli kepemilikan', 'bukan milik'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-eula-consent',
        label: 'Indikasi persetujuan yuridis: klik I Accept/Agree, membuka/merusak segel CD, menginstal, memakai fitur, atau meminta aktivasi',
        weight: 25,
        conceptGroups: [
          ['i accept', 'i agree', 'setuju', 'klik'],
          ['segel', 'instal', 'aktivasi', 'kemasan', 'menggunakan'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-eula-clauses-a',
        label: 'Klausul 1 & 2: Pemantauan aktivitas internet & pengambilan data pribadi (telemetri)',
        weight: 22,
        conceptGroups: [
          ['pantau', 'memantau', 'monitor', 'aktivitas internet', 'lalu lintas'],
          ['data pribadi', 'telemetri', 'identitas', 'perilaku'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-eula-clauses-b',
        label: 'Klausul 3 & 4: Pemanfaatan sumber daya (CPU/RAM/bandwidth) & pembukaan port firewall (rawan Backdoor/Trojan)',
        weight: 23,
        conceptGroups: [
          ['cpu', 'ram', 'bandwidth', 'sumber daya'],
          ['firewall', 'port', 'backdoor', 'trojan'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'EULA (End User License Agreement) adalah perjanjian kontrak hukum yang mengikat secara sah antara pengguna akhir dan vendor software. Hakikatnya, saat membeli software komersial, konsumen bukan membeli kepemilikan kode program melainkan hanya membeli hak izin pakai (lisensi). Pengguna sah terikat secara yuridis saat mengklik "I Accept / I Agree", membuka/merusak segel kemasan CD, menginstal aplikasi, memakai fitur, atau meminta aktivasi lisensi. Empat klausul kritis EULA (Edward Desautels): (1) Pemantauan aktivitas internet pengguna, (2) Pengambilan data pribadi / telemetri hardware & perilaku, (3) Pemanfaatan sumber daya komputer (siklus CPU, RAM, kuota bandwidth), dan (4) Pembukaan port firewall tertentu yang rawan dieksploitasi peretas untuk menyusupkan Backdoor dan Trojan.',
    examTip: 'Poin yang paling sering dilupakan mahasiswa adalah "membuka segel kemasan CD" dan risiko "Backdoor/Trojan" pada klausul firewall.',
  },
  {
    id: 'essay-08',
    type: 'essay',
    clusterId: 'cluster-7',
    topicTag: '4 Pilar Bahaya Software Bajakan',
    prompt:
      'Uraikan secara sistematis 4 Pilar Bahaya menggunakan software bajakan / hasil crack beserta jenis-jenis ancaman malware yang sering menyusup di dalamnya!',
    rubric: [
      {
        id: 'r-piracy-malware',
        label: 'Pilar 1 — Kerentanan Keamanan & Malware: Trojan/Backdoor (kendali jarak jauh), Spyware/Keylogger (curi sandi), dan Ransomware (enkripsi & tebusan)',
        weight: 35,
        conceptGroups: [
          ['malware', 'trojan', 'backdoor'],
          ['spyware', 'keylogger', 'password', 'sandi'],
          ['ransomware', 'enkripsi', 'tebusan'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-piracy-update',
        label: 'Pilar 2 — Ketidakstabilan Sistem & Ketiadaan Update (tidak mendapat security update / bug fixes, sering crash)',
        weight: 25,
        conceptGroups: [
          ['update', 'pembaruan', 'security update', 'bug fix'],
          ['crash', 'tidak stabil', 'ketidakstabilan', 'rusak'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-piracy-legal',
        label: 'Pilar 3 — Konsekuensi Hukum Pidana & Perdata (pelanggaran Hak Kekayaan Intelektual / UU Hak Cipta, denda & penjara)',
        weight: 20,
        conceptGroups: [
          ['hukum', 'uu hak cipta', 'hak cipta', 'haki', 'kekayaan intelektual'],
          ['pidana', 'perdata', 'denda', 'penjara', 'sanksi'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-piracy-ethics',
        label: 'Pilar 4 — Pelanggaran Etika & merugikan pengembang serta mematikan ekosistem inovasi teknologi',
        weight: 20,
        conceptGroups: [
          ['etika', 'moral'],
          ['pengembang', 'developer', 'inovasi', 'ekosistem', 'merugikan'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Empat pilar bahaya penggunaan software bajakan/crack: (1) Kerentanan Keamanan & Infeksi Malware—terlebih antivirus sering dimatikan paksa saat menjalankan crack—sehingga rentan disusupi Trojan/Backdoor (kendali jarak jauh ilegal), Spyware Keylogger (merekam ketikan sandi perbankan/email), dan Ransomware (mengenkripsi dokumen penting lalu memeras tebusan). (2) Ketidakstabilan Sistem & Ketiadaan Update: software bajakan tidak dapat menerima pembaruan keamanan resmi (security updates & bug fixes) dan modifikasi biner serampangan memicu crash mendadak. (3) Konsekuensi Hukum Pidana & Perdata: melanggar Hak Kekayaan Intelektual (UU Hak Cipta) dengan ancaman denda ganti rugi besar hingga pidana penjara. (4) Pelanggaran Etika & Kerugian Ekosistem: merugikan pengembang dan mematikan iklim inovasi perangkat lunak.',
    examTip: 'Pastikan menyebut ketiga jenis malware spesifik: Trojan/Backdoor, Spyware/Keylogger, dan Ransomware.',
  },
  {
    id: 'essay-09',
    type: 'essay',
    clusterId: 'cluster-7',
    topicTag: 'Anatomi Alat Cracking',
    prompt:
      'Jelaskan hubungan Reverse Engineering dengan Software Cracking, serta bedakan cara kerja teknis antara Patch, Keygen, Loader, dan No-Disc / Dongle Emulator!',
    rubric: [
      {
        id: 'r-crk-re',
        label: 'Reverse Engineering: membongkar file biner dengan disassembler untuk meneliti logika proteksi salinan/lisensi',
        weight: 20,
        conceptGroups: [
          ['reverse engineering', 'rekayasa balik'],
          ['disassembler', 'biner', 'membongkar', 'proteksi'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-crk-patch',
        label: 'Patch: memodifikasi langsung byte biner file fisik (.exe/.dll), misalnya mengubah lompatan bersyarat JNZ menjadi JZ/NOP',
        weight: 30,
        conceptGroups: [
          ['patch'],
          ['exe', 'dll', 'byte', 'biner', 'menimpa', 'modifikasi file'],
          ['jnz', 'jz', 'nop', 'jump', 'lompatan'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-crk-keygen',
        label: 'Keygen: mereplikasi algoritma enkripsi vendor untuk membangkitkan Serial Number / Product Key valid',
        weight: 25,
        conceptGroups: [
          ['keygen', 'key generator'],
          ['algoritma', 'enkripsi', 'serial', 'product key'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-crk-loader',
        label: 'Loader (injeksi di memori RAM tanpa ubah file fisik) & No-Disc/Dongle Emulator (menghilangkan cek CD fisik / meniru token USB)',
        weight: 25,
        conceptGroups: [
          ['loader', 'ram', 'memori', 'injektor', 'tidak mengubah file'],
          ['no-disc', 'no disc', 'dongle', 'cd fisik', 'emulator', 'token'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'Software Cracking melumpuhkan sistem proteksi lisensi secara ilegal dengan memanfaatkan teknik Reverse Engineering (Rekayasa Balik), yaitu membongkar kode biner terkompilasi lewat disassembler untuk memetakan logika proteksi. Perbedaan keempat alatnya: (1) Patch menimpa byte kode mesin secara langsung pada file fisik .exe atau .dll (misalnya mengubah instruksi jump conditional JNZ menjadi JZ/NOP agar cek lisensi selalu lolos). (2) Keygen (Key Generator) mereplikasi algoritma enkripsi vendor untuk menghasilkan Serial Number/Product Key palsu yang diterima sistem. (3) Loader berjalan sesaat sebelum aplikasi utama untuk memodifikasi eksekusi di memori RAM tanpa mengubah file fisik di disk. (4) No-Disc / Dongle Emulator menghapus verifikasi CD fisik di optical drive atau meniru sinyal hardware token USB.',
    examTip: 'Kata pembeda paling tajam: Patch = ubah file fisik (.exe/.dll), Loader = injeksi di memori RAM.',
  },
  {
    id: 'essay-10',
    type: 'essay',
    clusterId: 'cluster-3',
    topicTag: 'Kelistrikan PSU & Pengaman Daya',
    prompt:
      'Jelaskan fungsi Grounding pada soket AC-IN PSU, fungsi casing logam PSU, perbedaan Stand-by Power Supply vs Main Power Supply, serta perbedaan Stavolt (AVR) dengan UPS!',
    rubric: [
      {
        id: 'r-psu-gnd',
        label: 'Grounding menetralisir tegangan bocor induksi SMPS agar motherboard tidak terkena kejutan listrik / hang',
        weight: 25,
        conceptGroups: [
          ['ground', 'grounding'],
          ['tegangan bocor', 'bocor', 'induksi', 'smps', 'hang', 'kejutan'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-psu-emi',
        label: 'Casing logam PSU melindungi komponen/sinyal audio, video, dan BUS dari interferensi gelombang elektromagnetik (EMI)',
        weight: 25,
        conceptGroups: [
          ['casing', 'logam', 'besi'],
          ['emi', 'elektromagnetik', 'noise', 'audio', 'bus'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-psu-sb-main',
        label: 'Stand-by PSU (+5VSB kabel ungu, langsung hidup saat colok PLN) vs Main PSU (+3.3V, +5V, +12V, hidup setelah trigger tombol power)',
        weight: 25,
        conceptGroups: [
          ['stand-by', 'standby', '5vsb', 'ungu', 'langsung hidup'],
          ['main power', 'trigger', 'tombol power', '3.3v', '12v'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-psu-avr-ups',
        label: 'Stavolt/AVR menstabilkan fluktuasi tegangan 220V; UPS menyediakan baterai cadangan darurat saat listrik padam',
        weight: 25,
        conceptGroups: [
          ['stavolt', 'avr', 'stabil', '220v', 'fluktuasi'],
          ['ups', 'baterai', 'cadangan', 'padam', 'mati lampu'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      '(1) Grounding pada AC-IN (pin ke-3) berfungsi menetralisir tegangan bocor dari proses induksi SMPS agar tidak menimbulkan kejutan listrik yang membuat motherboard hang. (2) Casing logam PSU melindungi sinyal audio, video, dan jalur BUS motherboard dari induksi gelombang elektromagnetik (EMI) hasil pensaklaran SMPS. (3) Stand-by Power Supply (+5VSB kabel ungu, ~2A) langsung hidup secara independen begitu kabel dicolok ke PLN, sedangkan Main Power Supply (+3.3V, +5V, +12V, -12V) hanya hidup setelah mendapat trigger dari motherboard saat tombol power ditekan. (4) Stavolt/AVR berfungsi menstabilkan fluktuasi tegangan PLN di 220V, sedangkan UPS menyediakan baterai cadangan darurat agar PC tidak langsung mati mendadak ketika listrik padam.',
    examTip: 'Empat pasangan konsep yang jelas dan rapi akan langsung mengamankan nilai 100 pada soal kelistrikan.',
  },
  {
    id: 'essay-11',
    type: 'essay',
    clusterId: 'cluster-2',
    topicTag: 'ROM vs RAM & Generasi Memori',
    prompt:
      'Jelaskan perbedaan mendasar antara ROM dan RAM beserta 3 instruksi yang tersimpan di dalam ROM/BIOS, lalu bedakan modul SIMM, DIMM, dan SODIMM!',
    rubric: [
      {
        id: 'r-mem-rom',
        label: 'ROM bersifat non-volatile (hanya baca, tidak hilang saat listrik mati, disebut BIOS) & RAM bersifat volatile (sementara saat PC hidup)',
        weight: 35,
        conceptGroups: [
          ['rom', 'non-volatile', 'non volatile', 'permanen', 'hanya baca'],
          ['ram', 'volatile', 'sementara', 'hilang'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-mem-bios3',
        label: '3 perintah di ROM/BIOS: membaca OS dari disk, mengecek seluruh hardware (POST), dan menampilkan pesan di layar',
        weight: 30,
        conceptGroups: [
          ['membaca sistem operasi', 'baca os', 'booting', 'disk'],
          ['mengecek', 'cek hardware', 'peralatan', 'post'],
          ['pesan', 'layar', 'monitor'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-mem-simm-dimm',
        label: 'SIMM (1 sisi aktif, 30/72 pin, dipasang berpasangan 2/4 keping), DIMM (2 sisi aktif, 168+ pin, cukup 1 keping), SODIMM (untuk laptop)',
        weight: 35,
        conceptGroups: [
          ['simm', 'sebelah', '1 sisi', 'berpasangan', '30 pin', '72 pin'],
          ['dimm', 'kedua', '2 sisi', '168', 'sekeping', '1 keping'],
          ['sodimm', 'laptop', 'notebook'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'ROM (Read Only Memory) bersifat non-volatile sehingga datanya tidak hilang ketika listrik mati dan pada komputer disebut BIOS. Tiga instruksi utama di dalam ROM meliputi: perintah membaca Sistem Operasi dari disk, mengecek seluruh peralatan hardware (POST), dan menampilkan pesan di layar. Sebaliknya, RAM (Random Access Memory) bersifat volatile sebagai memori kerja sementara selama komputer menyala untuk mempercepat pemrosesan CPU. Perbedaan modul: SIMM hanya memiliki 1 sisi kaki aktif (30-pin butuh 4 keping, 72-pin minimal 2 keping berpasangan); DIMM memiliki 2 sisi kaki aktif (168 pin ke atas) sehingga cukup 1 keping untuk beroperasi; sedangkan SODIMM adalah modul berukuran ringkas khusus untuk laptop/notebook.',
    examTip: 'Pastikan ketiga perintah ROM/BIOS tertulis lengkap sesuai halaman 3 modul STMIK AKI.',
  },
  {
    id: 'essay-12',
    type: 'essay',
    clusterId: 'cluster-5',
    topicTag: 'Prosedur Instalasi OS Windows',
    prompt:
      'Tuliskan urutan langkah prosedural instalasi Sistem Operasi Windows dari pengaturan BIOS hingga PC siap digunakan lengkap dengan driver dan aplikasi pendukung!',
    rubric: [
      {
        id: 'r-os-bios',
        label: 'Masuk BIOS (Del/F2), ubah First Boot Device ke CDROM/Flashdisk, simpan (F10), dan tekan tombol saat Press any key',
        weight: 25,
        conceptGroups: [
          ['bios', 'del', 'f2'],
          ['boot', 'first boot', 'cdrom', 'dvd', 'flashdisk', 'f10'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-os-part',
        label: 'Menyetujui lisensi EULA (F8/I Accept), membuat/memilih partisi sistem Drive C:, dan memformat dengan NTFS (Quick)',
        weight: 25,
        conceptGroups: [
          ['eula', 'f8', 'license', 'accept'],
          ['partisi', 'drive c', 'ntfs', 'format'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-os-setup',
        label: 'Penyalinan berkas & reboot otomatis, isi Nama/Organisasi, masukkan 25 karakter Product Key, dan atur Zona Waktu (GMT+07:00)',
        weight: 25,
        conceptGroups: [
          ['product key', 'serial number', '25'],
          ['gmt+07', 'gmt+7', '+7', 'zona waktu', 'time zone', 'reboot', 'restart'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-os-driver',
        label: 'Pasca-instalasi: memasang Driver hardware (Chipset, VGA, Sound, LAN) dan software aplikasi pendukung (Office, PDF Reader, Browser)',
        weight: 25,
        conceptGroups: [
          ['driver', 'chipset', 'vga', 'lan', 'sound', 'audio'],
          ['aplikasi', 'office', 'browser', 'antivirus'],
        ],
        minGroupHits: 1,
      },
    ],
    idealAnswer:
      'Tahapan instalasi Sistem Operasi Windows: (1) Masuk BIOS (tekan Del/F2), atur 1st Boot Device ke DVD/Flashdisk bootable, lalu simpan dengan F10. (2) Tekan sembarang tombol saat muncul "Press any key to boot from CD/DVD...". (3) Setujui perjanjian lisensi EULA (tekan F8 / centang I Accept). (4) Pilih atau buat partisi sistem (Drive C:) lalu format dengan sistem berkas NTFS (Quick). (5) Tunggu penyalinan berkas sistem dan komputer melakukan restart otomatis. (6) Isi identitas Nama, Organisasi, Nama Komputer, masukkan 25 karakter Product Key resmi, serta atur zona waktu Indonesia (GMT+07:00). (7) Setelah masuk desktop, instal driver resmi motherboard (Chipset, VGA, Sound, LAN) lalu instal aplikasi pendukung seperti Office, browser, dan antivirus.',
    examTip: 'Sertakan detail angka dan tombol spesifik: Del/F2, F10, F8, NTFS, 25 karakter Product Key, dan GMT+07:00.',
  },
  {
    id: 'essay-13',
    type: 'essay',
    clusterId: 'cluster-5',
    topicTag: 'Kasus Hang & Infeksi Virus',
    prompt:
      'Bagaimana cara membedakan gejala PC Hang dengan PC Terinfeksi Virus, dan jelaskan langkah pemulihan (Safe Mode, HBCD, Fresh Install) yang tepat saat sistem terinfeksi virus parah!',
    rubric: [
      {
        id: 'r-hv-hang',
        label: 'Ciri khas Hang: kursor mouse tidak bisa digerakkan dan tombol NumLock keyboard tidak bisa menyala-mati saat ditekan',
        weight: 30,
        conceptGroups: [
          ['mouse', 'kursor', 'macet'],
          ['numlock', 'num lock', 'keyboard'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-hv-virus',
        label: 'Gejala Virus: muncul banyak shortcut di folder, Regedit/Task Manager/Folder Option terkunci, atau crash/restart berkala',
        weight: 25,
        conceptGroups: [
          ['shortcut', 'regedit', 'task manager', 'folder option', 'terkunci'],
          ['lambat', 'crash', 'restart', 'error', 'drive tidak bisa diakses'],
        ],
        minGroupHits: 1,
      },
      {
        id: 'r-hv-recovery',
        label: 'Pemulihan Virus: scan lewat Safe Mode / HBCD / paralel HDD ke PC bersih; jika parah backup via Mini XP HBCD lalu Fresh Install (bukan Repair)',
        weight: 25,
        conceptGroups: [
          ['safe mode', 'hbcd', 'mini xp', 'paralel'],
          ['fresh install', 'install ulang', 'bukan repair', 'backup'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-hv-prevent',
        label: 'Pencegahan pasca-install: matikan Autorun/Autoplay & Restore Point, install & update Antivirus SEBELUM memasang driver/aplikasi',
        weight: 20,
        conceptGroups: [
          ['autorun', 'autoplay', 'restore point'],
          ['antivirus', 'scan', 'winrar', 'kompres'],
        ],
        minGroupHits: 2,
      },
    ],
    idealAnswer:
      'PC Hang ditandai oleh sistem macet total di mana mouse tidak dapat digerakkan dan tombol NumLock pada keyboard tidak bereaksi menyala-mati saat ditekan (setelah restart normal sebentar lalu hang lagi). Sedangkan infeksi Virus ditandai munculnya banyak shortcut aneh di tiap folder, Regedit/Task Manager/Folder Option tidak bisa diakses, error aneh, dan sistem melambat konsisten. Langkah pemulihan: lakukan scanning melalui Safe Mode, HBCD, atau paralelkan harddisk ke PC bersih ber-antivirus. Bila sistem rusak parah, backup data Drive C: memakai Mini XP di HBCD lalu lakukan Fresh Install (bukan Repair). Setelah selesai, langsung matikan Autorun/Autoplay dan Restore Point, lalu instal serta update Antivirus terlebih dahulu sebelum memasang driver atau aplikasi.',
    examTip: 'Kata kunci wajib: NumLock untuk Hang, serta Fresh Install (bukan Repair) + matikan Autorun untuk Virus.',
  },
  {
    id: 'essay-14',
    type: 'essay',
    clusterId: 'cluster-6',
    topicTag: 'Elektronika & Multitester',
    prompt:
      'Hitung nilai dan rentang toleransi resistor bergelang Coklat–Hitam–Merah–Perak serta nilai kapasitor keramik berkode 103! Jelaskan pula 4 kesimpulan penunjukan jarum multitester saat mengukur kapasitor ELCO!',
    rubric: [
      {
        id: 'r-el-res',
        label: 'Resistor Coklat(1)–Hitam(0)–Merah(×100)–Perak(±10%) = 1.000 Ω (1 kΩ) dengan rentang 900 Ω – 1.100 Ω',
        weight: 35,
        conceptGroups: [
          ['1000', '1.000', '1 k', '1k'],
          ['10%', 'sepuluh persen'],
          ['900', '1100', '1.100'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-el-cap',
        label: 'Kapasitor keramik 103 = 10.000 pF = 10 nF = 0,01 µF (digit 3 adalah jumlah nol dalam piko Farad)',
        weight: 30,
        conceptGroups: [
          ['10000', '10.000', 'pf', 'piko'],
          ['10 nf', '10nf', '0,01', '0.01'],
        ],
        minGroupHits: 2,
      },
      {
        id: 'r-el-meter',
        label: '4 kesimpulan ELCO di Ohmmeter: bergerak lalu kembali = Baik; bergerak tidak kembali = Bocor; diam = Putus; menunjuk nol = Short',
        weight: 35,
        conceptGroups: [
          ['kembali', 'baik'],
          ['tidak kembali', 'bocor'],
          ['diam', 'tidak bergerak', 'putus'],
          ['nol', '0', 'short'],
        ],
        minGroupHits: 3,
      },
    ],
    idealAnswer:
      'Resistor Coklat (1) – Hitam (0) – Merah (×100) – Perak (±10%) bernilai 10 × 100 = 1.000 Ohm (1 kΩ). Dengan toleransi 10% (±100 Ω), nilai aslinya berada pada rentang 900 Ohm sampai 1.100 Ohm. Kapasitor keramik berkode 103 dibaca: digit I = 1, digit II = 0, digit III = 3 nol dalam piko Farad → 10.000 pF = 10 nF = 0,01 µF. Kesimpulan pengukuran ELCO pada Ohmmeter: (1) Jarum bergerak menunjuk angka lalu kembali ke tempat semula = ELCO Baik; (2) Jarum bergerak menunjuk angka tetapi tidak kembali ke semula = ELCO Bocor; (3) Jarum tidak bergerak sama sekali = ELCO Putus; (4) Jarum menunjuk angka nol = ELCO Short.',
    examTip: 'Sertakan konversi satuan lengkap kapasitor (pF → nF → µF) dan keempat kondisi jarum ELCO.',
  },
  ...EXTRA_ESSAY_QUESTIONS,
];

export const ABC_QUESTIONS: AbcQuestion[] = [
  {
    id: 'abc-01',
    type: 'abc',
    clusterId: 'cluster-2',
    topicTag: 'Identifikasi RAM',
    prompt: 'Manakah spesifikasi fisik yang tepat untuk modul memori SDRAM berdasarkan modul praktikum STMIK AKI?',
    options: [
      { key: 'A', text: '184 pin, 1 notch, kapasitas maksimum 1 GB' },
      { key: 'B', text: '168 pin, 2 notch, kecepatan 100/133 MHz, kapasitas maksimum 512 MB' },
      { key: 'C', text: '240 pin, 1 notch agak ke kiri, kapasitas maksimum 2 GB' },
      { key: 'D', text: '232 pin, dilengkapi heatsink, wajib dipasang berpasangan' },
    ],
    correctKey: 'B',
    explanation: 'SDRAM (Synchronous Dynamic RAM) memiliki 168 pin, 2 notch, kecepatan 100/133 MHz, dan kapasitas maks 512 MB. Opsi A adalah DDR1, C adalah DDR2, dan D adalah RDRAM.',
  },
  {
    id: 'abc-02',
    type: 'abc',
    clusterId: 'cluster-2',
    topicTag: 'Perbedaan DDR2 vs DDR3',
    prompt: 'DDR2 dan DDR3 sama-sama memiliki jumlah pin sebanyak 240 pin. Apa pembeda fisik utama keduanya agar tidak tertukar saat dipasang?',
    options: [
      { key: 'A', text: 'DDR3 memiliki 2 celah notch, sedangkan DDR2 hanya 1 notch' },
      { key: 'B', text: 'DDR2 hanya aktif di satu sisi kaki (SIMM), sedangkan DDR3 dua sisi' },
      { key: 'C', text: 'Lubang notch DDR3 bergeser lebih ke kiri lagi dibanding DDR2' },
      { key: 'D', text: 'Panjang keping fisik DDR3 setengah dari panjang DDR2' },
    ],
    correctKey: 'C',
    explanation: 'Baik DDR2 maupun DDR3 memiliki 240 pin dan 1 notch, namun posisi celah notch DDR3 berada lebih ke kiri dibandingkan DDR2.',
  },
  {
    id: 'abc-03',
    type: 'abc',
    clusterId: 'cluster-1',
    topicTag: 'Back Panel I/O',
    prompt: 'Port pada Back Panel motherboard yang berfungsi menghubungkan komputer dengan perangkat audio digital seperti Home Theatre adalah...',
    options: [
      { key: 'A', text: 'Port Firewire (#21)' },
      { key: 'B', text: 'Port SPDIF (#20)' },
      { key: 'C', text: 'Port Paralel (#18)' },
      { key: 'D', text: 'Port Serial (#19)' },
    ],
    correctKey: 'B',
    explanation: 'Port SPDIF (#20) digunakan untuk periferal audio digital seperti Home Theatre, sedangkan Firewire (#21) untuk video capture kecepatan tinggi.',
  },
  {
    id: 'abc-04',
    type: 'abc',
    clusterId: 'cluster-1',
    topicTag: 'Back Panel I/O',
    prompt: 'Manakah pasangan nomor titik, warna port PS/2, dan fungsi port Back Panel yang benar sesuai diagram Mainboard STMIK AKI?',
    options: [
      { key: 'A', text: 'PS/2 Mouse = Ungu; Firewire = Printer 8-bit' },
      { key: 'B', text: 'PS/2 Keyboard = Hijau; Paralel = Video Capture' },
      { key: 'C', text: 'PS/2 Mouse = Hijau (#16); PS/2 Keyboard = Ungu (#17); Firewire (#21) = Video Capture' },
      { key: 'D', text: 'PS/2 Mouse = Biru (#16); RJ45 (#22) = Audio Line-In' },
    ],
    correctKey: 'C',
    explanation: 'Standar modul STMIK AKI: #16 PS/2 Mouse berwarna hijau, #17 PS/2 Keyboard berwarna ungu, dan #21 Firewire untuk peralatan kecepatan tinggi seperti video capture.',
  },
  {
    id: 'abc-05',
    type: 'abc',
    clusterId: 'cluster-3',
    topicTag: 'Pinout ATX 24-Pin',
    prompt: 'Pada konektor daya ATX 24-pin, kombinasi kabel warna apakah yang harus di-jumper untuk menguji putaran kipas PSU secara mandiri?',
    options: [
      { key: 'A', text: 'Ungu (+5VSB, Pin 9) dengan Merah (+5V)' },
      { key: 'B', text: 'Hijau (PS_ON, Pin 16) dengan Hitam (Ground / COM)' },
      { key: 'C', text: 'Kuning (+12V) dengan Oranye (+3.3V)' },
      { key: 'D', text: 'Abu-abu (PWR_OK, Pin 8) dengan Biru (-12V)' },
    ],
    correctKey: 'B',
    explanation: 'Pin 16 berwarna Hijau adalah sinyal PS_ON (Power On). Menjumpernya ke kabel Hitam (Ground) akan memicu Main Power Supply menyala.',
  },
  {
    id: 'abc-06',
    type: 'abc',
    clusterId: 'cluster-3',
    topicTag: 'Stand-by Power Supply',
    prompt: 'Jalur tegangan PSU yang langsung aktif (+5V DC, ~2A) sesaat setelah kabel power dicolokkan ke stopkontak PLN tanpa menekan tombol Power adalah...',
    options: [
      { key: 'A', text: 'Kabel Kuning (+12V Main Power)' },
      { key: 'B', text: 'Kabel Oranye (+3.3V Sense)' },
      { key: 'C', text: 'Kabel Ungu (+5VSB Stand-by Power Supply, Pin 9)' },
      { key: 'D', text: 'Kabel Biru (-12V)' },
    ],
    correctKey: 'C',
    explanation: 'Stand-by Power Supply (+5VSB pada Pin 9 kabel ungu) bekerja independen segera setelah tersambung PLN untuk mensuplai sirkuit wake/trigger motherboard.',
  },
  {
    id: 'abc-07',
    type: 'abc',
    clusterId: 'cluster-4',
    topicTag: 'Kabel IDE & SATA',
    prompt: 'Berapakah jumlah kawat kabel pita IDE untuk Harddisk dibandingkan kabel Floppy Disk Drive (FDD), serta kecepatan transfer SATA generasi 3?',
    options: [
      { key: 'A', text: 'IDE 34-wire, Floppy 40-wire, SATA 3 = 3 GB/s' },
      { key: 'B', text: 'IDE 40-wire, Floppy 34-wire, SATA 3 = 6 GB/s' },
      { key: 'C', text: 'IDE 40-wire, Floppy 24-wire, SATA 3 = 1,5 GB/s' },
      { key: 'D', text: 'IDE 80-wire wajib, Floppy 40-wire, SATA 3 = 12 GB/s' },
    ],
    correctKey: 'B',
    explanation: 'Sesuai modul: kabel IDE HDD memakai 40-wire (maks panjang 18 inci / 46 cm), Floppy memakai 34-wire, dan kecepatan SATA 1 = 1,5 GB/s, SATA 2 = 3 GB/s, SATA 3 = 6 GB/s.',
  },
  {
    id: 'abc-08',
    type: 'abc',
    clusterId: 'cluster-4',
    topicTag: 'Sistem Berkas FAT32',
    prompt: 'Seorang mahasiswa gagal menyalin file ISO sistem operasi berukuran 5,4 GB ke sebuah Flashdisk kosong berkapasitas 32 GB. Penyebab paling tepat adalah...',
    options: [
      { key: 'A', text: 'Flashdisk menggunakan skema GPT yang tidak mendukung file ISO' },
      { key: 'B', text: 'Flashdisk diformat FAT32 yang memiliki batas maksimal ukuran 1 file hanya 4 GB' },
      { key: 'C', text: 'Flashdisk menggunakan sistem berkas NTFS yang membatasi file di bawah 5 GB' },
      { key: 'D', text: 'Port USB tidak mendukung transfer file di atas 4 GB' },
    ],
    correctKey: 'B',
    explanation: 'FAT32 memiliki keterbatasan mendasar berupa ukuran maksimal 1 berkas tunggal sebesar 4 GB; solusinya adalah memformat ulang ke NTFS atau exFAT.',
  },
  {
    id: 'abc-09',
    type: 'abc',
    clusterId: 'cluster-4',
    topicTag: 'Partisi Primer & Extended',
    prompt: 'Pada skema partisi MBR, sebuah harddisk dapat menampung maksimal...',
    options: [
      { key: 'A', text: '128 Partisi Primer dengan dukungan kapasitas hingga 18 EB' },
      { key: 'B', text: '4 Partisi Primer (atau 3 Partisi Primer + 1 Extended Partition) dan maks kapasitas 2 TB' },
      { key: 'C', text: '2 Partisi Primer dan 2 Logical Partition tanpa Extended' },
      { key: 'D', text: '8 Partisi Primer dengan redundansi tabel CRC32' },
    ],
    correctKey: 'B',
    explanation: 'MBR (Legacy BIOS) terbatas maksimal 2 TB dan maksimal 4 partisi primer (atau 3 primer + 1 extended untuk menampung logical partition).',
  },
  {
    id: 'abc-10',
    type: 'abc',
    clusterId: 'cluster-7',
    topicTag: 'Alat Software Cracking',
    prompt: 'Jenis alat crack yang TIDAK mengubah file fisik (.exe/.dll) di harddisk, melainkan menyuntikkan modifikasi alur eksekusi di memori RAM sesaat sebelum program berjalan adalah...',
    options: [
      { key: 'A', text: 'Patch' },
      { key: 'B', text: 'Keygen (Key Generator)' },
      { key: 'C', text: 'Loader' },
      { key: 'D', text: 'No-Disc Crack' },
    ],
    correctKey: 'C',
    explanation: 'Loader adalah program injektor di memori RAM tanpa memodifikasi berkas fisik pada disk, berbeda dengan Patch yang langsung menimpa byte biner file .exe/.dll.',
  },
  {
    id: 'abc-11',
    type: 'abc',
    clusterId: 'cluster-7',
    topicTag: 'Hakikat & Klausul EULA',
    prompt: 'Pernyataan manakah yang paling tepat mengenai EULA dan risiko pembukaan port firewall di dalamnya?',
    options: [
      { key: 'A', text: 'Membeli software berlisensi berarti pembeli memiliki hak penuh atas kode sumbernya' },
      { key: 'B', text: 'Mengklik I Accept belum mengikat secara hukum selama tidak menandatangani kertas bermaterai' },
      { key: 'C', text: 'Klausul pembukaan port firewall tertentu dapat menjadi celah masuknya Backdoor dan Trojan bila dieksploitasi cracker' },
      { key: 'D', text: 'EULA hanya berlaku untuk sistem operasi Windows dan tidak berlaku bagi aplikasi pihak ketiga' },
    ],
    correctKey: 'C',
    explanation: 'Berdasarkan analisis Edward Desautels dalam modul, pembukaan port firewall yang diminta software dapat membuka celah susupan Backdoor dan Trojan.',
  },
  {
    id: 'abc-12',
    type: 'abc',
    clusterId: 'cluster-6',
    topicTag: 'Kode Warna Resistor',
    prompt: 'Sebuah resistor 4 gelang memiliki warna Merah – Ungu – Oranye – Emas. Berapakah nilai resistansi dan toleransinya?',
    options: [
      { key: 'A', text: '2,7 kΩ ± 5%' },
      { key: 'B', text: '27 kΩ ± 5%' },
      { key: 'C', text: '270 Ω ± 10%' },
      { key: 'D', text: '270 kΩ ± 1%' },
    ],
    correctKey: 'B',
    explanation: 'Merah = 2, Ungu = 7, Oranye = ×1.000 (10³), Emas = ±5% → 27 × 1.000 = 27.000 Ω = 27 kΩ ± 5%.',
  },
  {
    id: 'abc-13',
    type: 'abc',
    clusterId: 'cluster-6',
    topicTag: 'Kapasitor & Variable Resistor',
    prompt: 'Jenis variable resistor yang nilai hambatannya semakin KECIL ketika suhu semakin panas, serta nilai kapasitor keramik berkode 104 secara berturut-turut adalah...',
    options: [
      { key: 'A', text: 'PTC dan 10.000 pF (0,01 µF)' },
      { key: 'B', text: 'NTC dan 100.000 pF (100 nF / 0,1 µF)' },
      { key: 'C', text: 'LDR dan 1.000 pF (1 nF)' },
      { key: 'D', text: 'Trimpot dan 104 pF' },
    ],
    correctKey: 'B',
    explanation: 'NTC (Negative Temperature Coefficient) menurunkan hambatan saat suhu naik. Kode 104 = 10 × 10⁴ pF = 100.000 pF = 100 nF = 0,1 µF.',
  },
  {
    id: 'abc-14',
    type: 'abc',
    clusterId: 'cluster-6',
    topicTag: 'Semikonduktor & IC',
    prompt: 'Manakah pernyataan yang BENAR mengenai pengukuran komponen semikonduktor dan IC sesuai modul Elektronika STMIK AKI?',
    options: [
      { key: 'A', text: 'Dioda Silikon bekerja pada 0,2 VDC dan Dioda Germanium pada 0,6 VDC' },
      { key: 'B', text: 'Urutan kaki MOSFET dari kiri ke kanan saat menghadap kita adalah Gate – Drain – Source' },
      { key: 'C', text: 'Baik tidaknya IC dapat dipastikan 100% hanya dengan Ohmmeter X10' },
      { key: 'D', text: 'Transformator (Trafo) dapat bekerja dengan baik pada arus searah (DC) maupun AC' },
    ],
    correctKey: 'B',
    explanation: 'Urutan kaki MOSFET kiri ke kanan adalah Gate–Drain–Source (G-D-S). Dioda Silikon = 0,6V (Germanium = 0,2V); IC tidak bisa diukur multitester; Trafo hanya bekerja pada tegangan AC.',
  },
  {
    id: 'abc-15',
    type: 'abc',
    clusterId: 'cluster-5',
    topicTag: 'Troubleshooting Restart',
    prompt: 'Pada prosedur troubleshooting PC yang sering Restart sendiri, pada batas tegangan berapakah baterai CMOS dinyatakan lemah dan wajib diganti?',
    options: [
      { key: 'A', text: 'Di bawah 5 Volt' },
      { key: 'B', text: 'Di bawah 2 Volt (tegangan normal baru 3 Volt)' },
      { key: 'C', text: 'Di bawah 12 Volt' },
      { key: 'D', text: 'Di bawah 0,6 Volt' },
    ],
    correctKey: 'B',
    explanation: 'Sesuai modul halaman 40: cek voltase baterai CMOS CR2032 dengan AVO meter; apabila sudah di bawah 2 Volt maka harus diganti.',
  },
  ...EXTRA_ABC_QUESTIONS,
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: 'gl-bios',
    term: 'BIOS (Basic Input Output System)',
    category: 'Hardware & Chipset',
    definition: 'Program firmware kecil di dalam chip IC ROM/Flash motherboard untuk inisialisasi hardware (POST) dan memuat Sistem Operasi saat booting.',
    examTrap: 'Bersifat non-volatile (tidak hilang saat listrik mati).',
  },
  {
    id: 'gl-cmos',
    term: 'CMOS (Complementary Metal-Oxide Semiconductor)',
    category: 'Hardware & Chipset',
    definition: 'Memori kecil bertenaga baterai koin lithium CR2032 (3V) untuk menyimpan konfigurasi BIOS serta jam & tanggal sistem.',
    examTrap: 'Lepas baterai CMOS untuk mereset konfigurasi BIOS; ganti jika < 2 Volt.',
  },
  {
    id: 'gl-northbridge',
    term: 'Northbridge (MCH)',
    category: 'Hardware & Chipset',
    definition: 'Chipset pengendali lalu lintas data berkecepatan tinggi yang menjembatani Processor (CPU), RAM, dan kartu grafis (AGP/PCIe x16) serta power management.',
    examTrap: 'Jangan tertukar dengan Southbridge yang menangani periferal lambat.',
  },
  {
    id: 'gl-southbridge',
    term: 'Southbridge (ICH)',
    category: 'Hardware & Chipset',
    definition: 'Chipset pengendali periferal kecepatan rendah: kontroler SATA/IDE, slot PCI, ROM BIOS, port USB, Ethernet LAN, Keyboard/Mouse, dan Audio.',
  },
  {
    id: 'gl-pcie',
    term: 'PCI Express x16 vs x1',
    category: 'Hardware & Chipset',
    definition: 'Slot ekspansi serial modern; PCIe x16 khusus kartu grafis (VGA) berkecepatan tinggi, sedangkan PCIe x1 untuk kartu periferal tambahan selain VGA.',
  },
  {
    id: 'gl-spdif',
    term: 'Port SPDIF',
    category: 'Hardware & Chipset',
    definition: 'Sony/Philips Digital Interface (#20 Back Panel) untuk menghubungkan komputer dengan perangkat audio digital seperti Home Theatre.',
  },
  {
    id: 'gl-firewire',
    term: 'Port Firewire (IEEE 1394)',
    category: 'Hardware & Chipset',
    definition: 'Port Back Panel (#21) untuk periferal eksternal berkecepatan tinggi seperti video capture atau streaming video.',
  },
  {
    id: 'gl-volatile',
    term: 'Volatile Memory (RAM)',
    category: 'Memori & Storage',
    definition: 'Memori kerja sementara yang membutuhkan aliran listrik untuk mempertahankan data; isinya terhapus saat komputer dimatikan.',
  },
  {
    id: 'gl-simm-dimm',
    term: 'SIMM vs DIMM vs SODIMM',
    category: 'Memori & Storage',
    definition: 'SIMM hanya 1 sisi kaki aktif (dipasang berpasangan 2/4 keping); DIMM kedua sisi aktif (cukup 1 keping); SODIMM adalah RAM ringkas untuk laptop.',
  },
  {
    id: 'gl-rpm',
    term: 'RPM (Revolutions Per Minute)',
    category: 'Memori & Storage',
    definition: 'Satuan kecepatan putaran piringan magnetik (platter) harddisk per menit (5.400, 7.200, hingga 10.000–15.000 RPM pada SCSI).',
  },
  {
    id: 'gl-sata-ide',
    term: 'SATA vs IDE (PATA)',
    category: 'Memori & Storage',
    definition: 'SATA memakai kabel serial tipis 7-pin (1,5–6 GB/s, hot-swap, NCQ); IDE/PATA memakai kabel pita lebar 40-wire (maks 18 inci) dengan jumper Master/Slave.',
  },
  {
    id: 'gl-smps',
    term: 'SMPS (Switching Mode Power Supply)',
    category: 'Kelistrikan',
    definition: 'Rangkaian inti di dalam PSU yang mengubah listrik AC 220V PLN menjadi tegangan DC (+3.3V, +5V, +12V, -12V, +5VSB) secara efisien.',
  },
  {
    id: 'gl-emi',
    term: 'EMI (Electromagnetic Interference)',
    category: 'Kelistrikan',
    definition: 'Induksi gelombang elektromagnetik akibat pensaklaran SMPS yang dapat menimbulkan noise audio/video dan mengganggu sinyal BUS—diredam oleh casing logam PSU.',
  },
  {
    id: 'gl-stavolt',
    term: 'Stavolt / AVR',
    category: 'Kelistrikan',
    definition: 'Automatic Voltage Regulator: alat penstabil fluktuasi voltase listrik PLN agar tetap konstan di 220V (tidak punya baterai cadangan).',
  },
  {
    id: 'gl-ups',
    term: 'UPS (Uninterruptible Power Supply)',
    category: 'Kelistrikan',
    definition: 'Perangkat cadangan daya baterai darurat agar komputer tetap menyala beberapa menit saat listrik PLN padam tiba-tiba.',
  },
  {
    id: 'gl-mbr',
    term: 'MBR (Master Boot Record)',
    category: 'Partisi & File System',
    definition: 'Skema tabel partisi lawas berbasis Legacy BIOS dengan batas maksimal disk 2 TB, maksimal 4 partisi primer, dan hanya 1 sektor tabel.',
  },
  {
    id: 'gl-gpt',
    term: 'GPT (GUID Partition Table)',
    category: 'Partisi & File System',
    definition: 'Skema partisi modern berbasis UEFI dengan dukungan kapasitas >2 TB (hingga 18 EB), hingga 128 partisi primer mandiri, dan cadangan tabel CRC32.',
  },
  {
    id: 'gl-unallocated',
    term: 'Unallocated Space',
    category: 'Partisi & File System',
    definition: 'Kapasitas ruang kosong pada harddisk (ditandai warna hitam di Disk Management) yang belum dialokasikan ke dalam partisi mana pun.',
  },
  {
    id: 'gl-dynamic',
    term: 'Dynamic Disk (LDM)',
    category: 'Partisi & File System',
    definition: 'Tipe disk Windows berbasis Logical Disk Manager yang memungkinkan volume spanned/striped melintasi beberapa harddisk fisik sekaligus.',
  },
  {
    id: 'gl-ntfs',
    term: 'NTFS (New Technology File System)',
    category: 'Partisi & File System',
    definition: 'Format sistem berkas default Windows modern dengan fitur hak akses (permissions), enkripsi, kompresi, dan journaling. Wajib untuk partisi instalasi Windows.',
  },
  {
    id: 'gl-fat32',
    term: 'FAT32 (File Allocation Table 32-bit)',
    category: 'Partisi & File System',
    definition: 'Sistem berkas kompatibel luas untuk perangkat lama namun memiliki kelemahan mendasar berupa batas maksimal ukuran satu file hanya 4 GB.',
  },
  {
    id: 'gl-eula',
    term: 'EULA (End User License Agreement)',
    category: 'EULA & Keamanan Siber',
    definition: 'Perjanjian kontrak hukum mengikat antara pengguna dan penerbit software; pembeli memperoleh hak izin pakai (lisensi), bukan kepemilikan kode program.',
  },
  {
    id: 'gl-re',
    term: 'Reverse Engineering',
    category: 'EULA & Keamanan Siber',
    definition: 'Proses membongkar file biner terkompilasi menggunakan disassembler untuk menganalisis cara kerja internal dan algoritma proteksi software.',
  },
  {
    id: 'gl-patch',
    term: 'Patch (Alat Crack)',
    category: 'EULA & Keamanan Siber',
    definition: 'Program kecil yang memodifikasi langsung byte kode mesin pada file fisik .exe/.dll (misal mengubah lompatan JNZ menjadi JZ/NOP).',
  },
  {
    id: 'gl-keygen',
    term: 'Keygen (Key Generator)',
    category: 'EULA & Keamanan Siber',
    definition: 'Aplikasi buatan cracker yang mereplikasi algoritma enkripsi vendor untuk membangkitkan nomor serial / Product Key bajakan yang valid.',
  },
  {
    id: 'gl-loader',
    term: 'Loader (Alat Crack)',
    category: 'EULA & Keamanan Siber',
    definition: 'Program injektor yang memanipulasi alur eksekusi aplikasi di memori RAM saat mulai dijalankan tanpa mengubah file fisik di harddisk.',
  },
  {
    id: 'gl-ransomware',
    term: 'Ransomware & Backdoor',
    category: 'EULA & Keamanan Siber',
    definition: 'Ransomware mengenkripsi seluruh dokumen penting korban dan menuntut tebusan uang; Backdoor adalah pintu belakang rahasia untuk kendali jarak jauh ilegal.',
  },
  ...EXTRA_GLOSSARY_ITEMS,
];
