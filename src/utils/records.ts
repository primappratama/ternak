import type { Animal, HealthKind } from '@/data/types';

import { dayDiff } from './time';

export const HEALTH_LABEL: Record<HealthKind, string> = {
  vaksin: 'Vaksin',
  obatCacing: 'Obat cacing',
  vitamin: 'Vitamin',
  pengobatan: 'Pengobatan',
  pemeriksaan: 'Pemeriksaan',
  lainnya: 'Lainnya',
};

/** Saran jenis pakan yang umum, ditampilkan sebagai pil di form Pakan. */
export const FEED_SUGGESTIONS = [
  'Rumput gajah',
  'Hijauan',
  'Konsentrat',
  'Dedak',
  'Ampas tahu',
  'Silase',
  'Jerami',
  'Pelet',
  'Jagung',
];

/** Contoh: 24000 jadi "Rp 24.000". */
export function formatRupiah(value: number): string {
  // Pemisah ribuan ditulis manual supaya hasilnya sama di semua HP (tidak bergantung Intl).
  return `Rp ${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Baca isian biaya: "24.000", "24000", atau "Rp 24.000" jadi 24000. Kosong jadi undefined, salah jadi NaN. */
export function parseRupiah(text: string): number | undefined {
  const cleaned = text.replace(/rp/i, '').replace(/[\s.]/g, '');
  if (!cleaned) return undefined;
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

/** Ringkas daftar ternak: "D-01 Si Belang", "D-01, K-07, S-01", atau "5 ekor". */
export function animalsLabel(animals: Pick<Animal, 'code' | 'nickname'>[]): string {
  if (animals.length === 0) return 'ternak sudah dihapus';
  if (animals.length === 1) {
    const a = animals[0];
    return a.nickname ? `${a.code} ${a.nickname}` : a.code;
  }
  if (animals.length <= 3) return animals.map((a) => a.code).join(', ');
  return `${animals.length} ekor`;
}

export type DueTone = 'danger' | 'warning' | 'neutral';

/** Teks jatuh tempo jadwal: "Lewat 2 hari", "Hari ini", "Besok", "5 hari lagi". */
export function dueLabel(nextDate: string, now: Date = new Date()): { text: string; tone: DueTone; days: number } {
  // dayDiff(dari, sampai): positif kalau tanggal jadwal sudah lewat.
  const late = dayDiff(nextDate, now);
  if (late > 0) return { text: `Lewat ${late} hari`, tone: 'danger', days: -late };
  if (late === 0) return { text: 'Hari ini', tone: 'warning', days: 0 };
  if (late === -1) return { text: 'Besok', tone: 'warning', days: 1 };
  return { text: `${-late} hari lagi`, tone: -late <= 7 ? 'warning' : 'neutral', days: -late };
}

/** Jadwal yang muncul di Beranda: yang sudah lewat atau jatuh tempo dalam sekian hari. */
export const SCHEDULE_WINDOW_DAYS = 14;
