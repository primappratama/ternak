import { MOCK_ANIMALS, MOCK_FEEDS, MOCK_HEALTH, MOCK_WEIGHTS } from './mock-data';
import type { Repository } from './repository.types';
import {
  type Animal,
  DEFAULT_SETTINGS,
  type FeedRecord,
  type HealthRecord,
  type Settings,
  type WeightRecord,
} from './types';

/**
 * Penyimpanan di memori, dipakai untuk pratinjau di browser.
 * Data hilang saat halaman dimuat ulang. Di HP, yang dipakai repository.native.ts (SQLite).
 */
let animals: Animal[] = [];
let weights: WeightRecord[] = [];
let feeds: FeedRecord[] = [];
let health: HealthRecord[] = [];
let settings: Settings = { ...DEFAULT_SETTINGS };

/** Lepas ternak dari catatan pakan/kesehatan, buang catatan yang jadi kosong. */
const detach = <T extends { animalIds: string[] }>(list: T[], animalId: string) =>
  list
    .map((r) => ({ ...r, animalIds: r.animalIds.filter((a) => a !== animalId) }))
    .filter((r) => r.animalIds.length > 0);

export const repository: Repository = {
  async init() {
    if (animals.length === 0 && weights.length === 0) {
      animals = [...MOCK_ANIMALS];
      weights = [...MOCK_WEIGHTS];
      feeds = [...MOCK_FEEDS];
      health = [...MOCK_HEALTH];
    }
  },
  async listAnimals() {
    return [...animals];
  },
  async listWeights() {
    return [...weights];
  },
  async addAnimal(animal, firstWeight) {
    animals = [...animals, animal];
    weights = [...weights, firstWeight];
  },
  async updateAnimal(animal) {
    animals = animals.map((a) => (a.id === animal.id ? animal : a));
  },
  async addWeight(weight) {
    weights = [...weights, weight];
  },
  async deleteAnimal(id) {
    animals = animals.filter((a) => a.id !== id);
    weights = weights.filter((w) => w.animalId !== id);
    feeds = detach(feeds, id);
    health = detach(health, id);
  },
  async updateWeight(weight) {
    weights = weights.map((w) => (w.id === weight.id ? weight : w));
  },
  async deleteWeight(id) {
    weights = weights.filter((w) => w.id !== id);
  },
  async clearAll() {
    animals = [];
    weights = [];
    feeds = [];
    health = [];
  },
  async listFeeds() {
    return [...feeds].sort((a, b) => b.date.localeCompare(a.date));
  },
  async addFeed(feed) {
    feeds = [...feeds, feed];
  },
  async deleteFeed(id) {
    feeds = feeds.filter((f) => f.id !== id);
  },
  async listHealth() {
    return [...health].sort((a, b) => b.date.localeCompare(a.date));
  },
  async addHealth(record) {
    health = [...health, record];
  },
  async deleteHealth(id) {
    health = health.filter((h) => h.id !== id);
  },
  async markHealthNextDone(id) {
    health = health.map((h) => (h.id === id ? { ...h, nextDone: true } : h));
  },
  async getSettings() {
    return { ...settings };
  },
  async saveSettings(next) {
    settings = { ...next };
  },
};
