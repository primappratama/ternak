import { useMemo } from 'react';

import { useLivestockStore } from '@/data/livestock-store';
import type { Animal, FeedRecord, HealthRecord, Species } from '@/data/types';
import { computeGrowth, type Growth } from '@/utils/growth';

export type AnimalWithGrowth = Animal & { growth: Growth };

/** Satu baris di daftar Aktivitas: timbang, pakan, atau kesehatan. */
export type Activity =
  | { kind: 'timbang'; id: string; date: string; animals: Animal[]; weightKg: number }
  | { kind: 'pakan'; id: string; date: string; animals: Animal[]; record: FeedRecord }
  | { kind: 'kesehatan'; id: string; date: string; animals: Animal[]; record: HealthRecord };

/** Jadwal kesehatan berikutnya yang belum dikerjakan. */
export type Schedule = { record: HealthRecord; animals: Animal[]; nextDate: string };

/** Urutan status di daftar: yang paling butuh perhatian di atas. */
const STATUS_ORDER = { turun: 0, melambat: 1, belumDitimbang: 2, normal: 3 } as const;

/**
 * Data ternak siap pakai untuk halaman: diambil dari database (lewat LivestockProvider),
 * lalu dihitung pertumbuhan, status, dan statistiknya.
 */
export function useLivestock() {
  const {
    animals,
    weights,
    feeds,
    health,
    addAnimal,
    updateAnimal,
    addWeight,
    updateWeight,
    deleteAnimal,
    deleteWeight,
  } = useLivestockStore();
  // Waktu "sekarang" dihitung ulang setiap data berubah, misalnya setelah timbang baru.
  const now = useMemo(() => new Date(), [animals, weights]);

  // Hitung pertumbuhan tiap ekor sekali, lalu dipakai ulang di semua layar.
  const withGrowth = useMemo<AnimalWithGrowth[]>(
    () =>
      animals
        .map((animal) => ({
          ...animal,
          growth: computeGrowth(
            weights.filter((w) => w.animalId === animal.id),
            now,
          ),
        }))
        .sort((a, b) => STATUS_ORDER[a.growth.status] - STATUS_ORDER[b.growth.status]),
    [animals, weights, now],
  );

  const stats = useMemo(() => {
    const masukBulanIni = animals.filter((a) => {
      const d = new Date(a.entryDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const ditimbangMingguIni = withGrowth.filter(
      (a) => a.growth.daysSinceLastWeigh !== undefined && a.growth.daysSinceLastWeigh <= 7,
    ).length;
    return {
      total: withGrowth.length,
      masukBulanIni,
      perluPerhatian: withGrowth.filter((a) => a.growth.status !== 'normal').length,
      ditimbangMingguIni,
    };
  }, [animals, withGrowth, now]);

  // Jenis ternak yang ada di kandang beserta jumlahnya, untuk pil filter.
  const speciesCounts = useMemo(() => {
    const counts = new Map<Species, number>();
    animals.forEach((a) => counts.set(a.species, (counts.get(a.species) ?? 0) + 1));
    return Array.from(counts, ([species, count]) => ({ species, count }));
  }, [animals]);

  const needsAttention = useMemo(
    () => withGrowth.filter((a) => a.growth.status !== 'normal'),
    [withGrowth],
  );

  const animalById = useMemo(() => new Map(animals.map((a) => [a.id, a])), [animals]);
  const pick = useMemo(
    () => (ids: string[]) => ids.map((id) => animalById.get(id)).filter((a): a is Animal => !!a),
    [animalById],
  );

  // Semua kegiatan terbaru: timbang, pakan, dan kesehatan, diurutkan dari yang paling baru.
  const activities = useMemo<Activity[]>(() => {
    const list: Activity[] = [
      ...weights.map((w) => ({
        kind: 'timbang' as const,
        id: w.id,
        date: w.date,
        animals: pick([w.animalId]),
        weightKg: w.weightKg,
      })),
      ...feeds.map((f) => ({ kind: 'pakan' as const, id: f.id, date: f.date, animals: pick(f.animalIds), record: f })),
      ...health.map((h) => ({
        kind: 'kesehatan' as const,
        id: h.id,
        date: h.date,
        animals: pick(h.animalIds),
        record: h,
      })),
    ];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [weights, feeds, health, pick]);

  // Jadwal kesehatan yang belum dikerjakan, paling dekat di atas.
  const schedules = useMemo<Schedule[]>(
    () =>
      health
        .filter((h): h is HealthRecord & { nextDate: string } => !!h.nextDate && !h.nextDone)
        .map((h) => ({ record: h, animals: pick(h.animalIds), nextDate: h.nextDate }))
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
    [health, pick],
  );

  /** Catatan pakan dan kesehatan untuk satu ekor, paling baru di atas. */
  const notesFor = (animalId: string) =>
    activities.filter((a) => a.kind !== 'timbang' && a.record.animalIds.includes(animalId));

  const getAnimal = (id: string | undefined) => withGrowth.find((a) => a.id === id);

  return {
    now,
    animals: withGrowth,
    stats,
    speciesCounts,
    needsAttention,
    activities,
    schedules,
    notesFor,
    getAnimal,
    addAnimal,
    updateAnimal,
    addWeight,
    updateWeight,
    deleteAnimal,
    deleteWeight,
  };
}
