import type { GrowthStatus, Species, WeightRecord } from '@/data/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ternak dianggap perlu ditimbang lagi kalau timbangan terakhir lebih dari sekian hari lalu. */
export const WEIGH_INTERVAL_DAYS = 14;

/**
 * Kenaikan terakhir dianggap "melambat" kalau di bawah sekian persen dari rata-rata ternak itu sendiri.
 * Sengaja membandingkan ternak dengan dirinya sendiri, bukan patokan per jenis,
 * supaya berlaku untuk semua jenis ternak tanpa angka acuan yang dikarang.
 */
export const SLOWDOWN_RATIO = 0.5;

/** Jarak minimal (hari) antara dua timbangan supaya laju per hari masuk akal dihitung. */
export const MIN_DAYS_FOR_RATE = 1;

export type Growth = {
  records: WeightRecord[];
  latestWeightKg?: number;
  firstWeightKg?: number;
  totalGainKg: number;
  /** Rata-rata pertambahan bobot harian sejak timbang pertama (kg/hari). */
  overallAdgKg?: number;
  /** Pertambahan bobot harian di antara dua timbangan terakhir (kg/hari). */
  lastAdgKg?: number;
  daysSinceLastWeigh?: number;
  status: GrowthStatus;
};

const daysBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / DAY_MS;

export function sortByDate(records: WeightRecord[]): WeightRecord[] {
  return [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function computeGrowth(allRecords: WeightRecord[], now: Date = new Date()): Growth {
  const records = sortByDate(allRecords);
  const first = records[0];
  const last = records[records.length - 1];
  const prev = records[records.length - 2];

  if (!first || !last) {
    return { records, totalGainKg: 0, status: 'belumDitimbang' };
  }

  // Laju harian baru dihitung kalau jaraknya minimal 1 hari.
  // Dua timbangan di hari yang sama akan menghasilkan angka per hari yang menyesatkan.
  const totalDays = daysBetween(first.date, last.date);
  const overallAdgKg =
    totalDays >= MIN_DAYS_FOR_RATE ? (last.weightKg - first.weightKg) / totalDays : undefined;

  const lastDays = prev ? daysBetween(prev.date, last.date) : 0;
  const lastAdgKg =
    prev && lastDays >= MIN_DAYS_FOR_RATE ? (last.weightKg - prev.weightKg) / lastDays : undefined;

  const daysSinceLastWeigh = Math.floor((now.getTime() - new Date(last.date).getTime()) / DAY_MS);

  let status: GrowthStatus = 'normal';
  if (records.length < 2 || daysSinceLastWeigh > WEIGH_INTERVAL_DAYS) {
    status = 'belumDitimbang';
  } else if (prev && last.weightKg < prev.weightKg) {
    status = 'turun';
  } else if (
    overallAdgKg !== undefined &&
    lastAdgKg !== undefined &&
    overallAdgKg > 0 &&
    lastAdgKg < overallAdgKg * SLOWDOWN_RATIO
  ) {
    status = 'melambat';
  }

  return {
    records,
    latestWeightKg: last.weightKg,
    firstWeightKg: first.weightKg,
    totalGainKg: last.weightKg - first.weightKg,
    overallAdgKg,
    lastAdgKg,
    daysSinceLastWeigh,
    status,
  };
}

export const STATUS_LABEL: Record<GrowthStatus, string> = {
  normal: 'Tumbuh normal',
  melambat: 'Melambat',
  turun: 'Berat turun',
  belumDitimbang: 'Perlu ditimbang',
};

export const SPECIES_LABEL: Record<Species, string> = {
  sapi: 'Sapi',
  kerbau: 'Kerbau',
  kambing: 'Kambing',
  domba: 'Domba',
  ayam: 'Ayam',
  bebek: 'Bebek',
  kelinci: 'Kelinci',
  lainnya: 'Lainnya',
};

const decimal = (n: number, digits: number) => n.toFixed(digits).replace('.', ',');

/** Contoh: "24,5 kg" */
export function formatKg(kg: number): string {
  return `${decimal(kg, kg >= 100 ? 0 : 1)} kg`;
}

/** Contoh: "+110 g/hari", "-36 g/hari", "+0,62 kg/hari" */
export function formatAdg(kgPerDay?: number): string {
  if (kgPerDay === undefined) return '-';
  const sign = kgPerDay > 0 ? '+' : kgPerDay < 0 ? '-' : '';
  const abs = Math.abs(kgPerDay);
  return abs < 1
    ? `${sign}${Math.round(abs * 1000)} g/hari`
    : `${sign}${decimal(abs, 2)} kg/hari`;
}

/** Contoh: "+7,6 kg" */
export function formatGain(kg: number): string {
  const sign = kg > 0 ? '+' : kg < 0 ? '-' : '';
  return `${sign}${formatKg(Math.abs(kg))}`;
}
