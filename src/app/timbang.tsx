import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, CircleCheck, TrendingDown, TrendingUp } from '@/constants/icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimalAvatar } from '@/components/animal-avatar';
import { BigActionButton } from '@/components/big-action-button';
import { DateField } from '@/components/date-field';
import { FormField, TextField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { SearchBar } from '@/components/search-bar';
import { Colors, Fonts, FontSize, Radius, Shadow, Spacing } from '@/constants/theme';
import { type AnimalWithGrowth, useLivestock } from '@/hooks/use-livestock';
import { confirmAsync, notify, successFeedback } from '@/utils/feedback';
import { newId, parseDecimal, toStoredDate } from '@/utils/form';
import { formatAdg, formatGain, formatKg, SPECIES_LABEL } from '@/utils/growth';
import { formatRelatif } from '@/utils/time';

const MAX_WEIGHT_KG = 2000;
/** Perubahan berat di atas persentase ini dianggap janggal dan perlu dikonfirmasi. */
const SUSPICIOUS_CHANGE = 0.2;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function TimbangScreen() {
  const router = useRouter();
  // Kalau dibuka dari halaman detail, id ternak sudah dikirim lewat params.
  const params = useLocalSearchParams<{ id?: string }>();
  const { now, animals, getAnimal, addWeight } = useLivestock();

  const [animalId, setAnimalId] = useState<string | null>(params.id ?? null);
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [weightText, setWeightText] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const animal = getAnimal(animalId ?? undefined);
  const lastRecord = animal?.growth.records[animal.growth.records.length - 1];
  const weightKg = parseDecimal(weightText);
  const validWeight = !Number.isNaN(weightKg) && weightKg > 0 && weightKg <= MAX_WEIGHT_KG;

  // Pratinjau perubahan berat dibanding timbangan terakhir, dihitung langsung saat mengetik.
  const preview = useMemo(() => {
    if (!lastRecord || !validWeight) return null;
    const change = weightKg - lastRecord.weightKg;
    const days = (toDate(date).getTime() - new Date(lastRecord.date).getTime()) / DAY_MS;
    return {
      change,
      ratio: Math.abs(change) / lastRecord.weightKg,
      adg: days >= 1 ? change / days : undefined,
    };
  }, [lastRecord, validWeight, weightKg, date]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!animal) e.animal = 'Pilih ternak yang ditimbang.';
    if (!weightText.trim()) e.weight = 'Isi berat dalam kg, misalnya 25,6.';
    else if (Number.isNaN(weightKg)) e.weight = 'Format berat salah. Pakai angka, misalnya 25,6.';
    else if (weightKg <= 0) e.weight = 'Berat harus lebih dari 0.';
    else if (weightKg > MAX_WEIGHT_KG) e.weight = `Berat di atas ${MAX_WEIGHT_KG} kg, cek lagi angkanya.`;
    if (animal && toDate(date) < startOfDay(new Date(animal.entryDate))) {
      e.date = 'Tanggal timbang nggak boleh sebelum tanggal masuk kandang.';
    }
    return e;
  }, [animal, weightText, weightKg, date]);

  const show = (key: string) => (submitted ? errors[key] : undefined);

  const save = async () => {
    if (saving) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || !animal) return;

    if (preview && preview.ratio > SUSPICIOUS_CHANGE) {
      const ok = await confirmAsync(
        'Beda jauh dari timbangan terakhir',
        `${formatGain(preview.change)} (${Math.round(preview.ratio * 100)}%) dari ${formatKg(
          lastRecord!.weightKg,
        )}. Yakin angkanya sudah benar?`,
        'Simpan',
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      await addWeight({
        id: newId('w'),
        animalId: animal.id,
        date: toStoredDate(date),
        weightKg,
        note: note.trim() || undefined,
      });
      successFeedback();
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/ternak/[id]', params: { id: animal.id } });
    } catch (error) {
      setSaving(false);
      notify('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return animals;
    return animals.filter(
      (a) => a.code.toLowerCase().includes(q) || (a.nickname ?? '').toLowerCase().includes(q),
    );
  }, [animals, query]);

  return (
    <FormScreen
      footer={
        <BigActionButton label={saving ? 'Menyimpan...' : 'Simpan'} icon={Check} onPress={save} />
      }>
      <FormField label="Ternak" required error={show('animal')}>
        {animal ? (
          <View style={styles.selected}>
            <AnimalAvatar animal={animal} size={52} />
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{animal.nickname ?? animal.code}</Text>
              <Text style={styles.selectedMeta}>
                {SPECIES_LABEL[animal.species]} · {animal.code}
                {lastRecord
                  ? ` · terakhir ${formatKg(lastRecord.weightKg)}, ${formatRelatif(lastRecord.date, now)}`
                  : ''}
              </Text>
            </View>
            {!params.id ? (
              <Pressable onPress={() => setAnimalId(null)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.change}>Ganti</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.pickList}>
            <SearchBar value={query} onChangeText={setQuery} />
            {filtered.map((a) => (
              <PickRow key={a.id} animal={a} onPress={() => setAnimalId(a.id)} />
            ))}
            {filtered.length === 0 ? (
              <Text style={styles.selectedMeta}>Nggak ada ternak dengan kode atau nama itu.</Text>
            ) : null}
          </View>
        )}
      </FormField>

      {animal ? (
        <>
          <FormField label="Tanggal timbang" required error={show('date')}>
            <DateField
              value={date}
              onChange={setDate}
              minimumDate={startOfDay(new Date(animal.entryDate))}
              invalid={!!show('date')}
            />
          </FormField>

          <FormField label="Berat" required error={show('weight')}>
            <TextField
              value={weightText}
              onChangeText={setWeightText}
              placeholder={lastRecord ? String(lastRecord.weightKg).replace('.', ',') : '25,6'}
              keyboardType="decimal-pad"
              suffix="kg"
              autoFocus={!!params.id}
              invalid={!!show('weight')}
            />
          </FormField>

          {preview ? (
            <View style={[styles.preview, preview.change < 0 && styles.previewDown]}>
              {preview.change < 0 ? (
                <TrendingDown size={20} color={Colors.danger} />
              ) : (
                <TrendingUp size={20} color={Colors.accent} />
              )}
              <Text style={[styles.previewText, preview.change < 0 && styles.down]}>
                {formatGain(preview.change)} dari timbangan terakhir
                {preview.adg !== undefined ? ` · ${formatAdg(preview.adg)}` : ''}
              </Text>
            </View>
          ) : null}

          <FormField label="Catatan" hint="Opsional, misalnya kondisi saat ditimbang.">
            <TextField
              value={note}
              onChangeText={setNote}
              placeholder="Setelah makan pagi"
              multiline
              maxLength={200}
              style={styles.noteInput}
            />
          </FormField>
        </>
      ) : null}
    </FormScreen>
  );
}

/** Satu baris pilihan ternak di daftar pilih. */
function PickRow({ animal, onPress }: { animal: AnimalWithGrowth; onPress: () => void }) {
  const last = animal.growth.records[animal.growth.records.length - 1];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pickRow, pressed && styles.pressed]}>
      <AnimalAvatar animal={animal} size={44} />
      <View style={styles.selectedInfo}>
        <Text style={styles.pickName}>{animal.nickname ?? animal.code}</Text>
        <Text style={styles.selectedMeta}>
          {SPECIES_LABEL[animal.species]} · {animal.code}
          {last ? ` · ${formatKg(last.weightKg)}` : ''}
        </Text>
      </View>
      <CircleCheck size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** Tanggal dari kalender dianggap jam 12 siang, sama seperti saat disimpan. */
const toDate = (d: Date) => new Date(toStoredDate(d));

const styles = StyleSheet.create({
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    ...Shadow,
  },
  selectedInfo: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  selectedMeta: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  change: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.accent,
  },
  pickList: {
    gap: Spacing.sm,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  pickName: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    marginTop: -Spacing.sm,
  },
  previewDown: {
    backgroundColor: Colors.status.turun.bg,
  },
  previewText: {
    flex: 1,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.primary,
  },
  down: {
    color: Colors.danger,
  },
  noteInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
