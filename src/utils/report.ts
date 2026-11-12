import type { Animal, FeedRecord, HealthRecord, Species, WeightRecord } from '@/data/types';

import { sortByDate } from './growth';

const DAY_MS = 24 * 60 * 60 * 1000;
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export type PeriodKey = 'bulanIni' | 'bulanLalu' | '3bulan' | 'semua';

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'bulanIni', label: 'Bulan ini' },
  { key: 'bulanLalu', label: 'Bulan lalu' },
  { key: '3bulan', label: '3 bulan' },
  { key: 'semua', label: 'Semua' },
];

export type Period = {
  key: PeriodKey;
  /** Kosong berarti sejak data pertama. */
  start?: Date;
  end: Date;
  /** Contoh: "1 - 12 November 2026", "Oktober 2026". */
  label: string;
  /** Untuk nama file, contoh: "2026-11" atau "semua". */
  slug: string;
};

const tgl = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
const pad = (n: number) => String(n).padStart(2, '0');

export function getPeriod(key: PeriodKey, now: Date = new Date()): Period {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (key === 'bulanIni') {
    const start = new Date(y, m, 1);
    return { key, start, end: now, label: `1 - ${tgl(now)}`, slug: `${y}-${pad(m + 1)}` };
  }
  if (key === 'bulanLalu') {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1, 0, 0, 0, -1);
    return {
      key,
      start,
      end,
      label: `${BULAN[start.getMonth()]} ${start.getFullYear()}`,
      slug: `${start.getFullYear()}-${pad(start.getMonth() + 1)}`,
    };
  }
  if (key === '3bulan') {
    const start = new Date(y, m - 3, now.getDate());
    return { key, start, end: now, label: `${tgl(start)} - ${tgl(now)}`, slug: `3bulan-${y}-${pad(m + 1)}` };
  }
  return { key, end: now, label: `Semua data sampai ${tgl(now)}`, slug: 'semua' };
}

const inPeriod = (iso: string, p: Period) => {
  const t = new Date(iso).getTime();
  return (!p.start || t >= p.start.getTime()) && t <= p.end.getTime();
};

export type GrowthRow = {
  animal: Animal;
  /** Berat di awal periode: timbangan terakhir sebelum periode, atau timbangan pertama di dalamnya. */
  startKg?: number;
  endKg?: number;
  gainKg?: number;
  /** Kenaikan per hari dalam periode, kalau jarak timbangnya minimal 1 hari. */
  adgKg?: number;
  /** Berapa kali ditimbang di dalam periode. */
  weighCount: number;
};

export type FeedSummary = { feedType: string; amountKg: number; costRp: number; count: number };

export type FarmReport = {
  period: Period;
  animalCount: number;
  speciesCounts: { species: Species; count: number }[];
  /** Ternak yang masuk kandang di dalam periode. */
  enteredCount: number;
  growth: GrowthRow[];
  feeds: FeedRecord[];
  feedByType: FeedSummary[];
  feedTotalKg: number;
  feedCostRp: number;
  health: HealthRecord[];
  healthCostRp: number;
  totalCostRp: number;
  weighCount: number;
};

/** Pertumbuhan satu ekor di dalam periode. */
export function growthInPeriod(animal: Animal, weights: WeightRecord[], period: Period): GrowthRow {
  const all = sortByDate(weights.filter((w) => w.animalId === animal.id));
  const before = period.start ? all.filter((w) => new Date(w.date) < period.start!) : [];
  const inside = all.filter((w) => inPeriod(w.date, period));
  const baseline = before[before.length - 1];
  const used = baseline ? [baseline, ...inside] : inside;
  if (used.length === 0) return { animal, weighCount: 0 };

  const first = used[0];
  const last = used[used.length - 1];
  const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / DAY_MS;
  const gainKg = last.weightKg - first.weightKg;
  return {
    animal,
    startKg: first.weightKg,
    endKg: last.weightKg,
    // Satu timbangan saja belum bisa dibilang naik atau turun.
    gainKg: used.length >= 2 ? gainKg : undefined,
    adgKg: days >= 1 ? gainKg / days : undefined,
    weighCount: inside.length,
  };
}

/** Rekap seluruh peternakan untuk satu periode. */
export function buildFarmReport(
  animals: Animal[],
  weights: WeightRecord[],
  feeds: FeedRecord[],
  health: HealthRecord[],
  period: Period,
): FarmReport {
  // Ternak yang sudah masuk kandang sebelum periode berakhir.
  const present = animals
    .filter((a) => new Date(a.entryDate).getTime() <= period.end.getTime())
    .sort((a, b) => a.code.localeCompare(b.code, 'id', { numeric: true }));

  const counts = new Map<Species, number>();
  present.forEach((a) => counts.set(a.species, (counts.get(a.species) ?? 0) + 1));

  const feedsIn = feeds.filter((f) => inPeriod(f.date, period)).sort((a, b) => b.date.localeCompare(a.date));
  const byType = new Map<string, FeedSummary>();
  feedsIn.forEach((f) => {
    const key = f.feedType.trim().toLowerCase();
    const row = byType.get(key) ?? { feedType: f.feedType.trim(), amountKg: 0, costRp: 0, count: 0 };
    row.amountKg += f.amountKg;
    row.costRp += f.costRp ?? 0;
    row.count += 1;
    byType.set(key, row);
  });

  const healthIn = health.filter((h) => inPeriod(h.date, period)).sort((a, b) => b.date.localeCompare(a.date));
  const feedCostRp = feedsIn.reduce((sum, f) => sum + (f.costRp ?? 0), 0);
  const healthCostRp = healthIn.reduce((sum, h) => sum + (h.costRp ?? 0), 0);

  return {
    period,
    animalCount: present.length,
    speciesCounts: Array.from(counts, ([species, count]) => ({ species, count })),
    enteredCount: present.filter((a) => inPeriod(a.entryDate, period)).length,
    growth: present.map((a) => growthInPeriod(a, weights, period)),
    feeds: feedsIn,
    feedByType: Array.from(byType.values()).sort((a, b) => b.amountKg - a.amountKg),
    feedTotalKg: feedsIn.reduce((sum, f) => sum + f.amountKg, 0),
    feedCostRp,
    health: healthIn,
    healthCostRp,
    totalCostRp: feedCostRp + healthCostRp,
    weighCount: weights.filter((w) => inPeriod(w.date, period)).length,
  };
}
