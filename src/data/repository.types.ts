import type { Animal, FeedRecord, HealthRecord, Settings, WeightRecord } from './types';

/**
 * Kontrak penyimpanan data. Ada dua implementasi:
 * - repository.native.ts: SQLite di HP (Android/iOS), data permanen.
 * - repository.ts: simpan di memori, hanya untuk pratinjau di browser.
 * Metro otomatis memilih file .native.ts saat app jalan di HP.
 */
export type Repository = {
  /** Buat tabel kalau belum ada, dan isi data contoh saat app pertama kali dibuka. */
  init(): Promise<void>;
  listAnimals(): Promise<Animal[]>;
  listWeights(): Promise<WeightRecord[]>;
  /** Simpan ternak baru sekaligus timbangan pertamanya. */
  addAnimal(animal: Animal, firstWeight: WeightRecord): Promise<void>;
  /** Ubah data ternak (kode, nama, jenis, kelamin, tanggal masuk, foto). */
  updateAnimal(animal: Animal): Promise<void>;
  addWeight(weight: WeightRecord): Promise<void>;
  /**
   * Hapus ternak beserta semua timbangannya. Ternak juga dilepas dari catatan pakan/kesehatan;
   * catatan yang jadi tidak punya ternak sama sekali ikut terhapus.
   */
  deleteAnimal(id: string): Promise<void>;
  /** Ubah tanggal atau berat satu timbangan (dipakai saat edit berat awal). */
  updateWeight(weight: WeightRecord): Promise<void>;
  deleteWeight(id: string): Promise<void>;
  listFeeds(): Promise<FeedRecord[]>;
  addFeed(feed: FeedRecord): Promise<void>;
  deleteFeed(id: string): Promise<void>;
  listHealth(): Promise<HealthRecord[]>;
  addHealth(record: HealthRecord): Promise<void>;
  deleteHealth(id: string): Promise<void>;
  /** Tandai jadwal berikutnya sudah dikerjakan / dilewati. */
  markHealthNextDone(id: string): Promise<void>;
  /** Hapus semua ternak, timbangan, pakan, dan catatan kesehatan. */
  clearAll(): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
};
