export type Species = 'sapi' | 'kerbau' | 'kambing' | 'domba' | 'ayam' | 'bebek' | 'kelinci' | 'lainnya';

export type Sex = 'jantan' | 'betina';

/** Satu ekor ternak. */
export type Animal = {
  id: string;
  /** Kode singkat, misalnya yang ditulis di kalung atau ear tag. */
  code: string;
  nickname?: string;
  species: Species;
  sex: Sex;
  /** Tanggal ternak masuk ke kandang (ISO string). */
  entryDate: string;
  photoUri?: string;
  note?: string;
  /** Target berat (kg), misalnya berat siap jual. Opsional. */
  targetKg?: number;
};

/** Satu kali penimbangan. Berat selalu dalam kg. */
export type WeightRecord = {
  id: string;
  animalId: string;
  date: string;
  weightKg: number;
  note?: string;
};

/**
 * Status pertumbuhan, dihitung dari riwayat timbang (tidak disimpan):
 * - normal: berat naik dengan laju yang wajar dibanding rata-ratanya sendiri
 * - melambat: kenaikan terakhir jauh di bawah rata-rata ternak itu sendiri
 * - turun: berat turun sejak timbang sebelumnya
 * - belumDitimbang: belum ditimbang lebih dari batas hari, atau baru punya 1 data
 */
export type GrowthStatus = 'normal' | 'melambat' | 'turun' | 'belumDitimbang';

/** Pengaturan yang bisa diubah pengguna. */
export type Settings = {
  /** Dipakai di sapaan beranda, misalnya "Halo, Pak Dedi". */
  ownerName: string;
  farmName: string;
};

export const DEFAULT_SETTINGS: Settings = {
  ownerName: 'Peternak',
  farmName: 'Peternakan Sejahtera',
};

/**
 * Catatan pemberian pakan. Satu catatan bisa untuk beberapa ekor sekaligus,
 * karena di kandang pakan biasanya diberikan bersamaan.
 */
export type FeedRecord = {
  id: string;
  /** Tanggal pemberian (ISO string). */
  date: string;
  /** Misalnya "Rumput gajah" atau "Konsentrat". */
  feedType: string;
  /** Jumlah total untuk semua ekor di catatan ini (kg). */
  amountKg: number;
  costRp?: number;
  note?: string;
  animalIds: string[];
};

export type HealthKind = 'vaksin' | 'obatCacing' | 'vitamin' | 'pengobatan' | 'pemeriksaan' | 'lainnya';

/** Catatan kesehatan: vaksin, obat, pengobatan, dll. Bisa untuk beberapa ekor sekaligus. */
export type HealthRecord = {
  id: string;
  date: string;
  kind: HealthKind;
  /** Nama vaksin / obat / keluhan, misalnya "Ivermectin" atau "Diare". */
  title?: string;
  costRp?: number;
  note?: string;
  animalIds: string[];
  /** Jadwal tindakan berikutnya (ISO string), misalnya obat cacing 3 bulan lagi. */
  nextDate?: string;
  /** true kalau jadwal berikutnya sudah dikerjakan atau dilewati. */
  nextDone?: boolean;
};
