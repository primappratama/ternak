import type { Animal, FeedRecord, HealthRecord, WeightRecord } from './types';

/**
 * Data contoh yang diisi saat app pertama kali dibuka.
 * Tanggal dibuat relatif terhadap hari ini supaya statusnya selalu kelihatan.
 */
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_ANIMALS: Animal[] = [
  { id: 'a1', code: 'D-01', nickname: 'Si Belang', species: 'domba', sex: 'jantan', entryDate: daysAgo(72), targetKg: 35 },
  { id: 'a2', code: 'K-07', nickname: 'Cemong', species: 'kambing', sex: 'betina', entryDate: daysAgo(62), targetKg: 30 },
  { id: 'a3', code: 'S-01', nickname: 'Gagah', species: 'sapi', sex: 'jantan', entryDate: daysAgo(60), targetKg: 350 },
  { id: 'a4', code: 'D-04', nickname: 'Mbek', species: 'domba', sex: 'betina', entryDate: daysAgo(50) },
  { id: 'a5', code: 'K-03', nickname: 'Jalu', species: 'kambing', sex: 'jantan', entryDate: daysAgo(45) },
  { id: 'a6', code: 'A-12', species: 'ayam', sex: 'jantan', entryDate: daysAgo(36), targetKg: 1.2 },
  { id: 'a7', code: 'D-09', nickname: 'Putih', species: 'domba', sex: 'betina', entryDate: daysAgo(5) },
];

/** [animalId, berapa hari lalu, berat kg] */
const RAW: [string, number, number][] = [
  // Si Belang: naik stabil sekitar 110 g/hari
  ['a1', 70, 18.0], ['a1', 56, 19.6], ['a1', 42, 21.1], ['a1', 28, 22.5], ['a1', 14, 24.1], ['a1', 2, 25.6],
  // Cemong: sempat naik, lalu turun di timbangan terakhir
  ['a2', 60, 20.0], ['a2', 46, 21.2], ['a2', 32, 22.3], ['a2', 18, 23.1], ['a2', 4, 22.6],
  // Gagah: naik cepat, lalu melambat
  ['a3', 58, 245], ['a3', 44, 256], ['a3', 30, 266], ['a3', 16, 277], ['a3', 3, 279],
  // Mbek: timbangan terakhir sudah lebih dari 14 hari lalu
  ['a4', 49, 16.5], ['a4', 35, 17.8], ['a4', 21, 19.0],
  // Jalu: naik stabil sekitar 100 g/hari
  ['a5', 44, 22.0], ['a5', 30, 23.4], ['a5', 16, 24.9], ['a5', 1, 26.4],
  // Ayam A-12: naik sekitar 25 g/hari
  ['a6', 35, 0.42], ['a6', 28, 0.6], ['a6', 21, 0.78], ['a6', 14, 0.95], ['a6', 7, 1.12], ['a6', 0, 1.3],
  // Putih: baru masuk, baru ditimbang sekali
  ['a7', 5, 17.2],
];

export const MOCK_WEIGHTS: WeightRecord[] = RAW.map(([animalId, ago, weightKg], i) => ({
  id: `w${i + 1}`,
  animalId,
  date: daysAgo(ago),
  weightKg,
}));

const SMALL_RUMINANTS = ['a1', 'a2', 'a4', 'a5', 'a7'];

/** Contoh catatan pakan. Angka negatif di daysAgo berarti hari ke depan. */
export const MOCK_FEEDS: FeedRecord[] = [
  { id: 'f1', date: daysAgo(1), feedType: 'Rumput gajah', amountKg: 30, animalIds: SMALL_RUMINANTS },
  { id: 'f2', date: daysAgo(1), feedType: 'Konsentrat', amountKg: 4, costRp: 24000, animalIds: SMALL_RUMINANTS },
  { id: 'f3', date: daysAgo(2), feedType: 'Jerami + konsentrat', amountKg: 18, costRp: 45000, animalIds: ['a3'] },
  { id: 'f4', date: daysAgo(3), feedType: 'Pelet', amountKg: 0.5, costRp: 6000, animalIds: ['a6'] },
  { id: 'f5', date: daysAgo(8), feedType: 'Rumput gajah', amountKg: 28, animalIds: SMALL_RUMINANTS },
];

/** Contoh catatan kesehatan, termasuk jadwal yang sudah dekat dan yang terlewat. */
export const MOCK_HEALTH: HealthRecord[] = [
  {
    id: 'h1',
    date: daysAgo(80),
    kind: 'obatCacing',
    title: 'Albendazole',
    costRp: 20000,
    animalIds: ['a1', 'a2', 'a4', 'a5'],
    nextDate: daysAgo(-10),
  },
  { id: 'h2', date: daysAgo(20), kind: 'vaksin', title: 'Vaksin PMK', animalIds: ['a3'], nextDate: daysAgo(-160) },
  {
    id: 'h3',
    date: daysAgo(4),
    kind: 'pengobatan',
    title: 'Diare',
    costRp: 15000,
    note: 'Diberi oralit, nafsu makan turun.',
    animalIds: ['a2'],
    nextDate: daysAgo(1),
  },
  { id: 'h4', date: daysAgo(30), kind: 'vitamin', title: 'Vitamin B kompleks', animalIds: ['a6'] },
];

/** Id ternak contoh, dipakai tombol "Hapus data contoh" di Pengaturan. */
export const SAMPLE_ANIMAL_IDS: readonly string[] = MOCK_ANIMALS.map((a) => a.id);
