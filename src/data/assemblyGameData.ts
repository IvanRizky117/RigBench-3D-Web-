import type {
  AssemblyInventoryItem,
  AssemblyStepId,
  CPanelWireId,
  FPanelZoneId,
} from '../types/rigbench';

export const FPANEL_WIRE_KEY_BY_STEP: Partial<Record<AssemblyStepId, CPanelWireId>> = {
  'wire-hdd-led': 'hdd-led',
  'wire-pled-pos': 'p-led-pos',
  'wire-pled-neg': 'p-led-neg',
  'wire-reset-sw': 'reset-sw',
  'wire-power-sw': 'power-sw',
};

export const FPANEL_STEP_BY_WIRE_KEY: Record<CPanelWireId, AssemblyStepId> = {
  'hdd-led': 'wire-hdd-led',
  'p-led-pos': 'wire-pled-pos',
  'p-led-neg': 'wire-pled-neg',
  'reset-sw': 'wire-reset-sw',
  'power-sw': 'wire-power-sw',
};

export const FPANEL_CORRECT_ZONE_BY_WIRE: Record<CPanelWireId, FPanelZoneId> = {
  'hdd-led': 'fpanel-orange-13',
  'p-led-pos': 'fpanel-green-2',
  'p-led-neg': 'fpanel-green-4',
  'reset-sw': 'fpanel-blue-57',
  'power-sw': 'fpanel-red-68',
};

export const FPANEL_ZONE_LABELS: Record<FPanelZoneId, string> = {
  'fpanel-orange-13': 'Pin 1–3 Oranye (HDD LED)',
  'fpanel-green-2': 'Pin 2 Hijau (+P LED)',
  'fpanel-green-4': 'Pin 4 Hijau (-P LED)',
  'fpanel-blue-57': 'Pin 5–7 Biru (RESET SW)',
  'fpanel-red-68': 'Pin 6–8 Merah (POWER SW)',
  'fpanel-black-9': 'Pin 9 Hitam (Key / NC — Kosong)',
};

export const FPANEL_ALL_ZONES: FPanelZoneId[] = [
  'fpanel-orange-13',
  'fpanel-green-2',
  'fpanel-green-4',
  'fpanel-blue-57',
  'fpanel-red-68',
  'fpanel-black-9',
];

/**
 * Beginner-friendly floating 3D arrow labels shown exclusively in Practice Mode (Latihan).
 */
export function getPracticeTargetGuideLabel(
  stepId: AssemblyStepId | null,
  ideBoardConnected: boolean,
  heatsinkLockedCount: number,
  allPartsInstalled: boolean
): string | null {
  if (allPartsInstalled) return 'Klik Power / Uji POST';
  if (!stepId) return null;
  switch (stepId) {
    case 'open-cpu-lever':
      return 'Klik Tuas LGA 775';
    case 'install-cpu':
      return 'Pasang CPU · [R] Pin-1';
    case 'close-cpu-lever':
      return 'Kunci Tuas LGA 775';
    case 'apply-thermal-paste':
      return 'Oles Thermal Paste';
    case 'install-heatsink':
      return 'Pasang Heatsink Fan';
    case 'lock-heatsink-pins':
      return `Klik 4 Push-Pin (${heatsinkLockedCount}/4)`;
    case 'install-ram-1':
      return 'Slot DIMM 1 · [R] Notch';
    case 'install-ram-2':
      return 'Slot DIMM 2 · [R] Notch';
    case 'install-cmos':
      return '#10 Dudukan CMOS 3V';
    case 'install-vga':
      return '#05 Slot VGA PCIe x16';
    case 'lock-vga-screw':
      return 'Klik Baut Braket VGA';
    case 'install-hdd-jumper':
      return 'Tancap Jumper: Kolom MASTER';
    case 'install-hdd-unit':
      return 'Dudukan HDD 3.5" IDE';
    case 'install-ide-cable':
      return ideBoardConnected
        ? 'Ujung 2: Port IDE HDD · [R] Pin-1'
        : 'Ujung 1: #12 Port IDE Board [R]';
    case 'install-hdd-molex':
      return 'Molex 4-Pin HDD · [R] Bevel';
    case 'wire-hdd-led':
      return 'Blok Oranye Pin 1–3 [R]';
    case 'wire-pled-pos':
      return 'Blok Hijau Pin 2 (+) [R]';
    case 'wire-pled-neg':
      return 'Blok Hijau Pin 4 (-) [R]';
    case 'wire-reset-sw':
      return 'Blok Biru Pin 5–7 (RESET)';
    case 'wire-power-sw':
      return 'Blok Merah Pin 6–8 (POWER)';
    case 'install-atx-24pin':
      return '#14 ATX 24-Pin · [R] Klip';
    case 'install-atx-4pin':
      return 'CPU ATX 4-Pin · [R] Klip';
    default:
      return null;
  }
}

/**
 * Real-World 22-Step STMIK AKI PC Assembly Sequence (Authentic Old IDE HDD Architecture):
 * - Mechanical fastening: 4 Clickable Heatsink Push-Pins + VGA Bracket Screw
 * - Pure IDE 3.5" HDD: 1 Tiny Plastic Jumper Cap (MA/SL/CS) + 1 Gray IDE 40-Wire Data Cable (2 Ends, [R] Pin-1) + 1 PSU Molex 4-Pin Power Cable
 * - 6-zone color-coded F_PANEL 9-pin with [R] LED polarity check & dangling loose casing wires
 * - Split ATX 24-Pin Mainboard + ATX 4-Pin 12V CPU power connectors
 */
export const STRICT_ASSEMBLY_ITEMS: AssemblyInventoryItem[] = [
  {
    id: 'open-cpu-lever',
    stepOrder: 1,
    label: 'Buka Tuas LGA 775',
    shortLabel: 'Buka Tuas',
    category: 'cpu',
    targetSocketId: 'cpu-socket',
    targetSocketLabel: '#01 Soket Prosesor LGA 775',
    rulePrompt:
      'Langkah 1: Klik tuas Soket LGA 775 (#01) untuk mengangkat pelat penahan baja sebelum memasang prosesor.',
    wrongOrderHint:
      'Aturan Modul STMIK AKI: Tuas pengunci Soket LGA 775 wajib dibuka pertama kali sebelum memasang CPU.',
    wrongSocketHint: 'Arahkan ke #01 Soket Prosesor LGA 775 di sisi kanan atas motherboard.',
    successNote: 'Tuas kawat baja LGA 775 terangkat 90° dan soket siap menerima prosesor.',
  },
  {
    id: 'install-cpu',
    stepOrder: 2,
    label: 'Prosesor Intel LGA 775',
    shortLabel: 'CPU LGA775',
    category: 'cpu',
    targetSocketId: 'cpu-socket',
    targetSocketLabel: '#01 Soket Prosesor LGA 775',
    rulePrompt:
      'Langkah 2: Putar Prosesor memakai [R] hingga panah segitiga emas sejajar sudut Pin-1 soket, lalu pasang ke #01 Soket LGA 775.',
    wrongOrderHint:
      'Urutan STMIK AKI: Setelah tuas terbuka, segera pasang keping Prosesor LGA 775 agar 775 pin mikro terlindungi.',
    wrongSocketHint: 'Keping Prosesor hanya bisa dipasang pada #01 Soket Prosesor LGA 775.',
    successNote: 'Segitiga emas Pin-1 sejajar! Prosesor LGA 775 duduk rata dan presisi.',
    requiresRotation: true,
  },
  {
    id: 'close-cpu-lever',
    stepOrder: 3,
    label: 'Kunci Tuas Soket',
    shortLabel: 'Kunci Tuas',
    category: 'cpu',
    targetSocketId: 'cpu-socket',
    targetSocketLabel: '#01 Soket Prosesor LGA 775',
    rulePrompt:
      'Langkah 3: Kunci kembali pelat baja dan kaitkan tuas pengunci LGA 775 agar kontak 775 pin prosesor rapat sempurna.',
    wrongOrderHint:
      'Aturan Modul: Kunci tuas soket LGA 775 terlebih dahulu sebelum mengoles thermal paste!',
    wrongSocketHint: 'Klik #01 Soket Prosesor untuk menutup pelat penahan dan mengaitkan tuas.',
    successNote: 'Pelat baja tertutup dan tuas pengunci LGA 775 terkunci rapat.',
  },
  {
    id: 'apply-thermal-paste',
    stepOrder: 4,
    label: 'Thermal Paste',
    shortLabel: 'Thermal Paste',
    category: 'cpu',
    targetSocketId: 'cpu-socket',
    targetSocketLabel: '#01 Permukaan IHS Prosesor',
    rulePrompt:
      'Langkah 4: Oleskan lapisan tipis Thermal Paste pada pusat IHS Prosesor untuk menghantarkan panas ke heatsink.',
    wrongOrderHint:
      'Aturan Pendinginan CPU: Wajib mengoleskan Thermal Paste di atas IHS sebelum meletakkan Heatsink Fan!',
    wrongSocketHint: 'Arahkan tepat pada permukaan IHS Prosesor di #01 Soket Prosesor.',
    successNote: 'Thermal paste abu-abu metalik teroles merata di pusat IHS prosesor.',
  },
  {
    id: 'install-heatsink',
    stepOrder: 5,
    label: 'Heatsink & Fan CPU',
    shortLabel: 'Heatsink Fan',
    category: 'cpu',
    targetSocketId: 'cpu-socket',
    targetSocketLabel: '#01 Soket Prosesor + CPU_FAN',
    rulePrompt:
      'Langkah 5: Dudukkan Heatsink sirip radial & kipas di atas CPU lalu lanjutkan mengunci 4 push-pin sudut.',
    wrongOrderHint:
      'Urutan STMIK AKI: Letakkan Heatsink & Fan CPU segera setelah mengoles thermal paste.',
    wrongSocketHint: 'Arahkan Heatsink & Fan CPU tepat di atas #01 Soket Prosesor.',
    successNote: 'Heatsink duduk di atas IHS! Sekarang klik dan kunci 4 push-pin yang berdenyut.',
  },
  {
    id: 'lock-heatsink-pins',
    stepOrder: 6,
    label: 'Kunci 4 Push-Pin Heatsink',
    shortLabel: '4 Push-Pin',
    category: 'cpu',
    targetSocketId: 'heatsink-pin-0',
    targetSocketLabel: '4 Sudut Push-Pin Heatsink (Menyilang)',
    rulePrompt:
      'Langkah 6: Klik langsung keempat kaki push-pin di sudut Heatsink CPU (secara menyilang) hingga semuanya turun terkunci!',
    wrongOrderHint:
      'Mekanik Nyata: Wajib menekan dan mengunci 4 push-pin Heatsink CPU terlebih dahulu agar pendingin menempel rapat!',
    wrongSocketHint: 'Klik langsung pada 4 kepala push-pin bulat di keempat sudut Heatsink CPU.',
    successNote: 'KLIK! Keempat push-pin Heatsink CPU terkunci menyilang dengan tekanan merata.',
  },
  {
    id: 'install-ram-1',
    stepOrder: 7,
    label: 'RAM DDR2 Keping 1 (DIMM 1)',
    shortLabel: 'RAM Keping 1',
    category: 'memory-expansion',
    targetSocketId: 'ram-slot-1',
    targetSocketLabel: '#02 Slot DIMM 1 (Cyan Pertama)',
    rulePrompt:
      'Langkah 7: Putar RAM Keping 1 memakai [R] hingga panah notch sejajar, lalu pasang ke Slot DIMM 1 sampai klip putih mengunci.',
    wrongOrderHint:
      'Urutan STMIK AKI: Setelah sub-sistem CPU & 4 push-pin terkunci, pasang RAM DDR2 Keping 1 ke Slot DIMM 1.',
    wrongSocketHint: 'Pasang RAM Keping 1 ke Slot DIMM 1 (slot memori cyan pertama pada #02).',
    successNote: 'KLIK! RAM DDR2 Keping 1 terkunci di Slot DIMM 1 oleh kedua klip pengunci putih.',
    requiresRotation: true,
  },
  {
    id: 'install-ram-2',
    stepOrder: 8,
    label: 'RAM DDR2 Keping 2 (DIMM 2)',
    shortLabel: 'RAM Keping 2',
    category: 'memory-expansion',
    targetSocketId: 'ram-slot-2',
    targetSocketLabel: '#02 Slot DIMM 2 (Dual-Channel)',
    rulePrompt:
      'Langkah 8: Putar RAM Keping 2 memakai [R] hingga panah notch sejajar, lalu pasang ke Slot DIMM 2 (Dual-Channel).',
    wrongOrderHint:
      'Urutan Dual-Channel: Pasang RAM DDR2 Keping 2 ke Slot DIMM 2 setelah Keping 1 terpasang rapat.',
    wrongSocketHint: 'Pasang RAM Keping 2 ke Slot DIMM 2 (slot memori cyan kedua pada #02).',
    successNote: 'KLIK! RAM DDR2 Keping 2 terkunci di Slot DIMM 2 — Dual-Channel aktif!',
    requiresRotation: true,
  },
  {
    id: 'install-cmos',
    stepOrder: 9,
    label: 'Baterai CMOS CR2032',
    shortLabel: 'CMOS 3V',
    category: 'memory-expansion',
    targetSocketId: 'cmos-battery',
    targetSocketLabel: '#10 Dudukan Baterai CMOS',
    rulePrompt:
      'Langkah 9: Pasang Baterai Koin Lithium CR2032 3V ke #10 Dudukan CMOS agar konfigurasi BIOS tersimpan.',
    wrongOrderHint:
      'Urutan Praktikum: Pasang Baterai CMOS CR2032 (#10) setelah kedua keping RAM selesai.',
    wrongSocketHint: 'Arahkan ke dudukan bulat hitam #10 Baterai CMOS dekat Southbridge.',
    successNote: 'Baterai koin CR2032 3V terkunci di bawah klip logam dudukan CMOS.',
  },
  {
    id: 'install-vga',
    stepOrder: 10,
    label: 'VGA Card PCIe x16',
    shortLabel: 'VGA PCIe x16',
    category: 'memory-expansion',
    targetSocketId: 'pcie-x16',
    targetSocketLabel: '#05 Slot PCI Express x16',
    rulePrompt:
      'Langkah 10: Pasang VGA Card ke #05 Slot PCI Express x16 (slot oranye panjang) hingga kait pengunci ujung slot menutup.',
    wrongOrderHint:
      'Urutan Praktikum: Pasang Kartu Grafis VGA pada Slot PCIe x16 (#05) sebelum mengunci baut braketnya.',
    wrongSocketHint: 'VGA modern wajib dipasang pada #05 Slot PCIe x16 (slot oranye panjang).',
    successNote: 'VGA Card duduk presisi di slot PCIe x16! Lanjutkan kencangkan baut braket belakangnya.',
  },
  {
    id: 'lock-vga-screw',
    stepOrder: 11,
    label: 'Kunci Baut Braket VGA',
    shortLabel: 'Baut VGA',
    category: 'memory-expansion',
    targetSocketId: 'vga-screw',
    targetSocketLabel: 'Baut Braket Logam Belakang VGA',
    rulePrompt:
      'Langkah 11: Klik langsung baut braket di ujung belakang VGA Card untuk mengencangkannya agar kartu grafis tidak goyang.',
    wrongOrderHint:
      'Mekanik Nyata: Kencangkan baut pengunci braket belakang VGA terlebih dahulu sebelum beralih ke Harddisk!',
    wrongSocketHint: 'Klik langsung pada baut bulat di tab atas braket logam VGA Card.',
    successNote: 'Baut braket VGA terkencang rapat! VGA Card kokoh di slot PCIe x16.',
  },
  {
    id: 'install-hdd-jumper',
    stepOrder: 12,
    label: 'Jumper 2-Pin HDD (Tutup Plastik)',
    shortLabel: 'Jumper HDD',
    category: 'storage',
    targetSocketId: 'hdd-jumper-master',
    targetSocketLabel: 'Kolom Pin MA / MASTER (Kiri) Blok 8-Pin HDD',
    rulePrompt:
      'Langkah 12 (HDD IDE 1/4 · E-Book Hal. 17–18): Tancapkan tutup plastik kecil Jumper 2-Pin ke kolom MA (MASTER kiri) di belakang Harddisk 3.5".',
    wrongOrderHint:
      'Wajib E-Book Hal. 17–18: Tancapkan penutup plastik Jumper 2-pin ke kolom MASTER di belakang HDD sebelum mendudukkannya!',
    wrongSocketHint:
      'Tancapkan Jumper tepat pada kolom kiri (MA / MASTER) di blok 8-pin belakang HDD — bukan SL (Slave) atau CS!',
    successNote: 'Penutup plastik Jumper 2-Pin terpasang di kolom MA (MASTER) untuk drive OS utama.',
  },
  {
    id: 'install-hdd-unit',
    stepOrder: 13,
    label: 'Unit Harddisk 3.5" IDE (PATA)',
    shortLabel: 'Unit HDD IDE',
    category: 'storage',
    targetSocketId: 'hdd-bay',
    targetSocketLabel: 'Braket Dudukan HDD Meja Anti-Statis',
    rulePrompt:
      'Langkah 13 (HDD IDE 2/4): Dudukkan Unit Harddisk 3.5" IDE yang sudah ber-jumper ke braket dudukan di depan motherboard.',
    wrongOrderHint:
      'Urutan Storage: Setelah Jumper 2-Pin terpasang di belakang HDD, dudukkan Unit Harddisk ke braket sebelum menarik kabel!',
    wrongSocketHint: 'Arahkan Unit Harddisk 3.5" ke braket dudukan HDD di sisi depan kiri motherboard.',
    successNote: 'Unit Harddisk 3.5" IDE duduk rata! Siap disambung 1 Kabel Data IDE & 1 Kabel Power Molex.',
  },
  {
    id: 'install-ide-cable',
    stepOrder: 14,
    label: 'Kabel Pita IDE 40-Wire (Data · 2 Ujung)',
    shortLabel: 'Kabel IDE Data',
    category: 'storage',
    targetSocketId: 'ide-port',
    secondarySocketId: 'hdd-ide-port',
    targetSocketLabel: 'Ujung 1: #12 Port IDE Board → Ujung 2: Port IDE HDD',
    rulePrompt:
      'Langkah 14 (HDD IDE 3/4 · Jalur Data): Tekan [R] sejajarkan garis merah Pin-1 & tonjolan key di KEDUA ujung — pasang Ujung 1 ke #12 Port IDE biru lalu Ujung 2 ke Port IDE belakang HDD.',
    wrongOrderHint:
      'Urutan Storage IDE: Pasang Kabel Pita IDE 40-Wire (jalur data, 2 ujung) setelah Harddisk duduk di braket.',
    wrongSocketHint:
      'Pasang Ujung 1 ke #12 Port IDE biru di motherboard dulu, lalu sambungkan Ujung 2 ke Port IDE 40-pin di belakang kiri HDD.',
    successNote: 'Kedua ujung Kabel Pita IDE 40-Wire (jalur data) terpasang presisi dengan garis merah Pin-1!',
    requiresRotation: true,
  },
  {
    id: 'install-hdd-molex',
    stepOrder: 15,
    label: 'Kabel Power Molex 4-Pin (Listrik HDD)',
    shortLabel: 'Power Molex 4P',
    category: 'storage',
    targetSocketId: 'hdd-molex-port',
    targetSocketLabel: 'Port Power Molex 4-Pin Putih (Belakang Kanan HDD)',
    rulePrompt:
      'Langkah 15 (HDD IDE 4/4 · Suplai Listrik): Tekan [R] pastikan sisi miring D-Shape Molex menghadap atas (Kuning 12V di kiri), lalu tancapkan ke soket putih kanan belakang HDD.',
    wrongOrderHint:
      'Wajib Kelistrikan HDD IDE: Sambungkan Kabel Power Molex 4-Pin ke belakang kanan Harddisk agar motor piringan mendapat daya 12V & 5V!',
    wrongSocketHint: 'Arahkan konektor putih Molex 4-Pin ke port putih besar di sisi kanan belakang Harddisk 3.5".',
    successNote: 'Kabel Power Molex 4-Pin (Kuning-Hitam-Hitam-Merah) terkunci rapat — data IDE & listrik HDD lengkap!',
    requiresRotation: true,
  },
  {
    id: 'wire-hdd-led',
    stepOrder: 16,
    label: 'F_PANEL: HDD LED (Pin 1–3 Oranye)',
    shortLabel: 'HDD LED 1-3',
    category: 'c-panel',
    targetSocketId: 'fpanel-orange-13',
    targetSocketLabel: 'Blok Oranye Pin 1 & 3 (Kiri Atas)',
    rulePrompt:
      'Langkah 16 (F_PANEL 1/5): Putar [R] cek polaritas (+/-) kabel Merah-Putih HDD LED, lalu tancapkan TEPAT di Blok Oranye (Pin 1 & 3).',
    wrongOrderHint:
      'Urutan F_PANEL 9-Pin: Mulai dari Blok Oranye (Pin 1 & 3) untuk kabel HDD LED (Merah-Putih).',
    wrongSocketHint: 'Salah blok warna! HDD LED wajib masuk ke Blok Oranye (Pin 1 & 3 kiri atas).',
    successNote: 'Kabel HDD LED (Merah-Putih) terpasang tepat pada Blok Oranye Pin 1 & 3 dengan polaritas benar.',
    wireColorHex: '#F97316',
    requiresPolarity: true,
  },
  {
    id: 'wire-pled-pos',
    stepOrder: 17,
    label: 'F_PANEL: +P LED (Pin 2 Hijau Atas)',
    shortLabel: '+P LED Pin 2',
    category: 'c-panel',
    targetSocketId: 'fpanel-green-2',
    targetSocketLabel: 'Blok Hijau Atas Pin 2 (+)',
    rulePrompt:
      'Langkah 17 (F_PANEL 2/5): Putar [R] pastikan tanda (+) searah Pin 2, lalu tancapkan kabel Hijau +P LED TEPAT ke Pin 2 (Hijau kanan atas).',
    wrongOrderHint:
      'Urutan F_PANEL 9-Pin: Pasang kabel tunggal Hijau +P LED ke Pin 2 setelah HDD LED.',
    wrongSocketHint: 'Salah pin! +P LED wajib masuk tepat ke Pin 2 (Blok Hijau kanan atas).',
    successNote: 'Kabel +P LED (Hijau) terpasang pada kutub positif Pin 2.',
    wireColorHex: '#22C55E',
    requiresPolarity: true,
  },
  {
    id: 'wire-pled-neg',
    stepOrder: 18,
    label: 'F_PANEL: -P LED (Pin 4 Hijau Bawah)',
    shortLabel: '-P LED Pin 4',
    category: 'c-panel',
    targetSocketId: 'fpanel-green-4',
    targetSocketLabel: 'Blok Hijau Bawah Pin 4 (-)',
    rulePrompt:
      'Langkah 18 (F_PANEL 3/5): Putar [R] cek orientasi (-) lalu tancapkan kabel Putih -P LED TEPAT ke Pin 4 (Hijau kanan baris kedua).',
    wrongOrderHint:
      'Urutan F_PANEL 9-Pin: Lengkapi kutub negatif Power LED dengan kabel Putih -P LED di Pin 4.',
    wrongSocketHint: 'Salah pin! -P LED wajib masuk tepat ke Pin 4 (Blok Hijau kanan baris ke-2).',
    successNote: 'Kabel -P LED (Putih) terpasang di Pin 4 — pasangan indikator Power LED lengkap.',
    wireColorHex: '#E2E8F0',
    requiresPolarity: true,
  },
  {
    id: 'wire-reset-sw',
    stepOrder: 19,
    label: 'F_PANEL: RESET SW (Pin 5–7 Biru)',
    shortLabel: 'RESET SW 5-7',
    category: 'c-panel',
    targetSocketId: 'fpanel-blue-57',
    targetSocketLabel: 'Blok Biru Pin 5 & 7 (Kiri Bawah)',
    rulePrompt:
      'Langkah 19 (F_PANEL 4/5): Tancapkan kabel Biru-Putih RESET SW TEPAT ke Blok Biru (Pin 5 & 7 kiri bawah · tombol non-polaritas).',
    wrongOrderHint:
      'Urutan F_PANEL 9-Pin: Pasang kabel RESET SW ke Blok Biru Pin 5 & 7 setelah pasangan Power LED.',
    wrongSocketHint: 'Salah blok warna! RESET SW wajib masuk ke Blok Biru (Pin 5 & 7 kiri bawah).',
    successNote: 'Kabel RESET SW (Biru-Putih) terpasang presisi pada Blok Biru Pin 5 & 7.',
    wireColorHex: '#3B82F6',
  },
  {
    id: 'wire-power-sw',
    stepOrder: 20,
    label: 'F_PANEL: POWER SW (Pin 6–8 Merah)',
    shortLabel: 'POWER SW 6-8',
    category: 'c-panel',
    targetSocketId: 'fpanel-red-68',
    targetSocketLabel: 'Blok Merah Pin 6 & 8 (Kanan Bawah)',
    rulePrompt:
      'Langkah 20 (F_PANEL 5/5): Tancapkan kabel Oranye-Putih POWER SW TEPAT ke Blok Merah (Pin 6 & 8 · jangan menyentuh Pin 9 Hitam Key!).',
    wrongOrderHint:
      'Urutan F_PANEL 9-Pin: Tuntaskan kabel F_PANEL dengan memasang POWER SW ke Blok Merah Pin 6 & 8.',
    wrongSocketHint: 'Salah blok warna! POWER SW wajib masuk ke Blok Merah (Pin 6 & 8 kanan bawah).',
    successNote: 'Kabel POWER SW terpasang di Blok Merah Pin 6 & 8 — seluruh 5 kabel F_PANEL selesai!',
    wireColorHex: '#EF4444',
  },
  {
    id: 'install-atx-24pin',
    stepOrder: 21,
    label: 'Kabel Daya ATX 24-Pin Mainboard',
    shortLabel: 'ATX 24-Pin',
    category: 'power',
    targetSocketId: 'atx-power',
    targetSocketLabel: '#14 Port Power ATX 24-Pin',
    rulePrompt:
      'Langkah 21 (Daya 1/2): Tekan [R] sejajarkan klip pengunci samping ATX 24-Pin ke kait soket #14, lalu tancapkan hingga terkunci rapat.',
    wrongOrderHint:
      'Keamanan Kelistrikan STMIK AKI: Kabel daya ATX 24-Pin selalu dipasang setelah semua komponen & kabel sinyal F_PANEL tuntas!',
    wrongSocketHint: 'Arahkan ke #14 Port Power ATX 24-Pin berwarna putih panjang di sisi bawah motherboard.',
    successNote: 'Kabel daya utama ATX 24-Pin terkunci rapat di motherboard!',
    requiresRotation: true,
  },
  {
    id: 'install-atx-4pin',
    stepOrder: 22,
    label: 'Kabel Daya CPU ATX 4-Pin 12V',
    shortLabel: 'CPU 4-Pin 12V',
    category: 'power',
    targetSocketId: 'atx-4pin',
    targetSocketLabel: 'Port ATX 12V 4-Pin (Dekat VRM CPU)',
    rulePrompt:
      'Langkah 22 (Daya 2/2 · Terakhir): Tekan [R] sejajarkan klip pengunci ATX 4-Pin 12V ke kait soket kotak putih dekat VRM CPU, lalu tancapkan!',
    wrongOrderHint:
      'Urutan Daya PSU: Sambungkan kabel daya tambahan CPU ATX 4-Pin 12V terakhir sebelum menyalakan PSU!',
    wrongSocketHint: 'Arahkan ke soket putih kotak 4-pin (ATX_12V) di dekat kapasitor VRM sisi kanan atas CPU.',
    successNote: 'Daya CPU 4-Pin 12V tersambung! Set saklar PSU ke 220V lalu tekan Power untuk Uji POST.',
    requiresRotation: true,
  },
];
