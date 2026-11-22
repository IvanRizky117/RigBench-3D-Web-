import { MAINBOARD_COMPONENTS } from './mainboardData';
import type { TheaterVisualType } from '../types/rigbench';
import {
  buildPhoneticWordTimeline,
  findPhraseStartWordIndex,
  snapKeyframePctsToWaveform,
} from '../utils/waveformSync';

export type TheaterSceneKind =
  | 'motherboard'
  | 'ram-diorama'
  | 'cpu-diorama'
  | 'psu-diorama'
  | 'hdd-diorama'
  | 'electronics-diorama'
  | 'monitor-os'
  | 'monitor-eula'
  | 'monitor-crack';

export type TheaterDomainColor =
  | '#38BDF8'
  | '#F59E0B'
  | '#10B981'
  | '#A855F7'
  | '#F43F5E';

export interface DirectorKeyframe {
  id: string;
  /** Exact opening phrase in segment.narration where camera must glide to this component. Empty string = start of segment (0%). */
  triggerPhrase: string;
  /** Fallback percentage used only if triggerPhrase isn't found in narration. */
  fallbackPct: number;
  /** Resolved exact percentage (0..100) after phonetic + WAV pause sync. */
  startPct: number;
  /** Resolved global word index in segment.narration for instant exact seeking & local TTS lock. */
  startWordIndex: number;
  shortLabel: string;
  pdfBadge: string;
  title: string;
  /** Strictly 1 concise core-function sentence. */
  functionSummary: string;
  /** Strictly 1 concise exam key point. */
  examTip: string;
  domainColor: TheaterDomainColor;
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
  anchor3D: [number, number, number];
  highlightId?: string;
  mechAction?: string;
}

export interface SegmentDirectorPlan {
  sceneKind: TheaterSceneKind;
  is3D: boolean;
  defaultCameraPos: [number, number, number];
  defaultCameraLookAt: [number, number, number];
  keyframes: DirectorKeyframe[];
}

function conciseSentence(text: string): string {
  const clean = text.trim();
  const dotIdx = clean.indexOf('. ');
  if (dotIdx > 24 && dotIdx < 165) {
    return clean.slice(0, dotIdx + 1);
  }
  return clean;
}

function getMoboSpec(id: string) {
  const found = MAINBOARD_COMPONENTS.find((c) => c.id === id);
  if (!found) {
    return {
      pinNumber: '#01',
      name: 'Motherboard',
      shortName: 'Mainboard',
      position: [0, 0.4, 0] as [number, number, number],
      cameraOffset: [0, 6, 7] as [number, number, number],
      functionEssay: 'Papan sirkuit utama penghubung seluruh komponen PC.',
      examTrap: 'Hafalkan 24 titik modul STMIK AKI.',
    };
  }
  return found;
}

function moboPointKeyframe(
  compId: string,
  triggerPhrase: string,
  fallbackPct: number,
  domainColor: TheaterDomainColor,
  mechAction?: string,
  shortOverride?: string,
  cameraAdjust?: [number, number, number]
): DirectorKeyframe {
  const spec = getMoboSpec(compId);
  const cam: [number, number, number] = cameraAdjust
    ? [
        spec.cameraOffset[0] + cameraAdjust[0],
        spec.cameraOffset[1] + cameraAdjust[1],
        spec.cameraOffset[2] + cameraAdjust[2],
      ]
    : [...spec.cameraOffset];
  return {
    id: `${compId}-${Math.round(fallbackPct)}`,
    triggerPhrase,
    fallbackPct,
    startPct: fallbackPct,
    startWordIndex: 0,
    shortLabel: shortOverride ?? `${spec.pinNumber} ${spec.shortName}`,
    pdfBadge: spec.pinNumber,
    title: spec.name,
    functionSummary: conciseSentence(spec.functionEssay),
    examTip: conciseSentence(spec.examTrap),
    domainColor,
    cameraPos: cam,
    cameraLookAt: [...spec.position],
    anchor3D: [...spec.position],
    highlightId: compId,
    mechAction,
  };
}

export const THEATER_DIRECTOR_PLANS: Record<TheaterVisualType, SegmentDirectorPlan> = {
  // ── KLASTER 1 · SUB-BAB 1: Siklus Kerja Komputer (Studio 3D Motherboard) ──
  'ipo-cycle': {
    sceneKind: 'motherboard',
    is3D: true,
    defaultCameraPos: [6.4, 5.8, 7.2],
    defaultCameraLookAt: [0, 0.35, 0],
    keyframes: [
      {
        id: 'ipo-overview',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: 'Siklus 4 Tahap',
        pdfBadge: 'IPO-S',
        title: 'Motherboard & Siklus 4 Tahap',
        functionSummary:
          'Motherboard menyatukan aliran data komputer dalam siklus berurutan: Input, Process, Output, dan Storage.',
        examTip: 'Sebutkan keempat tahap lengkap beserta contoh perangkat fisik di soal Essay.',
        domainColor: '#38BDF8',
        cameraPos: [6.5, 5.9, 7.2],
        cameraLookAt: [0, 0.35, 0],
        anchor3D: [0.1, 0.55, -0.3],
        mechAction: 'pulse-ipo',
      },
      {
        id: 'ipo-input',
        triggerPhrase: 'perangkat Input',
        fallbackPct: 30,
        startPct: 30,
        startWordIndex: 0,
        shortLabel: '01. Input (Back Panel)',
        pdfBadge: 'INPUT',
        title: 'Perangkat Input via Back Panel',
        functionSummary:
          'Instruksi keyboard dan mouse masuk lewat port PS/2 & USB (#16, #17, #23) menuju jalur bus motherboard.',
        examTip: 'Contoh Input: Keyboard, Mouse, Scanner, Mikrofon.',
        domainColor: '#38BDF8',
        cameraPos: [2.2, 2.0, -6.5],
        cameraLookAt: [1.5, 0.52, -3.75],
        anchor3D: [3.35, 0.56, -3.72],
        highlightId: 'ps2-mouse',
        mechAction: 'pulse-ipo',
      },
      {
        id: 'ipo-process-cpu',
        triggerPhrase: 'menuju CPU',
        fallbackPct: 52,
        startPct: 52,
        startWordIndex: 0,
        shortLabel: '02. Process (CPU)',
        pdfBadge: '#01 CPU',
        title: 'Unit Pemroses Utama (CPU LGA 775)',
        functionSummary:
          'CPU mengeksekusi operasi aritmatika dan logika dari data yang mengalir melalui jalur tembaga PCB.',
        examTip: 'Prosesor terhubung langsung lewat jalur cepat FSB ke Northbridge.',
        domainColor: '#38BDF8',
        cameraPos: [3.4, 3.4, 1.3],
        cameraLookAt: [2.1, 0.5, -1.6],
        anchor3D: [2.1, 0.55, -1.6],
        highlightId: 'cpu-socket',
        mechAction: 'spin-fan',
      },
      {
        id: 'ipo-process-ram',
        triggerPhrase: 'memori sementara RAM',
        fallbackPct: 64,
        startPct: 64,
        startWordIndex: 0,
        shortLabel: '02. Memori (RAM)',
        pdfBadge: '#02 RAM',
        title: 'Memori Kerja Sementara (RAM)',
        functionSummary:
          'RAM bersifat volatile untuk menampung data aktif agar CPU dapat mengolahnya jauh lebih cepat.',
        examTip: 'Bedakan RAM (volatile) vs ROM/BIOS (non-volatile).',
        domainColor: '#A855F7',
        cameraPos: [3.6, 3.1, 4.3],
        cameraLookAt: [1.9, 0.5, 1.85],
        anchor3D: [1.9, 0.54, 1.85],
        highlightId: 'ram-slots',
        mechAction: 'seat-ram',
      },
      {
        id: 'ipo-output',
        triggerPhrase: 'tampil ke monitor',
        fallbackPct: 76,
        startPct: 76,
        startWordIndex: 0,
        shortLabel: '03. Output (VGA)',
        pdfBadge: 'OUTPUT',
        title: 'Keluaran Visual via Slot PCIe x16',
        functionSummary:
          'Hasil olahan CPU & RAM dikirim lewat jalur grafis PCIe x16 ke monitor, audio ke speaker, atau printer.',
        examTip: 'Contoh Output: Monitor, Speaker, Printer, Proyektor.',
        domainColor: '#10B981',
        cameraPos: [-1.4, 2.9, 1.2],
        cameraLookAt: [-1.5, 0.42, -1.65],
        anchor3D: [-1.5, 0.44, -1.65],
        highlightId: 'pcie-x16',
        mechAction: 'pulse-nb',
      },
      {
        id: 'ipo-storage',
        triggerPhrase: 'disimpan permanen',
        fallbackPct: 86,
        startPct: 86,
        startWordIndex: 0,
        shortLabel: '04. Storage (SATA/IDE)',
        pdfBadge: 'STORAGE',
        title: 'Penyimpanan Permanen (SATA / IDE)',
        functionSummary:
          'Data dialirkan Southbridge menuju Harddisk/SSD melalui port SATA atau IDE agar tetap tersimpan saat PC mati.',
        examTip: 'Storage bersifat non-volatile: HDD, SSD, Flashdisk, DVD-ROM.',
        domainColor: '#F59E0B',
        cameraPos: [-2.1, 2.7, 5.1],
        cameraLookAt: [-2.4, 0.36, 2.6],
        anchor3D: [-2.65, 0.4, 2.5],
        highlightId: 'sata-ports',
        mechAction: 'pulse-sb',
      },
    ],
  },

  // ── KLASTER 1 · SUB-BAB 2: Tur 15 Titik Papan Induk (#01–#15) ──
  'mainboard-15-tour': {
    sceneKind: 'motherboard',
    is3D: true,
    defaultCameraPos: [5.4, 5.8, 6.6],
    defaultCameraLookAt: [0, 0.35, 0],
    keyframes: [
      moboPointKeyframe('cpu-socket', '', 0, '#38BDF8', 'open-socket', '#01 CPU LGA775', [0.35, -0.35, -0.15]),
      moboPointKeyframe('ram-slots', 'Nomor dua', 22, '#38BDF8', 'seat-ram', '#02 Slot RAM', [0.4, -0.35, -0.2]),
      moboPointKeyframe('northbridge', 'Nomor tiga', 29, '#38BDF8', 'pulse-nb', '#03 Northbridge', [0.2, -0.35, -0.2]),
      moboPointKeyframe('southbridge', 'nomor empat', 35, '#F59E0B', 'pulse-sb', '#04 Southbridge', [0.0, -0.35, -0.2]),
      moboPointKeyframe('pcie-x16', 'nomor lima', 41, '#38BDF8', 'pulse-nb', '#05 PCIe x16', [0.2, -0.35, -0.15]),
      moboPointKeyframe('pcie-x1', 'nomor enam', 48, '#F59E0B', 'pulse-sb', '#06 PCIe x1', [0.1, -0.3, -0.15]),
      moboPointKeyframe('agp-slot', 'nomor tujuh', 54, '#38BDF8', 'pulse-nb', '#07 Slot AGP', [0.1, -0.3, -0.15]),
      moboPointKeyframe('pci-slots', 'nomor delapan', 59, '#F59E0B', 'pulse-sb', '#08 Slot PCI', [0.1, -0.3, -0.15]),
      moboPointKeyframe('bios-rom', 'nomor sembilan', 66, '#F59E0B', 'pulse-sb', '#09 ROM BIOS', [0.1, -0.25, -0.2]),
      moboPointKeyframe('cmos-battery', 'nomor sepuluh', 72, '#F59E0B', 'pulse-sb', '#10 CMOS 3V', [0.1, -0.2, -0.2]),
      moboPointKeyframe('sata-ports', 'nomor sebelas', 78, '#F59E0B', 'pulse-sb', '#11 Port SATA', [0.1, -0.25, -0.2]),
      moboPointKeyframe('ide-port', 'nomor dua belas', 83, '#F59E0B', 'pulse-sb', '#12 Port IDE', [0.0, -0.25, -0.2]),
      moboPointKeyframe('floppy-port', 'nomor tiga belas', 88, '#F59E0B', 'pulse-sb', '#13 Floppy 34p', [0.1, -0.25, -0.2]),
      moboPointKeyframe('atx-power', 'nomor empat belas', 92, '#10B981', 'pulse-ipo', '#14 ATX 24-Pin', [0.1, -0.3, -0.2]),
      moboPointKeyframe('back-panel-block', 'nomor lima belas', 96, '#A855F7', 'pulse-sb', '#15 Back Panel', [0.0, -0.2, 0.1]),
    ],
  },

  // ── KLASTER 1 · SUB-BAB 3: Northbridge vs Southbridge ──
  'chipset-bridge': {
    sceneKind: 'motherboard',
    is3D: true,
    defaultCameraPos: [2.8, 5.4, 5.2],
    defaultCameraLookAt: [-0.5, 0.4, 0.0],
    keyframes: [
      {
        id: 'cs-overview',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '2 Chipset Utama',
        pdfBadge: '#03 & #04',
        title: 'Arsitektur Dual-Chipset Motherboard',
        functionSummary:
          'Motherboard membagi jalur data menjadi domain kecepatan tinggi (Northbridge) dan periferal (Southbridge).',
        examTip: 'Jangan pernah menukar kendali Northbridge dan Southbridge di soal Essay.',
        domainColor: '#38BDF8',
        cameraPos: [3.0, 5.2, 5.0],
        cameraLookAt: [-0.4, 0.45, 0.0],
        anchor3D: [0.1, 0.58, -0.8],
        highlightId: 'northbridge',
        mechAction: 'pulse-ipo',
      },
      moboPointKeyframe('northbridge', 'Pertama ada Northbridge', 16, '#38BDF8', 'pulse-nb', '#03 Northbridge (MCH)'),
      {
        id: 'cs-nb-lanes',
        triggerPhrase: 'jalur berkecepatan tinggi',
        fallbackPct: 30,
        startPct: 30,
        startWordIndex: 0,
        shortLabel: 'Jalur Cepat (CPU·RAM·VGA)',
        pdfBadge: 'MCH BUS',
        title: 'Domain Northbridge: CPU, RAM & VGA',
        functionSummary:
          'Northbridge mengawal langsung jalur ngebut menuju CPU (#01), RAM (#02), PCIe x16/AGP (#05/#07), dan manajemen daya.',
        examTip: 'Kata kunci Northbridge: kecepatan tinggi, CPU, RAM, AGP/PCIe x16, power management.',
        domainColor: '#38BDF8',
        cameraPos: [4.1, 4.6, 2.8],
        cameraLookAt: [0.8, 0.5, -0.4],
        anchor3D: [0.1, 0.6, -0.8],
        highlightId: 'northbridge',
        mechAction: 'pulse-nb',
      },
      moboPointKeyframe('southbridge', 'Kedua ada Southbridge', 52, '#F59E0B', 'pulse-sb', '#04 Southbridge (ICH)'),
      {
        id: 'cs-sb-storage',
        triggerPhrase: 'port SATA',
        fallbackPct: 68,
        startPct: 68,
        startWordIndex: 0,
        shortLabel: 'Periferal (SATA·IDE·BIOS)',
        pdfBadge: 'ICH BUS',
        title: 'Domain Southbridge: Storage, PCI & BIOS',
        functionSummary:
          'Southbridge mengendalikan periferal kecepatan rendah: SATA (#11), IDE (#12), Slot PCI (#08), dan ROM BIOS (#09).',
        examTip: 'Semua media penyimpanan (SATA/IDE) dan ROM BIOS dikendalikan Southbridge.',
        domainColor: '#F59E0B',
        cameraPos: [-3.3, 3.8, 4.4],
        cameraLookAt: [-2.2, 0.4, 1.5],
        anchor3D: [-1.45, 0.48, 0.95],
        highlightId: 'southbridge',
        mechAction: 'pulse-sb',
      },
      {
        id: 'cs-sb-io',
        triggerPhrase: 'USB, LAN',
        fallbackPct: 82,
        startPct: 82,
        startWordIndex: 0,
        shortLabel: 'Back Panel (USB·LAN·Audio)',
        pdfBadge: 'ICH I/O',
        title: 'Southbridge Kendali Back Panel I/O',
        functionSummary:
          'Southbridge mengatur port eksternal Back Panel (#15–#24) seperti USB, RJ45 LAN, PS/2, dan Audio.',
        examTip: 'Jalur ngebut = Northbridge; Periferal & I/O = Southbridge.',
        domainColor: '#F59E0B',
        cameraPos: [-0.8, 3.5, -5.7],
        cameraLookAt: [-0.8, 0.52, -3.4],
        anchor3D: [-1.45, 0.55, -3.72],
        highlightId: 'back-panel-block',
        mechAction: 'pulse-sb',
      },
    ],
  },

  // ── KLASTER 1 · SUB-BAB 4: 9 Port Back Panel I/O (#16–#24) ──
  'back-panel-map': {
    sceneKind: 'motherboard',
    is3D: true,
    defaultCameraPos: [0.2, 1.8, -6.9],
    defaultCameraLookAt: [0.2, 0.52, -3.72],
    keyframes: [
      {
        id: 'bp-overview',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '#15 Blok I/O',
        pdfBadge: '#15',
        title: 'Blok Back Panel I/O (#15)',
        functionSummary:
          'Deretan 9 port eksternal standar warna PC99 di sisi belakang motherboard (#16 hingga #24).',
        examTip: 'Titik #15 adalah keseluruhan blok; rinciannya adalah titik #16 sampai #24.',
        domainColor: '#A855F7',
        cameraPos: [0.3, 1.85, -7.1],
        cameraLookAt: [0.3, 0.52, -3.72],
        anchor3D: [0.0, 0.6, -3.72],
        highlightId: 'back-panel-block',
        mechAction: 'pulse-sb',
      },
      moboPointKeyframe('ps2-mouse', 'Nomor enam belas', 20, '#10B981', 'pulse-sb', '#16 PS/2 Hijau', [0, -0.25, 0.7]),
      moboPointKeyframe('ps2-keyboard', 'tujuh belas', 30, '#A855F7', 'pulse-sb', '#17 PS/2 Ungu', [0, -0.25, 0.7]),
      moboPointKeyframe('parallel-port', 'delapan belas', 40, '#F43F5E', 'pulse-sb', '#18 Paralel Pink', [0, -0.25, 0.6]),
      moboPointKeyframe('serial-port', 'sembilan belas', 52, '#38BDF8', 'pulse-sb', '#19 Serial Teal', [0, -0.22, 0.7]),
      moboPointKeyframe('spdif-port', 'dua puluh SPDIF', 60, '#F59E0B', 'pulse-sb', '#20 SPDIF Audio', [0, -0.22, 0.7]),
      moboPointKeyframe('firewire-port', 'dua puluh satu', 70, '#F59E0B', 'pulse-sb', '#21 Firewire', [0, -0.25, 0.7]),
      moboPointKeyframe('rj45-port', 'dua puluh dua', 80, '#38BDF8', 'pulse-sb', '#22 RJ45 LAN', [0, -0.25, 0.7]),
      moboPointKeyframe('usb-ports', 'dua puluh tiga', 88, '#38BDF8', 'pulse-sb', '#23 Port USB', [0, -0.22, 0.7]),
      moboPointKeyframe('audio-ports', 'dua puluh empat', 93, '#10B981', 'pulse-sb', '#24 Audio 3.5mm', [0, -0.25, 0.6]),
    ],
  },

  // ── KLASTER 2 · SUB-BAB 1: ROM vs RAM & Notch SDRAM–DDR3 ──
  'ram-notch-evolution': {
    sceneKind: 'ram-diorama',
    is3D: true,
    defaultCameraPos: [0.0, 4.0, 7.2],
    defaultCameraLookAt: [0.0, 0.7, 0.0],
    keyframes: [
      {
        id: 'ram-rom-bios',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: 'ROM / BIOS',
        pdfBadge: 'ROM',
        title: 'Chip ROM BIOS (Non-Volatile)',
        functionSummary:
          'ROM menyimpan program BIOS secara permanen (tidak hilang saat listrik mati) untuk menjalankan POST dan memuat OS.',
        examTip: 'ROM = Non-Volatile (tetap tersimpan tanpa listrik); RAM = Volatile.',
        domainColor: '#F59E0B',
        cameraPos: [-4.0, 2.3, 4.2],
        cameraLookAt: [-3.5, 0.45, 0.8],
        anchor3D: [-3.5, 0.55, 0.8],
        mechAction: 'pulse-rom',
      },
      {
        id: 'ram-volatile',
        triggerPhrase: 'Sebaliknya, RAM',
        fallbackPct: 36,
        startPct: 36,
        startWordIndex: 0,
        shortLabel: 'RAM Volatile',
        pdfBadge: 'RAM',
        title: 'RAM Bersifat Volatile (Sementara)',
        functionSummary:
          'RAM menyimpan data sementara selama PC menyala untuk mempercepat pengolahan CPU secara acak.',
        examTip: 'Data di RAM langsung hilang begitu daya listrik diputus.',
        domainColor: '#38BDF8',
        cameraPos: [0.4, 3.4, 6.0],
        cameraLookAt: [0.2, 0.85, 0.0],
        anchor3D: [0.2, 1.0, 0.4],
        mechAction: 'highlight-sdram',
      },
      {
        id: 'ram-simm',
        triggerPhrase: 'modul lama SIMM',
        fallbackPct: 58,
        startPct: 58,
        startWordIndex: 0,
        shortLabel: 'SIMM vs SDRAM',
        pdfBadge: 'SIMM / 168p',
        title: 'Modul SIMM (1 Sisi) vs SDRAM DIMM (2 Notch)',
        functionSummary:
          'Modul lama SIMM hanya aktif 1 sisi dan wajib dipasang berpasangan, sedangkan SDRAM DIMM 168 pin memiliki 2 celah notch.',
        examTip: 'SIMM 30-pin = 4 keping, SIMM 72-pin = min 2 keping; SDRAM = 168 pin & 2 notch.',
        domainColor: '#10B981',
        cameraPos: [-0.8, 2.1, 4.5],
        cameraLookAt: [-0.4, 0.72, 1.45],
        anchor3D: [-0.4, 0.55, 1.45],
        mechAction: 'highlight-ddr2',
      },
      {
        id: 'ram-dimm-ddr',
        triggerPhrase: 'sedangkan DIMM',
        fallbackPct: 76,
        startPct: 76,
        startWordIndex: 0,
        shortLabel: 'DIMM DDR1–DDR3',
        pdfBadge: 'DDR2/DDR3',
        title: 'DIMM & SODIMM: Celah Notch DDR1–DDR3',
        functionSummary:
          'Modul DIMM desktop & SODIMM laptop aktif di kedua sisi sehingga cukup 1 keping, dengan posisi notch berbeda tiap generasi.',
        examTip: 'DDR2 & DDR3 sama-sama 240 pin, pembeda fisiknya notch DDR3 lebih geser ke kiri.',
        domainColor: '#A855F7',
        cameraPos: [1.5, 2.1, 3.0],
        cameraLookAt: [0.4, 0.85, -1.05],
        anchor3D: [-0.18, 0.65, -1.05],
        mechAction: 'seat-ram',
      },
    ],
  },

  // ── KLASTER 2 · SUB-BAB 2: Evolusi Processor Intel vs AMD ──
  'cpu-timeline': {
    sceneKind: 'cpu-diorama',
    is3D: true,
    defaultCameraPos: [4.8, 4.0, 6.0],
    defaultCameraLookAt: [0.0, 0.6, 0.0],
    keyframes: [
      {
        id: 'cpu-lga775',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: 'Soket LGA 775',
        pdfBadge: 'LGA 775',
        title: 'Soket LGA 775 & Duel Intel vs AMD',
        functionSummary:
          'Pada LGA 775, 775 pin emas berada di soket motherboard sementara bawah prosesor berupa bantalan datar bertanda segitiga.',
        examTip: 'Cocokkan selalu segitiga sudut prosesor dengan soket agar pin tidak bengkok.',
        domainColor: '#38BDF8',
        cameraPos: [2.8, 3.2, 4.0],
        cameraLookAt: [-1.4, 0.55, 0.2],
        anchor3D: [-1.4, 0.62, 0.2],
        mechAction: 'seat-cpu',
      },
      {
        id: 'cpu-intel-early',
        triggerPhrase: 'Intel melesat',
        fallbackPct: 20,
        startPct: 20,
        startWordIndex: 0,
        shortLabel: 'Intel i386–P4',
        pdfBadge: '1985–2000',
        title: 'Era Awal Intel: i386 hingga Pentium 4',
        functionSummary:
          'Intel memulai x86 32-bit lewat i386 (1985), i486 (1989), dan lini Pentium hingga Pentium 4 di tahun 2000.',
        examTip: 'Tahun kunci Intel: i386 (1985), i486 (1989), Pentium 4 (2000).',
        domainColor: '#38BDF8',
        cameraPos: [2.6, 3.2, 5.0],
        cameraLookAt: [1.6, 0.75, -0.6],
        anchor3D: [1.2, 0.75, -0.8],
        mechAction: 'pulse-intel',
      },
      {
        id: 'cpu-intel-core',
        triggerPhrase: 'era multi-core',
        fallbackPct: 44,
        startPct: 44,
        startWordIndex: 0,
        shortLabel: 'Core 2 → Core i7',
        pdfBadge: '2007–2011',
        title: 'Era Multi-Core Intel: Core 2 Duo & Core i7',
        functionSummary:
          'Intel beralih ke arsitektur multi-core efisien mulai Core 2 Duo (2007) hingga keluarga flagship Core i7 pada 2011.',
        examTip: 'Core 2 Duo = 2007; Core i3/i5/Atom = 2010; Core i7 = 2011.',
        domainColor: '#38BDF8',
        cameraPos: [4.5, 3.1, 3.6],
        cameraLookAt: [2.5, 0.95, -0.6],
        anchor3D: [2.7, 1.05, -0.8],
        mechAction: 'pulse-intel',
      },
      {
        id: 'cpu-amd-early',
        triggerPhrase: 'Tak mau kalah',
        fallbackPct: 62,
        startPct: 62,
        startWordIndex: 0,
        shortLabel: 'AMD Am386–Athlon',
        pdfBadge: '1991–2000',
        title: 'Kebangkitan AMD: Am386, K5/K6 & Athlon',
        functionSummary:
          'AMD menantang Intel lewat Am386 (1991), arsitektur mandiri K5 & K6, serta pelopor 1 GHz yaitu Athlon (2000).',
        examTip: 'Duel tahun 2000 di modul: Intel Pentium 4 vs AMD Athlon.',
        domainColor: '#F59E0B',
        cameraPos: [2.4, 3.1, 5.2],
        cameraLookAt: [1.4, 0.75, 1.1],
        anchor3D: [1.1, 0.75, 1.2],
        mechAction: 'pulse-amd',
      },
      {
        id: 'cpu-amd-modern',
        triggerPhrase: 'Phenom tahun',
        fallbackPct: 79,
        startPct: 79,
        startWordIndex: 0,
        shortLabel: 'Phenom → APU & FX',
        pdfBadge: '2010–2011',
        title: 'Multi-Core AMD: Phenom, Fusion APU & FX',
        functionSummary:
          'AMD merilis multi-core Phenom (2010), lalu integrasi CPU+GPU Fusion APU dan seri unlocked AMD FX pada 2011.',
        examTip: 'Duel 2011 di modul STMIK AKI: Intel Core i7 vs AMD Fusion APU & FX.',
        domainColor: '#F59E0B',
        cameraPos: [4.5, 3.1, 4.3],
        cameraLookAt: [2.4, 0.95, 1.1],
        anchor3D: [2.7, 1.05, 1.2],
        mechAction: 'seat-cpu',
      },
    ],
  },

  // ── KLASTER 3 · SUB-BAB 1: PSU SMPS, Grounding & ATX 24-Pin ──
  'psu-smps-flow': {
    sceneKind: 'psu-diorama',
    is3D: true,
    defaultCameraPos: [5.2, 4.2, 6.5],
    defaultCameraLookAt: [0.0, 0.85, 0.0],
    keyframes: [
      {
        id: 'psu-ac-ground',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: 'AC-IN & Grounding',
        pdfBadge: 'AC 220V',
        title: 'Input AC 220V & Pin Grounding Wajib',
        functionSummary:
          'PSU SMPS mengubah AC 220V ke DC aman, sementara Pin ke-3 Ground membuang tegangan bocor induksi agar PC tidak hang.',
        examTip: 'Tanpa grounding, casing terasa nyetrum dan motherboard rentan hang.',
        domainColor: '#10B981',
        cameraPos: [-5.0, 2.5, 3.3],
        cameraLookAt: [-2.4, 0.85, 0.0],
        anchor3D: [-3.1, 0.95, 0.0],
        mechAction: 'psu-standby',
      },
      {
        id: 'psu-standby-5vsb',
        triggerPhrase: 'jalur Stand-by',
        fallbackPct: 38,
        startPct: 38,
        startWordIndex: 0,
        shortLabel: 'Pin 9 Ungu (+5VSB)',
        pdfBadge: 'PIN 9 · UNGU',
        title: 'Stand-by Power Supply (+5VSB Ungu)',
        functionSummary:
          'Begitu kabel PLN dicolokkan, jalur +5VSB (Pin 9 kabel Ungu) langsung aktif memberi daya sirkuit tombol Power.',
        examTip: 'Pin 9 Ungu = +5VSB aktif langsung meski PC belum dinyalakan.',
        domainColor: '#A855F7',
        cameraPos: [3.1, 2.6, 4.2],
        cameraLookAt: [1.65, 0.72, 1.3],
        anchor3D: [1.55, 0.88, 1.3],
        mechAction: 'psu-standby',
      },
      {
        id: 'psu-atx-jumper',
        triggerPhrase: 'Main Power Supply',
        fallbackPct: 54,
        startPct: 54,
        startWordIndex: 0,
        shortLabel: 'Jumper Hijau-Hitam',
        pdfBadge: 'PIN 16 · PS_ON',
        title: 'Main Power Supply & Jumper Pin 16',
        functionSummary:
          'Menghubungkan kabel Hijau (Pin 16 PS_ON) ke Hitam (Ground) menyalakan rail +3.3V, +5V, +12V dan memutar kipas PSU.',
        examTip: 'Kasus MaTot: Jumper Hijau (Pin 16) + Hitam (Ground) untuk uji mandiri PSU.',
        domainColor: '#10B981',
        cameraPos: [2.7, 2.4, 4.0],
        cameraLookAt: [1.65, 0.75, 1.2],
        anchor3D: [1.85, 0.92, 1.3],
        mechAction: 'jumper-atx',
      },
      {
        id: 'psu-emi-shield',
        triggerPhrase: 'Casing logamnya',
        fallbackPct: 70,
        startPct: 70,
        startWordIndex: 0,
        shortLabel: 'Casing EMI & Kipas',
        pdfBadge: 'EMI SHIELD',
        title: 'Casing Logam Peredam EMI',
        functionSummary:
          'Casing besi PSU berperan sebagai sangkar Faraday yang meredam gangguan elektromagnetik (EMI) frekuensi tinggi SMPS.',
        examTip: 'Fungsi utama casing logam PSU = peredam interferensi EMI.',
        domainColor: '#38BDF8',
        cameraPos: [-1.4, 4.2, 4.4],
        cameraLookAt: [-1.2, 1.0, 0.0],
        anchor3D: [-1.2, 1.65, 0.0],
        mechAction: 'jumper-atx',
      },
      {
        id: 'psu-stavolt-ups',
        triggerPhrase: 'Stavolt menstabilkan',
        fallbackPct: 84,
        startPct: 84,
        startWordIndex: 0,
        shortLabel: 'Stavolt vs UPS',
        pdfBadge: 'STAVOLT/UPS',
        title: 'Stavolt (Stabilizer) vs UPS (Baterai)',
        functionSummary:
          'Stavolt menstabilkan fluktuasi tegangan PLN di 220V, sedangkan UPS menyimpan baterai cadangan saat listrik padam.',
        examTip: 'Jangan tertukar: Stavolt = penstabil voltase; UPS = cadangan baterai.',
        domainColor: '#F59E0B',
        cameraPos: [5.0, 2.8, -2.8],
        cameraLookAt: [2.5, 0.75, -1.6],
        anchor3D: [2.6, 0.95, -1.6],
        mechAction: 'jumper-atx',
      },
    ],
  },

  // ── KLASTER 4 · SUB-BAB 1: HDD Platter, PATA vs SATA, MBR vs GPT ──
  'hdd-mbr-gpt': {
    sceneKind: 'hdd-diorama',
    is3D: true,
    defaultCameraPos: [4.5, 4.6, 6.2],
    defaultCameraLookAt: [0.0, 0.5, 0.0],
    keyframes: [
      {
        id: 'hdd-platter',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: 'Platter & Head',
        pdfBadge: 'ANATOMI HDD',
        title: 'Piringan Magnetik Platter & Head',
        functionSummary:
          'Harddisk menyimpan bit data pada piringan Platter berputar cepat (5400–7200 RPM) yang dibaca oleh Read/Write Head.',
        examTip: 'Guncangan saat platter berputar memicu Bad Sector fisik.',
        domainColor: '#38BDF8',
        cameraPos: [-1.6, 3.6, 4.0],
        cameraLookAt: [-1.8, 0.48, 0.0],
        anchor3D: [-1.8, 0.62, -0.1],
        mechAction: 'sweep-head',
      },
      {
        id: 'hdd-pata-ide',
        triggerPhrase: 'Kabel lawas PATA',
        fallbackPct: 22,
        startPct: 22,
        startWordIndex: 0,
        shortLabel: 'PATA / IDE (40-Wire)',
        pdfBadge: 'IDE 40-WIRE',
        title: 'Kabel Pita PATA/IDE 40-Wire',
        functionSummary:
          'Interface PATA memakai kabel pita abu-abu 40-wire (maks 18 inci) bergaris merah Pin-1 dengan jumper Master/Slave.',
        examTip: 'HDD IDE = 40-wire (garis merah = Pin 1); Floppy = 34-wire.',
        domainColor: '#F59E0B',
        cameraPos: [2.5, 2.8, 4.6],
        cameraLookAt: [1.6, 0.35, 1.35],
        anchor3D: [1.6, 0.45, 1.35],
        mechAction: 'pulse-ide',
      },
      {
        id: 'hdd-sata3',
        triggerPhrase: 'sedangkan SATA 3',
        fallbackPct: 38,
        startPct: 38,
        startWordIndex: 0,
        shortLabel: 'SATA 3 (6 GB/s)',
        pdfBadge: 'SATA 3',
        title: 'Kabel Ramping SATA 3 (6 GB/s)',
        functionSummary:
          'Kabel SATA 7-pin jauh lebih ramping dengan kecepatan hingga 6 GB/s (SATA 3), hot-swapping, dan NCQ.',
        examTip: 'Tangga SATA: SATA 1 = 1,5 GB/s, SATA 2 = 3 GB/s, SATA 3 = 6 GB/s.',
        domainColor: '#F43F5E',
        cameraPos: [3.1, 2.7, 2.3],
        cameraLookAt: [1.8, 0.38, -1.25],
        anchor3D: [1.8, 0.48, -1.25],
        mechAction: 'pulse-sata',
      },
      {
        id: 'hdd-mbr-gpt',
        triggerPhrase: 'MBR berbasis',
        fallbackPct: 58,
        startPct: 58,
        startWordIndex: 0,
        shortLabel: 'MBR vs GPT',
        pdfBadge: 'MBR vs GPT',
        title: 'Skema Partisi MBR vs GPT',
        functionSummary:
          'MBR (Legacy BIOS) mentok 2 TB & 4 partisi primer, sedangkan GPT (UEFI) menampung >2 TB & hingga 128 partisi primer.',
        examTip: '4 angka emas: MBR = 2 TB & 4 primer; GPT = >2 TB & 128 primer.',
        domainColor: '#38BDF8',
        cameraPos: [-0.8, 4.3, 4.6],
        cameraLookAt: [-1.5, 0.55, 0.0],
        anchor3D: [-1.8, 0.72, 0.25],
        mechAction: 'show-sectors',
      },
      {
        id: 'hdd-ntfs-fat32',
        triggerPhrase: 'wajib format NTFS',
        fallbackPct: 84,
        startPct: 84,
        startWordIndex: 0,
        shortLabel: 'NTFS vs FAT32',
        pdfBadge: 'NTFS / FAT32',
        title: 'File System NTFS Wajib untuk Drive C:',
        functionSummary:
          'Drive C Windows wajib berformat NTFS (enkripsi, journaling, file >4 GB), berbeda dengan FAT32 yang mentok 4 GB per file.',
        examTip: 'FAT32 maks 4 GB/file; sisakan 20–30% ruang kosong Drive C untuk pagefile.sys.',
        domainColor: '#10B981',
        cameraPos: [0.6, 4.0, 5.2],
        cameraLookAt: [0.0, 0.55, 0.0],
        anchor3D: [1.8, 0.55, -1.25],
        mechAction: 'pulse-sata',
      },
    ],
  },

  // ── KLASTER 5 · SUB-BAB 1: Instalasi OS (3D Studio Monitor & Terminal) ──
  'os-boot-pipeline': {
    sceneKind: 'monitor-os',
    is3D: true,
    defaultCameraPos: [0.4, 2.7, 7.1],
    defaultCameraLookAt: [0.1, 2.0, -0.3],
    keyframes: [
      {
        id: 'os-bios',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '1. BIOS Boot Priority',
        pdfBadge: 'STEP 1–2',
        title: 'BIOS Boot Priority (Del/F2) → F10',
        functionSummary:
          'Atur 1st Boot Device di menu BIOS ke USB Flashdisk atau CD-ROM installer lalu simpan menggunakan F10.',
        examTip: 'Tombol simpan & keluar BIOS standar praktikum = F10.',
        domainColor: '#38BDF8',
        cameraPos: [0.8, 2.6, 6.8],
        cameraLookAt: [-0.2, 2.15, -0.3],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'os-bios',
      },
      {
        id: 'os-eula-part',
        triggerPhrase: 'setujui perjanjian EULA',
        fallbackPct: 36,
        startPct: 36,
        startWordIndex: 0,
        shortLabel: '2. EULA & Partisi NTFS',
        pdfBadge: 'STEP 3–5',
        title: 'Persetujuan EULA & Format NTFS',
        functionSummary:
          'Setujui lisensi EULA (F8), buat partisi Drive C memadai, lalu format memakai sistem berkas NTFS.',
        examTip: 'Drive sistem Windows wajib NTFS dengan buffer kosong 20–30%.',
        domainColor: '#10B981',
        cameraPos: [-1.1, 2.5, 6.3],
        cameraLookAt: [-0.55, 2.2, -0.35],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'os-eula-part',
      },
      {
        id: 'os-copy-key',
        triggerPhrase: 'Setelah salin berkas',
        fallbackPct: 58,
        startPct: 58,
        startWordIndex: 0,
        shortLabel: '3. Product Key & GMT+7',
        pdfBadge: 'STEP 6–8',
        title: 'Product Key 25 Karakter & GMT+07:00',
        functionSummary:
          'Setelah reboot, isi nama pengguna, masukkan Product Key 25 karakter, dan pilih zona waktu GMT+07:00.',
        examTip: 'Product Key = 25 karakter; Zona waktu WIB = GMT+07:00 (Bangkok, Hanoi, Jakarta).',
        domainColor: '#A855F7',
        cameraPos: [1.3, 2.5, 6.3],
        cameraLookAt: [-0.4, 2.2, -0.35],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'os-copy-key',
      },
      {
        id: 'os-drivers',
        triggerPhrase: 'lengkapi semua Driver',
        fallbackPct: 84,
        startPct: 84,
        startWordIndex: 0,
        shortLabel: '4. Instalasi Driver',
        pdfBadge: 'STEP 9',
        title: 'Driver Chipset, VGA, LAN & Audio',
        functionSummary:
          'Pasang driver chipset, grafis VGA, jaringan LAN, serta audio agar seluruh hardware bekerja optimal.',
        examTip: 'Urutan kronologis lengkap BIOS → Partisi → Key → Driver bernilai penuh di Essay.',
        domainColor: '#F59E0B',
        cameraPos: [2.4, 2.7, 6.7],
        cameraLookAt: [0.4, 2.0, -0.3],
        anchor3D: [3.25, 1.8, 0.2],
        mechAction: 'os-drivers',
      },
    ],
  },

  // ── KLASTER 5 · SUB-BAB 2: 6 Kasus Troubleshooting di Motherboard 3D ──
  'troubleshooting-matrix': {
    sceneKind: 'motherboard',
    is3D: true,
    defaultCameraPos: [5.4, 5.4, 6.6],
    defaultCameraLookAt: [0, 0.35, 0],
    keyframes: [
      {
        id: 'ts-matot',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '1. MaTot (Jumper PSU)',
        pdfBadge: 'KASUS #1',
        title: 'Mati Total (MaTot): Kipas & LED Mati',
        functionSummary:
          'Cek sumber PLN, lakukan tes jumper Hijau (Pin 16) + Hitam pada ATX 24-pin (#14), dan inspeksi ELCO menggelembung.',
        examTip: 'MaTot = tidak ada reaksi sama sekali; uji PSU dulu via jumper hijau-hitam.',
        domainColor: '#F43F5E',
        cameraPos: [2.2, 3.0, 5.7],
        cameraLookAt: [1.55, 0.42, 3.45],
        anchor3D: [1.55, 0.46, 3.45],
        highlightId: 'atx-power',
        mechAction: 'fault-matot',
      },
      {
        id: 'ts-blank-ram',
        triggerPhrase: 'kasusnya Blank',
        fallbackPct: 34,
        startPct: 34,
        startWordIndex: 0,
        shortLabel: '2. Blank (Pin RAM)',
        pdfBadge: 'KASUS #2',
        title: 'Blank: Bersihkan Pin Emas RAM',
        functionSummary:
          'Saat kipas menyala namun layar gelap, bersihkan pin emas RAM (#02) memakai penghapus karet pensil dan uji pindah slot.',
        examTip: 'Blank = kipas & LED menyala, hanya monitor gelap.',
        domainColor: '#F59E0B',
        cameraPos: [3.3, 3.0, 4.4],
        cameraLookAt: [1.9, 0.48, 1.85],
        anchor3D: [1.9, 0.56, 1.85],
        highlightId: 'ram-slots',
        mechAction: 'seat-ram',
      },
      {
        id: 'ts-blank-cmos',
        triggerPhrase: 'Reset CMOS',
        fallbackPct: 54,
        startPct: 54,
        startWordIndex: 0,
        shortLabel: 'Reset CMOS & Beep',
        pdfBadge: 'CMOS #10',
        title: 'Reset Baterai CMOS & Uji Beep POST',
        functionSummary:
          'Lepas baterai CMOS CR2032 (#10) untuk mereset BIOS (ganti bila < 2V) lalu uji nyala tanpa RAM untuk cek bunyi beep.',
        examTip: 'Baterai CMOS lemah (< 2V) juga memicu kasus PC Restart berulang.',
        domainColor: '#A855F7',
        cameraPos: [-1.4, 2.4, 4.4],
        cameraLookAt: [-1.4, 0.32, 2.35],
        anchor3D: [-1.4, 0.36, 2.35],
        highlightId: 'cmos-battery',
        mechAction: 'pulse-sb',
      },
      {
        id: 'ts-hang-overheat',
        triggerPhrase: 'sering Hang',
        fallbackPct: 68,
        startPct: 68,
        startWordIndex: 0,
        shortLabel: '3–4. Hang & Overheat',
        pdfBadge: 'KASUS #3–4',
        title: 'Hang & Restart: Cek Overheat CPU',
        functionSummary:
          'Jika mouse beku dan lampu NumLock tidak merespons, cek suhu prosesor (#01), bersihkan heatsink, dan ganti thermal paste.',
        examTip: 'Ciri khas Hang di modul: mouse macet & lampu NumLock tidak mau menyala/mati.',
        domainColor: '#F43F5E',
        cameraPos: [3.2, 3.3, 1.3],
        cameraLookAt: [2.1, 0.5, -1.6],
        anchor3D: [2.1, 0.62, -1.6],
        highlightId: 'cpu-socket',
        mechAction: 'fault-overheat',
      },
      {
        id: 'ts-hdd-virus',
        triggerPhrase: 'kesehatan harddisk',
        fallbackPct: 88,
        startPct: 88,
        startWordIndex: 0,
        shortLabel: '5–6. Harddisk & Virus',
        pdfBadge: 'KASUS #5–6',
        title: 'Cek Bad Sector Harddisk & Safe Mode',
        functionSummary:
          'Periksa kabel SATA/IDE (#11/#12), cek Bad Sector lewat HBCD, dan uji kestabilan sistem melalui Safe Mode.',
        examTip: 'Susun jawaban Essay studi kasus dalam 3 blok: Gejala → Penyebab → Perbaikan.',
        domainColor: '#38BDF8',
        cameraPos: [-1.8, 2.7, 5.2],
        cameraLookAt: [-2.2, 0.36, 2.6],
        anchor3D: [-2.65, 0.4, 2.5],
        highlightId: 'sata-ports',
        mechAction: 'pulse-sb',
      },
    ],
  },

  // ── KLASTER 6 · SUB-BAB 1: Resistor, Kapasitor 103 & Multitester ──
  'electronics-bench': {
    sceneKind: 'electronics-diorama',
    is3D: true,
    defaultCameraPos: [3.6, 4.2, 6.5],
    defaultCameraLookAt: [0.0, 0.65, 0.0],
    keyframes: [
      {
        id: 'elec-zero-adj',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '1. Zero Ohm Adj',
        pdfBadge: 'KALIBRASI',
        title: 'Kalibrasi Wajib: Zero Ohm Adj',
        functionSummary:
          'Tempelkan probe Merah & Hitam lalu putar kenop Zero Ohm Adj hingga jarum Ohmmeter tepat di 0 Ω sebelum mengukur.',
        examTip: 'Selalu tulis langkah kalibrasi Zero Ohm Adj di awal prosedur ukur hambatan.',
        domainColor: '#38BDF8',
        cameraPos: [2.2, 3.5, 5.0],
        cameraLookAt: [1.7, 0.8, -0.2],
        anchor3D: [1.7, 1.05, 0.25],
        mechAction: 'deflect-zero',
      },
      {
        id: 'elec-resistor',
        triggerPhrase: 'Contohnya resistor',
        fallbackPct: 26,
        startPct: 26,
        startWordIndex: 0,
        shortLabel: '2. Resistor 1000 Ω',
        pdfBadge: 'RESISTOR',
        title: 'Resistor 4 Gelang: 1000 Ω ±10%',
        functionSummary:
          'Coklat (1) + Hitam (0) × Merah (100) = 1.000 Ω dengan toleransi Perak ±10% (rentang baik 900–1.100 Ω).',
        examTip: 'Coklat=1, Hitam=0, Merah=×100, Perak=±10% → 900–1100 Ω.',
        domainColor: '#F59E0B',
        cameraPos: [-2.5, 2.5, 4.0],
        cameraLookAt: [-2.2, 0.55, 0.9],
        anchor3D: [-2.2, 0.68, 0.9],
        mechAction: 'deflect-mid',
      },
      {
        id: 'elec-cap-103',
        triggerPhrase: 'kapasitor keramik',
        fallbackPct: 50,
        startPct: 50,
        startWordIndex: 0,
        shortLabel: '3. Kapasitor 103',
        pdfBadge: 'KODE 103',
        title: 'Dekode Kapasitor Keramik 103 & ELCO',
        functionSummary:
          'Kode 103 berarti 10 × 10³ pF = 10.000 pF = 0,01 µF; sedangkan tabung ELCO berpolaritas (panah = kutub negatif).',
        examTip: '103 = 10.000 pF = 10 nF = 0,01 µF; garis putih ELCO = kaki negatif.',
        domainColor: '#10B981',
        cameraPos: [-2.3, 2.5, 3.1],
        cameraLookAt: [-2.1, 0.65, -0.95],
        anchor3D: [-2.1, 0.78, -0.95],
        mechAction: 'deflect-good',
      },
      {
        id: 'elec-meter-good',
        triggerPhrase: 'Saat dicek ohmmeter',
        fallbackPct: 72,
        startPct: 72,
        startWordIndex: 0,
        shortLabel: '4. Uji Baik vs Bocor',
        pdfBadge: 'OHMMETER',
        title: 'Respon Jarum: Baik vs Bocor',
        functionSummary:
          'Jarum menyimpang lalu kembali ke tak hingga (∞) menandakan kapasitor BAIK; jika berhenti tidak kembali = BOCOR.',
        examTip: 'Kembali = Baik; Diam di tengah = Bocor; Tak gerak = Putus; Mentok 0 = Short.',
        domainColor: '#10B981',
        cameraPos: [1.8, 3.3, 4.2],
        cameraLookAt: [1.7, 0.85, -0.25],
        anchor3D: [1.7, 1.15, -0.35],
        mechAction: 'deflect-good',
      },
      {
        id: 'elec-meter-short',
        triggerPhrase: 'mentok di nol',
        fallbackPct: 90,
        startPct: 90,
        startWordIndex: 0,
        shortLabel: '5. Mentok 0 Ω = Short',
        pdfBadge: 'SHORT (0 Ω)',
        title: 'Jarum Mentok di 0 Ω = Short',
        functionSummary:
          'Jarum yang langsung bergerak mentok ke angka 0 Ω tanpa turun lagi menandakan kapasitor hubung singkat (short).',
        examTip: 'Kaki MOSFET kiri→kanan = Gate–Drain–Source (G-D-S); IC tidak divonis lewat AVO.',
        domainColor: '#F43F5E',
        cameraPos: [1.8, 3.1, 4.0],
        cameraLookAt: [1.7, 0.85, -0.25],
        anchor3D: [1.7, 1.15, -0.35],
        mechAction: 'deflect-short',
      },
    ],
  },

  // ── KLASTER 7 · SUB-BAB 1: Hukum EULA (3D Studio Monitor & Terminal) ──
  'eula-legal-shield': {
    sceneKind: 'monitor-eula',
    is3D: true,
    defaultCameraPos: [0.3, 2.6, 7.0],
    defaultCameraLookAt: [0.0, 2.0, -0.3],
    keyframes: [
      {
        id: 'eula-license',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '1. Hak Izin Pakai',
        pdfBadge: 'EULA',
        title: 'EULA: Membeli Lisensi, Bukan Kode Sumber',
        functionSummary:
          'Membeli software legal berarti memperoleh hak izin pakai (lisensi), bukan kepemilikan kode program, dan mengikat saat klik I Accept.',
        examTip: 'Pembuka wajib Essay: bedakan "hak izin pakai (lisensi)" vs "kepemilikan program".',
        domainColor: '#38BDF8',
        cameraPos: [0.6, 2.6, 6.7],
        cameraLookAt: [-0.3, 2.15, -0.3],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'eula-license',
      },
      {
        id: 'eula-monitor-telemetry',
        triggerPhrase: 'pemantauan aktivitas',
        fallbackPct: 52,
        startPct: 52,
        startWordIndex: 0,
        shortLabel: '2. Pantau & Telemetri',
        pdfBadge: 'KLAUSUL 1–2',
        title: 'Klausul 1 & 2: Internet & Telemetri',
        functionSummary:
          'Klausul EULA dapat mengizinkan vendor memantau aktivitas koneksi internet dan mengumpulkan data pribadi/HWID (telemetri).',
        examTip: 'Matikan telemetri opsional via Custom Install dan cek reputasi publisher.',
        domainColor: '#F59E0B',
        cameraPos: [-1.2, 2.5, 6.2],
        cameraLookAt: [-0.55, 2.2, -0.35],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'eula-telemetry',
      },
      {
        id: 'eula-resource-firewall',
        triggerPhrase: 'penggunaan CPU',
        fallbackPct: 74,
        startPct: 74,
        startWordIndex: 0,
        shortLabel: '3. Resource & Firewall',
        pdfBadge: 'KLAUSUL 3–4',
        title: 'Klausul 3 & 4: Resource & Port Firewall',
        functionSummary:
          'Software dapat memakai CPU/bandwidth di latar belakang dan membuka port firewall yang rawan disusupi Backdoor & Trojan.',
        examTip: 'Hafalkan 4 klausul kritis EULA (Edward Desautels) untuk skor penuh.',
        domainColor: '#F43F5E',
        cameraPos: [1.5, 2.5, 6.3],
        cameraLookAt: [-0.2, 2.2, -0.35],
        anchor3D: [3.25, 1.8, 0.2],
        mechAction: 'eula-firewall',
      },
    ],
  },

  // ── KLASTER 7 · SUB-BAB 2: Cracking & 4 Pilar Bahaya (3D Studio Monitor) ──
  'crack-threat-vector': {
    sceneKind: 'monitor-crack',
    is3D: true,
    defaultCameraPos: [0.3, 2.6, 7.0],
    defaultCameraLookAt: [0.0, 2.0, -0.3],
    keyframes: [
      {
        id: 'crack-patch-keygen',
        triggerPhrase: '',
        fallbackPct: 0,
        startPct: 0,
        startWordIndex: 0,
        shortLabel: '1. Patch & Keygen',
        pdfBadge: 'CRACK TOOL',
        title: 'Reverse Engineering: Patch & Keygen',
        functionSummary:
          'Patch menimpa byte file fisik .exe/.dll (mengubah JNZ → JZ/NOP), sedangkan Keygen mereplikasi algoritma serial palsu.',
        examTip: 'Patch memodifikasi berkas fisik permanen di harddisk.',
        domainColor: '#F59E0B',
        cameraPos: [0.7, 2.6, 6.7],
        cameraLookAt: [-0.3, 2.15, -0.3],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'crack-patch',
      },
      {
        id: 'crack-loader',
        triggerPhrase: 'serta Loader',
        fallbackPct: 32,
        startPct: 32,
        startWordIndex: 0,
        shortLabel: '2. Loader (RAM)',
        pdfBadge: 'LOADER',
        title: 'Loader: Injeksi Bypass di Memori RAM',
        functionSummary:
          'Loader tidak mengubah file fisik asli di disk, melainkan memanipulasi validasi lisensi secara langsung di memori RAM.',
        examTip: 'Pembeda emas: Patch = ubah file fisik di disk; Loader = manipulasi di RAM.',
        domainColor: '#A855F7',
        cameraPos: [-1.2, 2.5, 6.2],
        cameraLookAt: [-0.55, 2.2, -0.35],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'crack-loader',
      },
      {
        id: 'crack-malware',
        triggerPhrase: 'empat risiko besar',
        fallbackPct: 54,
        startPct: 54,
        startWordIndex: 0,
        shortLabel: '3. Malware & Crash',
        pdfBadge: 'PILAR 1–2',
        title: 'Pilar 1 & 2: Malware & Tanpa Update',
        functionSummary:
          'Mematikan Antivirus saat menjalankan crack mengundang Trojan Backdoor, Keylogger, Ransomware, serta crash tanpa update.',
        examTip: 'Celah fatal pengguna bajakan: menonaktifkan Antivirus saat ekstrak crack/keygen.',
        domainColor: '#F43F5E',
        cameraPos: [1.4, 2.5, 6.2],
        cameraLookAt: [-0.2, 2.2, -0.35],
        anchor3D: [3.25, 1.8, 0.2],
        mechAction: 'crack-malware',
      },
      {
        id: 'crack-legal-ethics',
        triggerPhrase: 'UU Hak Cipta',
        fallbackPct: 80,
        startPct: 80,
        startWordIndex: 0,
        shortLabel: '4. Hukum & Etika',
        pdfBadge: 'PILAR 3–4',
        title: 'Pilar 3 & 4: UU Hak Cipta & Etika',
        functionSummary:
          'Software bajakan melanggar UU Hak Cipta (ancaman pidana & perdata) serta merusak etika profesi dan inovasi teknologi.',
        examTip: '4 pilar wajib: Keamanan Siber, Stabilitas/Update, Hukum UU Hak Cipta, dan Etika.',
        domainColor: '#38BDF8',
        cameraPos: [0.3, 2.7, 7.0],
        cameraLookAt: [0.0, 2.1, -0.3],
        anchor3D: [-0.55, 2.25, -0.35],
        mechAction: 'crack-legal',
      },
    ],
  },
};

export interface ResolvedSegmentDirector {
  plan: SegmentDirectorPlan;
  keyframes: DirectorKeyframe[];
}

/**
 * Resolves exact keyframe startPct & startWordIndex from the real narration text
 * using phonetic speech-weight timing + optional browser WAV silence boundary snapping (0 extra tokens).
 */
export function resolveSegmentKeyframes(
  visualType: TheaterVisualType,
  narration: string,
  wavPausePcts: number[] = []
): ResolvedSegmentDirector {
  const plan = THEATER_DIRECTOR_PLANS[visualType];
  const wordTimeline = buildPhoneticWordTimeline(narration);

  let searchCursor = 0;
  const preliminary = plan.keyframes.map((kf, idx) => {
    if (idx === 0 || !kf.triggerPhrase.trim()) {
      return {
        ...kf,
        startPct: 0,
        startWordIndex: 0,
      };
    }

    const foundIdx = findPhraseStartWordIndex(narration, kf.triggerPhrase, searchCursor);
    if (foundIdx >= 0 && foundIdx < wordTimeline.length) {
      searchCursor = foundIdx + 1;
      return {
        ...kf,
        startPct: wordTimeline[foundIdx].startPct,
        startWordIndex: foundIdx,
      };
    }

    // Fallback to declared fallbackPct if phrase ever differs
    const approxIdx = wordTimeline.findIndex((w) => w.startPct >= kf.fallbackPct);
    return {
      ...kf,
      startPct: kf.fallbackPct,
      startWordIndex: approxIdx >= 0 ? approxIdx : 0,
    };
  });

  // Snap non-zero keyframes to nearest genuine WAV silence pause when decoded WAV boundaries exist
  const snappedPcts = snapKeyframePctsToWaveform(
    preliminary.map((k) => k.startPct),
    wavPausePcts
  );

  const resolvedKeyframes = preliminary.map((kf, idx) => ({
    ...kf,
    startPct: idx === 0 ? 0 : snappedPcts[idx],
  }));

  return {
    plan,
    keyframes: resolvedKeyframes,
  };
}

/**
 * Finds the active keyframe locked to spoken word index (when available) or precise progress %.
 */
export function findActiveResolvedKeyframe(
  resolved: ResolvedSegmentDirector,
  progressPct: number,
  activeWordIndex: number | null
): { plan: SegmentDirectorPlan; keyframe: DirectorKeyframe; index: number } {
  const { plan, keyframes } = resolved;
  if (keyframes.length === 0) {
    throw new Error('Director plan must contain at least one keyframe');
  }

  let activeIdx = 0;

  // Prefer exact spoken word index when active (locks 100% with subtitles & local Web Speech!)
  if (activeWordIndex !== null && activeWordIndex >= 0) {
    for (let i = 0; i < keyframes.length; i++) {
      if (activeWordIndex >= keyframes[i].startWordIndex) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return { plan, keyframe: keyframes[activeIdx], index: activeIdx };
  }

  for (let i = 0; i < keyframes.length; i++) {
    if (progressPct + 0.25 >= keyframes[i].startPct) {
      activeIdx = i;
    } else {
      break;
    }
  }

  return { plan, keyframe: keyframes[activeIdx], index: activeIdx };
}
