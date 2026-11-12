import { Check } from '@/constants/icons';
import { useMemo, useState } from 'react';

import { BigActionButton } from '@/components/big-action-button';
import { ChoiceChips } from '@/components/choice-chips';
import { DateField } from '@/components/date-field';
import { FormField, TextField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { PhotoPicker } from '@/components/photo-picker';
import type { Animal, Sex, Species } from '@/data/types';
import { confirmAsync, notify } from '@/utils/feedback';
import { parseDecimal, suggestCode } from '@/utils/form';
import { SPECIES_LABEL } from '@/utils/growth';
import { formatTanggalSedang } from '@/utils/time';

const SPECIES_OPTIONS = (Object.keys(SPECIES_LABEL) as Species[]).map((value) => ({
  value,
  label: SPECIES_LABEL[value],
}));

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'jantan', label: 'Jantan' },
  { value: 'betina', label: 'Betina' },
];

/** Batas atas berat supaya salah ketik (misalnya 2500 kg) ketahuan. */
const MAX_WEIGHT_KG = 2000;

const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

/** Hasil form yang sudah lolos pengecekan. */
export type AnimalFormValues = {
  /** Alamat foto: bisa foto lama, foto sementara dari kamera/galeri, atau null kalau dihapus. */
  photoUri: string | null;
  species: Species;
  code: string;
  nickname?: string;
  sex: Sex;
  entryDate: Date;
  weightKg: number;
  targetKg?: number;
};

export type AnimalFormInitial = {
  photoUri: string | null;
  species: Species | null;
  code: string;
  nickname: string;
  sex: Sex | null;
  entryDate: Date;
  weightText: string;
  targetText: string;
};

type Props = {
  mode: 'tambah' | 'edit';
  initial?: AnimalFormInitial;
  /** Ternak lain, untuk cek kode kembar. Saat edit, ternak yang sedang diedit tidak ikut. */
  otherAnimals: Animal[];
  /** Tanggal masuk paling lambat (saat edit: tidak boleh setelah timbangan pertama). */
  maxEntryDate?: Date;
  entryDateHint?: string;
  weightLabel: string;
  weightHint: string;
  onSubmit: (values: AnimalFormValues) => Promise<void>;
};

const EMPTY: AnimalFormInitial = {
  photoUri: null,
  species: null,
  code: '',
  nickname: '',
  sex: null,
  entryDate: new Date(),
  weightText: '',
  targetText: '',
};

/**
 * Form data ternak, dipakai bersama oleh halaman Tambah dan Edit.
 * Form mengurus isian dan pengecekannya, halaman yang memakai form mengurus penyimpanan.
 */
export function AnimalForm({
  mode,
  initial = EMPTY,
  otherAnimals,
  maxEntryDate,
  entryDateHint,
  weightLabel,
  weightHint,
  onSubmit,
}: Props) {
  const [photoUri, setPhotoUri] = useState(initial.photoUri);
  const [species, setSpecies] = useState(initial.species);
  const [code, setCode] = useState(initial.code);
  // Saat edit, kode tidak diganti otomatis walau jenis ternak diubah.
  const [codeEdited, setCodeEdited] = useState(mode === 'edit');
  const [nickname, setNickname] = useState(initial.nickname);
  const [sex, setSex] = useState(initial.sex);
  const [entryDate, setEntryDate] = useState(initial.entryDate);
  const [weightText, setWeightText] = useState(initial.weightText);
  const [targetText, setTargetText] = useState(initial.targetText);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingCodes = useMemo(() => otherAnimals.map((a) => a.code), [otherAnimals]);

  // Kode diusulkan otomatis dari jenis ternak, selama belum diubah manual.
  const onSpeciesChange = (value: Species) => {
    setSpecies(value);
    if (!codeEdited) setCode(suggestCode(value, existingCodes));
  };

  const weightKg = parseDecimal(weightText);
  const targetKg = targetText.trim() ? parseDecimal(targetText) : undefined;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!species) e.species = 'Pilih jenis ternak.';
    const trimmed = code.trim();
    if (!trimmed) e.code = 'Isi kode ternak, misalnya D-10.';
    else if (trimmed.length > 12) e.code = 'Kode maksimal 12 karakter.';
    else {
      const owner = otherAnimals.find((a) => a.code.toLowerCase() === trimmed.toLowerCase());
      if (owner) e.code = `Kode ${owner.code} sudah dipakai ${owner.nickname ?? 'ternak lain'}.`;
    }
    if (!sex) e.sex = 'Pilih jenis kelamin.';
    if (maxEntryDate && entryDate > endOfDay(maxEntryDate)) {
      e.entryDate = `Paling lambat ${formatTanggalSedang(maxEntryDate)}, karena ada timbangan di tanggal itu.`;
    }
    if (!weightText.trim()) e.weight = 'Isi berat dalam kg, misalnya 18,5.';
    else if (Number.isNaN(weightKg)) e.weight = 'Format berat salah. Pakai angka, misalnya 18,5.';
    else if (weightKg <= 0) e.weight = 'Berat harus lebih dari 0.';
    else if (weightKg > MAX_WEIGHT_KG) e.weight = `Berat di atas ${MAX_WEIGHT_KG} kg, cek lagi angkanya.`;
    if (targetKg !== undefined) {
      if (Number.isNaN(targetKg)) e.target = 'Format target salah. Pakai angka, misalnya 35.';
      else if (targetKg > MAX_WEIGHT_KG) e.target = `Target di atas ${MAX_WEIGHT_KG} kg, cek lagi angkanya.`;
      else if (!Number.isNaN(weightKg) && targetKg <= weightKg)
        e.target = `Target harus lebih besar dari berat awal (${weightText.trim()} kg).`;
    }
    return e;
  }, [species, code, sex, entryDate, maxEntryDate, weightText, weightKg, targetKg, otherAnimals]);

  const show = (key: string) => (submitted ? errors[key] : undefined);

  const save = async () => {
    if (saving) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || !species || !sex) return;

    // Ternak besar dengan berat awal sangat kecil kemungkinan besar salah ketik.
    if ((species === 'sapi' || species === 'kerbau') && weightKg < 20) {
      const ok = await confirmAsync(
        'Berat kecil sekali',
        `${SPECIES_LABEL[species]} dengan berat ${weightText} kg? Kalau sudah benar, lanjut simpan.`,
        'Simpan',
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      await onSubmit({
        photoUri,
        species,
        code: code.trim().toUpperCase(),
        nickname: nickname.trim() || undefined,
        sex,
        entryDate,
        weightKg,
        targetKg,
      });
    } catch (error) {
      setSaving(false);
      notify('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    }
  };

  const today = new Date();
  const calendarMax = maxEntryDate && maxEntryDate < today ? maxEntryDate : today;

  return (
    <FormScreen
      footer={
        <BigActionButton
          label={saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan perubahan' : 'Simpan'}
          icon={Check}
          onPress={save}
        />
      }>
      <PhotoPicker uri={photoUri} onChange={setPhotoUri} />

      <FormField label="Jenis ternak" required error={show('species')}>
        <ChoiceChips options={SPECIES_OPTIONS} value={species} onChange={onSpeciesChange} />
      </FormField>

      <FormField
        label="Kode"
        required
        error={show('code')}
        hint={
          mode === 'edit'
            ? 'Riwayat timbangan tetap ikut walau kode diganti.'
            : 'Diisi otomatis dari jenis ternak. Boleh diganti, misalnya sesuai ear tag.'
        }>
        <TextField
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setCodeEdited(true);
          }}
          placeholder="D-10"
          autoCapitalize="characters"
          autoCorrect={false}
          invalid={!!show('code')}
        />
      </FormField>

      <FormField label="Nama panggilan" hint="Opsional, misalnya Si Belang.">
        <TextField value={nickname} onChangeText={setNickname} placeholder="Si Belang" maxLength={30} />
      </FormField>

      <FormField label="Jenis kelamin" required error={show('sex')}>
        <ChoiceChips options={SEX_OPTIONS} value={sex} onChange={setSex} equalWidth />
      </FormField>

      <FormField
        label="Tanggal masuk kandang"
        required
        error={show('entryDate')}
        hint={entryDateHint}>
        <DateField
          value={entryDate}
          onChange={setEntryDate}
          maximumDate={calendarMax}
          invalid={!!show('entryDate')}
        />
      </FormField>

      <FormField label={weightLabel} required error={show('weight')} hint={weightHint}>
        <TextField
          value={weightText}
          onChangeText={setWeightText}
          placeholder="18,5"
          keyboardType="decimal-pad"
          suffix="kg"
          invalid={!!show('weight')}
        />
      </FormField>

      <FormField
        label="Target berat"
        error={show('target')}
        hint="Opsional, misalnya berat siap jual. Dipakai untuk perkiraan tanggal tercapai.">
        <TextField
          value={targetText}
          onChangeText={setTargetText}
          placeholder="35"
          keyboardType="decimal-pad"
          suffix="kg"
          invalid={!!show('target')}
        />
      </FormField>
    </FormScreen>
  );
}
