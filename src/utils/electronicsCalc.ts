export interface ResistorBandColor {
  id: string;
  label: string;
  hex: string;
  textColor: string;
  digit: number | null;
  multiplier: number | null;
  tolerance: number | null;
  tempCoeffPpm: number | null;
}

export const RESISTOR_COLORS: ResistorBandColor[] = [
  { id: 'black', label: 'Hitam', hex: '#18181B', textColor: '#F3F4F6', digit: 0, multiplier: 1, tolerance: null, tempCoeffPpm: null },
  { id: 'brown', label: 'Coklat', hex: '#78350F', textColor: '#F3F4F6', digit: 1, multiplier: 10, tolerance: 1, tempCoeffPpm: 100 },
  { id: 'red', label: 'Merah', hex: '#DC2626', textColor: '#F3F4F6', digit: 2, multiplier: 100, tolerance: 2, tempCoeffPpm: 50 },
  { id: 'orange', label: 'Oranye', hex: '#EA580C', textColor: '#F3F4F6', digit: 3, multiplier: 1_000, tolerance: null, tempCoeffPpm: 15 },
  { id: 'yellow', label: 'Kuning', hex: '#EAB308', textColor: '#111827', digit: 4, multiplier: 10_000, tolerance: null, tempCoeffPpm: 25 },
  { id: 'green', label: 'Hijau', hex: '#16A34A', textColor: '#F3F4F6', digit: 5, multiplier: 100_000, tolerance: 0.5, tempCoeffPpm: null },
  { id: 'blue', label: 'Biru', hex: '#2563EB', textColor: '#F3F4F6', digit: 6, multiplier: 1_000_000, tolerance: 0.25, tempCoeffPpm: null },
  { id: 'violet', label: 'Ungu', hex: '#7C3AED', textColor: '#F3F4F6', digit: 7, multiplier: 10_000_000, tolerance: 0.1, tempCoeffPpm: null },
  { id: 'gray', label: 'Abu-abu', hex: '#6B7280', textColor: '#F3F4F6', digit: 8, multiplier: null, tolerance: null, tempCoeffPpm: null },
  { id: 'white', label: 'Putih', hex: '#F3F4F6', textColor: '#111827', digit: 9, multiplier: null, tolerance: null, tempCoeffPpm: null },
  { id: 'gold', label: 'Emas', hex: '#CA8A04', textColor: '#111827', digit: null, multiplier: 0.1, tolerance: 5, tempCoeffPpm: null },
  { id: 'silver', label: 'Perak', hex: '#94A3B8', textColor: '#111827', digit: null, multiplier: 0.01, tolerance: 10, tempCoeffPpm: null },
];

export interface ResistorCalculation {
  ohms: number;
  formatted: string;
  tolerancePercent: number;
  minOhms: number;
  maxOhms: number;
  minFormatted: string;
  maxFormatted: string;
  tempCoeffPpm: number | null;
}

export function formatOhms(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${Number(m.toFixed(2))} MΩ`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${Number(k.toFixed(2))} kΩ`;
  }
  return `${Number(value.toFixed(2))} Ω`;
}

export function calculateResistor(params: {
  bandCount: 4 | 5 | 6;
  band1Id: string;
  band2Id: string;
  band3Id: string;
  multiplierId: string;
  toleranceId: string;
  tempCoeffId: string;
}): ResistorCalculation {
  const find = (id: string) => RESISTOR_COLORS.find((c) => c.id === id) ?? RESISTOR_COLORS[0];
  const d1 = find(params.band1Id).digit ?? 1;
  const d2 = find(params.band2Id).digit ?? 0;
  const d3 = find(params.band3Id).digit ?? 0;
  const mult = find(params.multiplierId).multiplier ?? 100;
  const tol = find(params.toleranceId).tolerance ?? 10;
  const ppm = params.bandCount === 6 ? find(params.tempCoeffId).tempCoeffPpm ?? 100 : null;

  const baseDigits = params.bandCount === 4 ? d1 * 10 + d2 : d1 * 100 + d2 * 10 + d3;
  const ohms = baseDigits * mult;
  const delta = ohms * (tol / 100);
  const minOhms = Math.max(0, ohms - delta);
  const maxOhms = ohms + delta;

  return {
    ohms,
    formatted: formatOhms(ohms),
    tolerancePercent: tol,
    minOhms,
    maxOhms,
    minFormatted: formatOhms(minOhms),
    maxFormatted: formatOhms(maxOhms),
    tempCoeffPpm: ppm,
  };
}

export interface CapacitorCalculation {
  valid: boolean;
  code: string;
  picofarads: number;
  nanofarads: number;
  microfarads: number;
  breakdownText: string;
}

export function decodeCeramicCapacitor(rawCode: string): CapacitorCalculation {
  const cleaned = rawCode.replace(/\D/g, '').slice(0, 3);
  if (cleaned.length !== 3) {
    return {
      valid: false,
      code: cleaned,
      picofarads: 0,
      nanofarads: 0,
      microfarads: 0,
      breakdownText: 'Masukkan tepat 3 digit angka kode kapasitor (contoh: 103, 104, 472).',
    };
  }

  const d1 = Number(cleaned[0]);
  const d2 = Number(cleaned[1]);
  const zeros = Number(cleaned[2]);

  if (zeros > 7) {
    return {
      valid: false,
      code: cleaned,
      picofarads: 0,
      nanofarads: 0,
      microfarads: 0,
      breakdownText: 'Digit pengali ke-3 umumnya bernilai 0 hingga 7 (jumlah angka nol dalam pF).',
    };
  }

  const base = d1 * 10 + d2;
  const pf = base * Math.pow(10, zeros);
  const nf = pf / 1_000;
  const uf = pf / 1_000_000;

  return {
    valid: true,
    code: cleaned,
    picofarads: pf,
    nanofarads: nf,
    microfarads: uf,
    breakdownText: `Digit I (${d1}) · Digit II (${d2}) · Jumlah nol (${zeros}) → ${pf.toLocaleString('id-ID')} pF = ${Number(nf.toFixed(4))} nF = ${Number(uf.toFixed(6))} µF`,
  };
}
