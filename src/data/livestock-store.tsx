import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deletePhoto } from '@/utils/photos';

import { SAMPLE_ANIMAL_IDS } from './mock-data';
import { repository } from './repository';
import {
  type Animal,
  DEFAULT_SETTINGS,
  type FeedRecord,
  type HealthRecord,
  type Settings,
  type WeightRecord,
} from './types';

type Store = {
  ready: boolean;
  animals: Animal[];
  weights: WeightRecord[];
  feeds: FeedRecord[];
  health: HealthRecord[];
  settings: Settings;
  addAnimal: (animal: Animal, firstWeight: WeightRecord) => Promise<void>;
  updateAnimal: (animal: Animal) => Promise<void>;
  addWeight: (weight: WeightRecord) => Promise<void>;
  updateWeight: (weight: WeightRecord) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;
  addFeed: (feed: FeedRecord) => Promise<void>;
  deleteFeed: (id: string) => Promise<void>;
  addHealth: (record: HealthRecord) => Promise<void>;
  deleteHealth: (id: string) => Promise<void>;
  markHealthNextDone: (id: string) => Promise<void>;
  /** Hapus ternak contoh bawaan app (D-01 Si Belang dkk.), data buatan sendiri tetap ada. */
  clearSample: () => Promise<void>;
  /** Hapus semua ternak, timbangan, dan foto. Nama di Pengaturan tetap. */
  clearAll: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
};

const LivestockContext = createContext<Store | null>(null);

/** Lepas ternak dari catatan pakan/kesehatan; catatan yang jadi tanpa ternak ikut dibuang (sama seperti di database). */
function detachAnimals<T extends { animalIds: string[] }>(list: T[], removed: Set<string>): T[] {
  return list
    .map((r) => ({ ...r, animalIds: r.animalIds.filter((a) => !removed.has(a)) }))
    .filter((r) => r.animalIds.length > 0);
}

const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date);

/**
 * Menyimpan data ternak di satu tempat untuk semua halaman.
 * Setiap perubahan ditulis ke database dulu, lalu state diperbarui,
 * sehingga semua halaman langsung ikut berubah tanpa dimuat ulang.
 */
export function LivestockProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [health, setHealth] = useState<HealthRecord[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await repository.init();
      const [a, w, f, h, s] = await Promise.all([
        repository.listAnimals(),
        repository.listWeights(),
        repository.listFeeds(),
        repository.listHealth(),
        repository.getSettings(),
      ]);
      if (!mounted) return;
      setAnimals(a);
      setWeights(w);
      setFeeds(f);
      setHealth(h);
      setSettings(s);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addAnimal = useCallback(async (animal: Animal, firstWeight: WeightRecord) => {
    await repository.addAnimal(animal, firstWeight);
    setAnimals((prev) => [animal, ...prev]);
    setWeights((prev) => [...prev, firstWeight]);
  }, []);

  const updateAnimal = useCallback(async (animal: Animal) => {
    await repository.updateAnimal(animal);
    setAnimals((prev) => prev.map((a) => (a.id === animal.id ? animal : a)));
  }, []);

  const addWeight = useCallback(async (weight: WeightRecord) => {
    await repository.addWeight(weight);
    setWeights((prev) => [...prev, weight]);
  }, []);

  const updateWeight = useCallback(async (weight: WeightRecord) => {
    await repository.updateWeight(weight);
    setWeights((prev) => prev.map((w) => (w.id === weight.id ? weight : w)));
  }, []);

  const deleteAnimal = useCallback(async (id: string) => {
    await repository.deleteAnimal(id);
    const removed = new Set([id]);
    setAnimals((prev) => prev.filter((a) => a.id !== id));
    setWeights((prev) => prev.filter((w) => w.animalId !== id));
    setFeeds((prev) => detachAnimals(prev, removed));
    setHealth((prev) => detachAnimals(prev, removed));
  }, []);

  const deleteWeight = useCallback(async (id: string) => {
    await repository.deleteWeight(id);
    setWeights((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const addFeed = useCallback(async (feed: FeedRecord) => {
    await repository.addFeed(feed);
    setFeeds((prev) => [...prev, feed].sort(byDateDesc));
  }, []);

  const deleteFeed = useCallback(async (id: string) => {
    await repository.deleteFeed(id);
    setFeeds((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addHealth = useCallback(async (record: HealthRecord) => {
    await repository.addHealth(record);
    setHealth((prev) => [...prev, record].sort(byDateDesc));
  }, []);

  const deleteHealth = useCallback(async (id: string) => {
    await repository.deleteHealth(id);
    setHealth((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const markHealthNextDone = useCallback(async (id: string) => {
    await repository.markHealthNextDone(id);
    setHealth((prev) => prev.map((h) => (h.id === id ? { ...h, nextDone: true } : h)));
  }, []);

  const clearSample = useCallback(async () => {
    const samples = animals.filter((a) => SAMPLE_ANIMAL_IDS.includes(a.id));
    for (const animal of samples) {
      await repository.deleteAnimal(animal.id);
      deletePhoto(animal.photoUri);
    }
    const removed = new Set(samples.map((a) => a.id));
    setAnimals((prev) => prev.filter((a) => !removed.has(a.id)));
    setWeights((prev) => prev.filter((w) => !removed.has(w.animalId)));
    setFeeds((prev) => detachAnimals(prev, removed));
    setHealth((prev) => detachAnimals(prev, removed));
  }, [animals]);

  const clearAll = useCallback(async () => {
    await repository.clearAll();
    animals.forEach((a) => deletePhoto(a.photoUri));
    setAnimals([]);
    setWeights([]);
    setFeeds([]);
    setHealth([]);
  }, [animals]);

  const updateSettings = useCallback(async (next: Settings) => {
    await repository.saveSettings(next);
    setSettings(next);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      animals,
      weights,
      feeds,
      health,
      settings,
      addAnimal,
      updateAnimal,
      addWeight,
      updateWeight,
      deleteAnimal,
      deleteWeight,
      addFeed,
      deleteFeed,
      addHealth,
      deleteHealth,
      markHealthNextDone,
      clearSample,
      clearAll,
      updateSettings,
    }),
    [
      ready,
      animals,
      weights,
      feeds,
      health,
      settings,
      addAnimal,
      updateAnimal,
      addWeight,
      updateWeight,
      deleteAnimal,
      deleteWeight,
      addFeed,
      deleteFeed,
      addHealth,
      deleteHealth,
      markHealthNextDone,
      clearSample,
      clearAll,
      updateSettings,
    ],
  );

  return <LivestockContext.Provider value={value}>{children}</LivestockContext.Provider>;
}

export function useLivestockStore(): Store {
  const store = useContext(LivestockContext);
  if (!store) throw new Error('useLivestockStore harus dipakai di dalam LivestockProvider');
  return store;
}
