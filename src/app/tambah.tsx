import { useRouter } from 'expo-router';

import { AnimalForm, type AnimalFormValues } from '@/components/animal-form';
import { useLivestock } from '@/hooks/use-livestock';
import { successFeedback } from '@/utils/feedback';
import { newId, toStoredDate } from '@/utils/form';
import { deletePhoto, persistPhoto } from '@/utils/photos';

export default function TambahScreen() {
  const router = useRouter();
  const { animals, addAnimal } = useLivestock();

  const save = async (v: AnimalFormValues) => {
    const id = newId('a');
    const storedDate = toStoredDate(v.entryDate);
    const savedPhoto = v.photoUri ? await persistPhoto(v.photoUri, id) : undefined;
    try {
      await addAnimal(
        {
          id,
          code: v.code,
          nickname: v.nickname,
          species: v.species,
          sex: v.sex,
          entryDate: storedDate,
          photoUri: savedPhoto,
          targetKg: v.targetKg,
        },
        // Berat awal dicatat sebagai timbangan pertama, di tanggal masuk kandang.
        { id: newId('w'), animalId: id, date: storedDate, weightKg: v.weightKg },
      );
    } catch (error) {
      // Gagal simpan: buang salinan foto supaya tidak jadi file yatim.
      deletePhoto(savedPhoto);
      throw error;
    }
    successFeedback();
    router.replace({ pathname: '/ternak/[id]', params: { id } });
  };

  return (
    <AnimalForm
      mode="tambah"
      otherAnimals={animals}
      weightLabel="Berat awal"
      weightHint="Jadi timbangan pertama, dasar grafik pertumbuhan."
      onSubmit={save}
    />
  );
}
