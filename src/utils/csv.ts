import type { Animal, WeightRecord } from '@/data/types';

import { SPECIES_LABEL, sortByDate } from './growth';

const pad = (n: number) => String(n).padStart(2, '0');

/** Tanggal lokal format 2026-11-12, supaya bisa diurutkan di Excel / Google Sheets. */
export function isoDay(value: string | Date): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Bungkus nilai dengan tanda kutip kalau berisi koma, kutip, atau baris baru. */
function cell(value: string | number | undefined): string {
  if (value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const HEADER = [
  'kode',
  'nama',
  'jenis',
  'kelamin',
  'tanggal_masuk',
  'target_kg',
  'tanggal_timbang',
  'berat_kg',
  'catatan_timbang',
];

/**
 * Satu baris per timbangan, lengkap dengan data ternaknya.
 * Pemisah koma dan desimal titik (format CSV standar), diawali BOM supaya Excel membaca UTF-8.
 */
export function buildLivestockCsv(animals: Animal[], weights: WeightRecord[]): string {
  const rows: string[][] = [HEADER];
  const sorted = [...animals].sort((a, b) => a.code.localeCompare(b.code, 'id', { numeric: true }));

  for (const animal of sorted) {
    const base = [
      cell(animal.code),
      cell(animal.nickname),
      cell(SPECIES_LABEL[animal.species]),
      cell(animal.sex),
      cell(isoDay(animal.entryDate)),
      cell(animal.targetKg),
    ];
    const records = sortByDate(weights.filter((w) => w.animalId === animal.id));
    if (records.length === 0) {
      rows.push([...base, '', '', '']);
      continue;
    }
    for (const w of records) {
      rows.push([...base, cell(isoDay(w.date)), cell(w.weightKg), cell(w.note)]);
    }
  }

  return '﻿' + rows.map((r) => r.join(',')).join('\r\n') + '\r\n';
}

export function csvFileName(now: Date = new Date()): string {
  return `ternak-${isoDay(now)}.csv`;
}
