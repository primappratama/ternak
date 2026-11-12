const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Contoh: "Kamis, 12 November 2026" */
export function formatTanggalPanjang(date: Date): string {
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** Contoh: "12 November 2026" */
export function formatTanggalSedang(date: Date): string {
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** Contoh: "12 Nov" */
export function formatTanggalPendek(date: Date): string {
  return `${date.getDate()} ${BULAN[date.getMonth()].slice(0, 3)}`;
}

/** Selisih hari kalender antara dua waktu (tanpa memperhitungkan jam). */
export function dayDiff(fromIso: string, now: Date = new Date()): number {
  const from = new Date(fromIso);
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}

/** Contoh: "hari ini", "kemarin", "5 hari lalu" */
export function formatRelatif(iso: string, now: Date = new Date()): string {
  const d = dayDiff(iso, now);
  if (d <= 0) return 'hari ini';
  if (d === 1) return 'kemarin';
  return `${d} hari lalu`;
}
