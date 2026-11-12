import type { Growth } from './growth';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Perkiraan lebih dari ini dianggap tidak berguna (laju terlalu kecil). */
export const MAX_ESTIMATE_DAYS = 730;

type Base = {
  targetKg: number;
  /** 0 sampai 1, dihitung dari berat awal ke target. */
  progress: number;
  /** Sisa berat sampai target (kg), 0 kalau sudah tercapai. */
  remainingKg: number;
};

export type TargetEstimate = Base &
  (
    | { kind: 'tercapai'; reachedOn: Date }
    | { kind: 'perkiraan'; etaDate: Date; daysLeft: number; adgKg: number; overdue: boolean }
    /** Belum ada 2 timbangan yang berjarak minimal 1 hari. */
    | { kind: 'kurangData' }
    /** Rata-rata kenaikan nol atau minus. */
    | { kind: 'tidakNaik'; adgKg: number }
    /** Dengan laju sekarang butuh lebih dari MAX_ESTIMATE_DAYS. */
    | { kind: 'terlaluLama'; adgKg: number }
  );

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Perkiraan kapan target berat tercapai.
 * Sisa berat dibagi rata-rata kenaikan harian sejak timbangan pertama, lalu dihitung maju
 * dari tanggal timbangan terakhir. Rata-rata keseluruhan dipakai (bukan kenaikan terakhir)
 * supaya satu timbangan yang meleset tidak membuat tanggalnya loncat jauh.
 */
export function estimateTarget(growth: Growth, targetKg: number, now: Date = new Date()): TargetEstimate | undefined {
  const { records, latestWeightKg, firstWeightKg, overallAdgKg } = growth;
  if (latestWeightKg === undefined || firstWeightKg === undefined || records.length === 0) return undefined;

  const remainingKg = Math.max(0, targetKg - latestWeightKg);
  const span = targetKg - firstWeightKg;
  const progress =
    latestWeightKg >= targetKg
      ? 1
      : span <= 0
        ? 0
        : Math.min(1, Math.max(0, (latestWeightKg - firstWeightKg) / span));
  const base = { targetKg, progress, remainingKg };

  if (latestWeightKg >= targetKg) {
    // Tanggal tercapai = awal deretan timbangan terakhir yang semuanya sudah di atas target.
    let i = records.length - 1;
    while (i > 0 && records[i - 1].weightKg >= targetKg) i -= 1;
    return { ...base, kind: 'tercapai', reachedOn: new Date(records[i].date) };
  }

  if (overallAdgKg === undefined) return { ...base, kind: 'kurangData' };
  if (overallAdgKg <= 0) return { ...base, kind: 'tidakNaik', adgKg: overallAdgKg };

  const daysNeeded = Math.ceil(remainingKg / overallAdgKg);
  if (daysNeeded > MAX_ESTIMATE_DAYS) return { ...base, kind: 'terlaluLama', adgKg: overallAdgKg };

  const lastDate = new Date(records[records.length - 1].date);
  const etaDate = startOfDay(new Date(lastDate.getTime() + daysNeeded * DAY_MS));
  const daysLeft = Math.round((etaDate.getTime() - startOfDay(now).getTime()) / DAY_MS);
  return {
    ...base,
    kind: 'perkiraan',
    etaDate,
    daysLeft,
    adgKg: overallAdgKg,
    overdue: daysLeft < 0,
  };
}
