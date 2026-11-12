import * as SQLite from 'expo-sqlite';

import { MOCK_ANIMALS, MOCK_FEEDS, MOCK_HEALTH, MOCK_WEIGHTS } from './mock-data';
import type { Repository } from './repository.types';
import {
  type Animal,
  DEFAULT_SETTINGS,
  type FeedRecord,
  type HealthKind,
  type HealthRecord,
  type Settings,
  type Sex,
  type Species,
  type WeightRecord,
} from './types';

/**
 * Penyimpanan permanen di HP pakai SQLite, satu file database "ternak.db".
 * Tabel: animals, weights, feeds + feed_animals, health + health_animals, settings.
 * Tabel *_animals menghubungkan satu catatan pakan/kesehatan dengan beberapa ekor.
 */

const DB_NAME = 'ternak.db';

/**
 * Penanda data contoh sudah pernah diisi (PRAGMA user_version).
 * Kolom baru TIDAK ditambah dengan menaikkan angka ini, tapi lewat addColumnIfMissing() di init(),
 * supaya data contoh tidak terisi ulang di HP yang sudah dipakai.
 */
const SCHEMA_VERSION = 1;

type AnimalRow = {
  id: string;
  code: string;
  nickname: string | null;
  species: string;
  sex: string;
  entry_date: string;
  photo_uri: string | null;
  note: string | null;
  target_kg: number | null;
};

type FeedRow = {
  id: string;
  date: string;
  feed_type: string;
  amount_kg: number;
  cost_rp: number | null;
  note: string | null;
};

type HealthRow = {
  id: string;
  date: string;
  kind: string;
  title: string | null;
  cost_rp: number | null;
  note: string | null;
  next_date: string | null;
  next_done: number;
};

type LinkRow = { record_id: string; animal_id: string };

/** Kelompokkan baris penghubung jadi { idCatatan: [idTernak, ...] }. */
const groupLinks = (rows: LinkRow[]) => {
  const map = new Map<string, string[]>();
  rows.forEach((r) => map.set(r.record_id, [...(map.get(r.record_id) ?? []), r.animal_id]));
  return map;
};

type WeightRow = {
  id: string;
  animal_id: string;
  date: string;
  weight_kg: number;
  note: string | null;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const getDb = () => {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
};

const toAnimal = (r: AnimalRow): Animal => ({
  id: r.id,
  code: r.code,
  nickname: r.nickname ?? undefined,
  species: r.species as Species,
  sex: r.sex as Sex,
  entryDate: r.entry_date,
  photoUri: r.photo_uri ?? undefined,
  note: r.note ?? undefined,
  targetKg: r.target_kg ?? undefined,
});

const toWeight = (r: WeightRow): WeightRecord => ({
  id: r.id,
  animalId: r.animal_id,
  date: r.date,
  weightKg: r.weight_kg,
  note: r.note ?? undefined,
});

async function insertAnimal(db: SQLite.SQLiteDatabase, a: Animal) {
  await db.runAsync(
    `INSERT INTO animals (id, code, nickname, species, sex, entry_date, photo_uri, note, target_kg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    a.id,
    a.code,
    a.nickname ?? null,
    a.species,
    a.sex,
    a.entryDate,
    a.photoUri ?? null,
    a.note ?? null,
    a.targetKg ?? null,
  );
}

/** Tambah kolom ke tabel yang sudah ada, kalau belum ada. Aman dijalankan setiap app dibuka. */
async function addColumnIfMissing(db: SQLite.SQLiteDatabase, table: string, column: string, type: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

async function insertFeed(db: SQLite.SQLiteDatabase, f: FeedRecord) {
  await db.runAsync(
    'INSERT INTO feeds (id, date, feed_type, amount_kg, cost_rp, note) VALUES (?, ?, ?, ?, ?, ?)',
    f.id,
    f.date,
    f.feedType,
    f.amountKg,
    f.costRp ?? null,
    f.note ?? null,
  );
  for (const animalId of f.animalIds) {
    await db.runAsync('INSERT INTO feed_animals (feed_id, animal_id) VALUES (?, ?)', f.id, animalId);
  }
}

async function insertHealth(db: SQLite.SQLiteDatabase, h: HealthRecord) {
  await db.runAsync(
    `INSERT INTO health (id, date, kind, title, cost_rp, note, next_date, next_done)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    h.id,
    h.date,
    h.kind,
    h.title ?? null,
    h.costRp ?? null,
    h.note ?? null,
    h.nextDate ?? null,
    h.nextDone ? 1 : 0,
  );
  for (const animalId of h.animalIds) {
    await db.runAsync('INSERT INTO health_animals (health_id, animal_id) VALUES (?, ?)', h.id, animalId);
  }
}

/** Hapus catatan pakan/kesehatan yang sudah tidak punya ternak sama sekali. */
async function removeOrphanRecords(db: SQLite.SQLiteDatabase) {
  await db.runAsync('DELETE FROM feeds WHERE id NOT IN (SELECT feed_id FROM feed_animals)');
  await db.runAsync('DELETE FROM health WHERE id NOT IN (SELECT health_id FROM health_animals)');
}

async function insertWeight(db: SQLite.SQLiteDatabase, w: WeightRecord) {
  await db.runAsync(
    'INSERT INTO weights (id, animal_id, date, weight_kg, note) VALUES (?, ?, ?, ?, ?)',
    w.id,
    w.animalId,
    w.date,
    w.weightKg,
    w.note ?? null,
  );
}

export const repository: Repository = {
  async init() {
    const db = await getDb();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS animals (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT NOT NULL UNIQUE,
        nickname TEXT,
        species TEXT NOT NULL,
        sex TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        photo_uri TEXT,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS weights (
        id TEXT PRIMARY KEY NOT NULL,
        animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_weights_animal ON weights(animal_id);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS feeds (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        feed_type TEXT NOT NULL,
        amount_kg REAL NOT NULL,
        cost_rp INTEGER,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS feed_animals (
        feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
        animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
        PRIMARY KEY (feed_id, animal_id)
      );
      CREATE INDEX IF NOT EXISTS idx_feed_animals_animal ON feed_animals(animal_id);
      CREATE TABLE IF NOT EXISTS health (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT,
        cost_rp INTEGER,
        note TEXT,
        next_date TEXT,
        next_done INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS health_animals (
        health_id TEXT NOT NULL REFERENCES health(id) ON DELETE CASCADE,
        animal_id TEXT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
        PRIMARY KEY (health_id, animal_id)
      );
      CREATE INDEX IF NOT EXISTS idx_health_animals_animal ON health_animals(animal_id);
    `);

    // Kolom yang ditambahkan setelah versi pertama app.
    await addColumnIfMissing(db, 'animals', 'target_kg', 'REAL');

    // Data contoh hanya diisi sekali, saat database baru pertama kali dibuat.
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if ((version?.user_version ?? 0) < SCHEMA_VERSION) {
      await db.withTransactionAsync(async () => {
        for (const a of MOCK_ANIMALS) await insertAnimal(db, a);
        for (const w of MOCK_WEIGHTS) await insertWeight(db, w);
        for (const f of MOCK_FEEDS) await insertFeed(db, f);
        for (const h of MOCK_HEALTH) await insertHealth(db, h);
      });
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    }
  },

  async listAnimals() {
    const db = await getDb();
    const rows = await db.getAllAsync<AnimalRow>('SELECT * FROM animals ORDER BY entry_date DESC');
    return rows.map(toAnimal);
  },

  async listWeights() {
    const db = await getDb();
    const rows = await db.getAllAsync<WeightRow>('SELECT * FROM weights ORDER BY date ASC');
    return rows.map(toWeight);
  },

  async addAnimal(animal, firstWeight) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await insertAnimal(db, animal);
      await insertWeight(db, firstWeight);
    });
  },

  async updateAnimal(animal) {
    const db = await getDb();
    await db.runAsync(
      `UPDATE animals
       SET code = ?, nickname = ?, species = ?, sex = ?, entry_date = ?, photo_uri = ?, note = ?, target_kg = ?
       WHERE id = ?`,
      animal.code,
      animal.nickname ?? null,
      animal.species,
      animal.sex,
      animal.entryDate,
      animal.photoUri ?? null,
      animal.note ?? null,
      animal.targetKg ?? null,
      animal.id,
    );
  },

  async addWeight(weight) {
    const db = await getDb();
    await insertWeight(db, weight);
  },

  async deleteAnimal(id) {
    const db = await getDb();
    // Timbangan ikut terhapus lewat ON DELETE CASCADE; dihapus manual juga supaya pasti.
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM weights WHERE animal_id = ?', id);
      await db.runAsync('DELETE FROM feed_animals WHERE animal_id = ?', id);
      await db.runAsync('DELETE FROM health_animals WHERE animal_id = ?', id);
      await db.runAsync('DELETE FROM animals WHERE id = ?', id);
      await removeOrphanRecords(db);
    });
  },

  async updateWeight(weight) {
    const db = await getDb();
    await db.runAsync(
      'UPDATE weights SET date = ?, weight_kg = ?, note = ? WHERE id = ?',
      weight.date,
      weight.weightKg,
      weight.note ?? null,
      weight.id,
    );
  },

  async deleteWeight(id) {
    const db = await getDb();
    await db.runAsync('DELETE FROM weights WHERE id = ?', id);
  },

  async clearAll() {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM feed_animals');
      await db.runAsync('DELETE FROM feeds');
      await db.runAsync('DELETE FROM health_animals');
      await db.runAsync('DELETE FROM health');
      await db.runAsync('DELETE FROM weights');
      await db.runAsync('DELETE FROM animals');
    });
  },

  async listFeeds() {
    const db = await getDb();
    const rows = await db.getAllAsync<FeedRow>('SELECT * FROM feeds ORDER BY date DESC');
    const links = groupLinks(
      await db.getAllAsync<LinkRow>('SELECT feed_id AS record_id, animal_id FROM feed_animals'),
    );
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      feedType: r.feed_type,
      amountKg: r.amount_kg,
      costRp: r.cost_rp ?? undefined,
      note: r.note ?? undefined,
      animalIds: links.get(r.id) ?? [],
    }));
  },

  async addFeed(feed) {
    const db = await getDb();
    await db.withTransactionAsync(() => insertFeed(db, feed));
  },

  async deleteFeed(id) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM feed_animals WHERE feed_id = ?', id);
      await db.runAsync('DELETE FROM feeds WHERE id = ?', id);
    });
  },

  async listHealth() {
    const db = await getDb();
    const rows = await db.getAllAsync<HealthRow>('SELECT * FROM health ORDER BY date DESC');
    const links = groupLinks(
      await db.getAllAsync<LinkRow>('SELECT health_id AS record_id, animal_id FROM health_animals'),
    );
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      kind: r.kind as HealthKind,
      title: r.title ?? undefined,
      costRp: r.cost_rp ?? undefined,
      note: r.note ?? undefined,
      nextDate: r.next_date ?? undefined,
      nextDone: r.next_done === 1,
      animalIds: links.get(r.id) ?? [],
    }));
  },

  async addHealth(record) {
    const db = await getDb();
    await db.withTransactionAsync(() => insertHealth(db, record));
  },

  async deleteHealth(id) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM health_animals WHERE health_id = ?', id);
      await db.runAsync('DELETE FROM health WHERE id = ?', id);
    });
  },

  async markHealthNextDone(id) {
    const db = await getDb();
    await db.runAsync('UPDATE health SET next_done = 1 WHERE id = ?', id);
  },

  async getSettings() {
    const db = await getDb();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      ownerName: stored.ownerName ?? DEFAULT_SETTINGS.ownerName,
      farmName: stored.farmName ?? DEFAULT_SETTINGS.farmName,
    };
  },

  async saveSettings(next) {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const [key, value] of Object.entries(next)) {
        await db.runAsync(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          key,
          String(value),
        );
      }
    });
  },
};
