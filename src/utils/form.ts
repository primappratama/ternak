import type { Species } from '@/data/types';

/** Id unik sederhana, cukup untuk data lokal di satu HP. */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Baca angka desimal gaya Indonesia: "25,6" atau "25.6" jadi 25.6. Kosong atau salah jadi NaN. */
export function parseDecimal(text: string): number {
  const cleaned = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** Angka ke teks isian, pakai koma desimal. Contoh: 25.6 jadi "25,6". */
export function toDecimalText(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

/**
 * Tanggal dari form disimpan sebagai ISO string.
 * Kalau tanggalnya hari ini, pakai jam sekarang; kalau tanggal lain, pakai jam 12 siang
 * supaya nggak bergeser ke hari sebelumnya karena zona waktu.
 */
export function toStoredDate(date: Date, now: Date = new Date()): string {
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return now.toISOString();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString();
}

/** Awalan kode per jenis ternak, misalnya Domba jadi "D". */
export const CODE_PREFIX: Record<Species, string> = {
  sapi: 'S',
  kerbau: 'KB',
  kambing: 'K',
  domba: 'D',
  ayam: 'A',
  bebek: 'B',
  kelinci: 'KL',
  lainnya: 'L',
};

/** Usulan kode berikutnya: awalan jenis + nomor terbesar yang sudah ada + 1. Contoh: "D-10". */
export function suggestCode(species: Species, existingCodes: string[]): string {
  const prefix = CODE_PREFIX[species];
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  const maxNumber = existingCodes.reduce((max, code) => {
    const match = code.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(maxNumber + 1).padStart(2, '0')}`;
}
