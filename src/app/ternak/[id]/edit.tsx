import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { AnimalForm, type AnimalFormValues } from '@/components/animal-form';
import { EmptyState } from '@/components/empty-state';
import { useLivestock } from '@/hooks/use-livestock';
import { successFeedback } from '@/utils/feedback';
import { toDecimalText, toStoredDate } from '@/utils/form';
import { deletePhoto, persistPhoto } from '@/utils/photos';
import { formatTanggalSedang } from '@/utils/time';

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function EditTernakScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { animals, getAnimal, updateAnimal, updateWeight } = useLivestock();
  const animal = getAnimal(id);

  const otherAnimals = useMemo(() => animals.filter((a) => a.id !== id), [animals, id]);

  if (!animal) {
    return <EmptyState title="Ternak tidak ditemukan" message="Data ternak ini mungkin sudah dihapus." />;
  }

  const [first, second] = animal.growth.records;
  // Ternak yang dibuat lewat form Tambah punya timbangan pertama di tanggal masuk.
  // Kalau tanggal masuk dikoreksi, timbangan pertama ikut pindah supaya tetap sejalan.
  const linked = !!first && sameDay(new Date(first.date), new Date(animal.entryDate));
  const limit = linked ? second : first;
  const maxEntryDate = limit ? new Date(limit.date) : undefined;

  const save = async (v: AnimalFormValues) => {
    const entryChanged = !sameDay(v.entryDate, new Date(animal.entryDate));
    const entryDate = entryChanged ? toStoredDate(v.entryDate) : animal.entryDate;

    const oldPhoto = animal.photoUri;
    const photoChanged = v.photoUri !== (oldPhoto ?? null);
    const newPhoto = photoChanged
      ? v.photoUri
        ? await persistPhoto(v.photoUri, animal.id)
        : undefined
      : oldPhoto;

    try {
      await updateAnimal({
        id: animal.id,
        code: v.code,
        nickname: v.nickname,
        species: v.species,
        sex: v.sex,
        entryDate,
        photoUri: newPhoto,
        note: animal.note,
        targetKg: v.targetKg,
      });

      if (first) {
        let date = first.date;
        if (linked && entryChanged) {
          date = entryDate;
          // Jaga urutan: timbangan pertama harus tetap sebelum timbangan kedua di hari yang sama.
          if (second && new Date(date) >= new Date(second.date)) {
            date = new Date(new Date(second.date).getTime() - 60_000).toISOString();
          }
        }
        if (date !== first.date || v.weightKg !== first.weightKg) {
          await updateWeight({ ...first, date, weightKg: v.weightKg });
        }
      }
    } catch (error) {
      if (photoChanged) deletePhoto(newPhoto);
      throw error;
    }

    // Foto lama baru dihapus setelah data baru tersimpan.
    if (photoChanged) deletePhoto(oldPhoto);
    successFeedback();
    router.back();
  };

  return (
    <AnimalForm
      mode="edit"
      initial={{
        photoUri: animal.photoUri ?? null,
        species: animal.species,
        code: animal.code,
        nickname: animal.nickname ?? '',
        sex: animal.sex,
        entryDate: new Date(animal.entryDate),
        weightText: first ? toDecimalText(first.weightKg) : '',
        targetText: animal.targetKg !== undefined ? toDecimalText(animal.targetKg) : '',
      }}
      otherAnimals={otherAnimals}
      maxEntryDate={maxEntryDate}
      entryDateHint={
        linked ? 'Timbangan pertama (berat awal) ikut pindah ke tanggal ini.' : undefined
      }
      weightLabel="Berat awal"
      weightHint={
        first
          ? `Mengubah timbangan pertama (${formatTanggalSedang(new Date(first.date))}). Timbangan lain tidak berubah.`
          : 'Belum ada timbangan.'
      }
      onSubmit={save}
    />
  );
}
