import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimalMultiPicker } from '@/components/animal-multi-picker';
import { BigActionButton } from '@/components/big-action-button';
import { DateField } from '@/components/date-field';
import { EmptyState } from '@/components/empty-state';
import { FormField, TextField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { Check } from '@/constants/icons';
import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import { useLivestockStore } from '@/data/livestock-store';
import { notify, successFeedback } from '@/utils/feedback';
import { newId, parseDecimal, toStoredDate } from '@/utils/form';
import { FEED_SUGGESTIONS, parseRupiah } from '@/utils/records';

/** Batas atas jumlah pakan sekali catat, supaya salah ketik (misalnya 30000) ketahuan. */
const MAX_FEED_KG = 10000;

/** Contoh: 2,5 kg per ekor, atau 25 g per ekor untuk ayam. */
function perHead(kg: number): string {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${(Math.round(kg * 10) / 10).toString().replace('.', ',')} kg`;
}

export default function PakanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { animals, feeds, addFeed } = useLivestockStore();

  // Kalau dibuka dari halaman Detail, ternak itu langsung tercentang.
  const [selected, setSelected] = useState<string[]>(() =>
    params.id && animals.some((a) => a.id === params.id) ? [params.id] : [],
  );
  const [feedType, setFeedType] = useState('');
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [costText, setCostText] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Jenis pakan yang pernah dipakai muncul duluan, lalu saran umum.
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    return [...feeds.map((f) => f.feedType), ...FEED_SUGGESTIONS]
      .filter((t) => {
        const key = t.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 9);
  }, [feeds]);

  const amountKg = parseDecimal(amountText);
  const costRp = parseRupiah(costText);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (selected.length === 0) e.animals = 'Pilih minimal satu ekor.';
    if (!feedType.trim()) e.feedType = 'Isi jenis pakan, misalnya Rumput gajah.';
    if (!amountText.trim()) e.amount = 'Isi jumlah pakan dalam kg.';
    else if (Number.isNaN(amountKg)) e.amount = 'Format salah. Pakai angka, misalnya 12,5.';
    else if (amountKg <= 0) e.amount = 'Jumlah harus lebih dari 0.';
    else if (amountKg > MAX_FEED_KG) e.amount = 'Di atas 10.000 kg, cek lagi angkanya.';
    if (costRp !== undefined && Number.isNaN(costRp)) e.cost = 'Tulis angka saja, misalnya 25000.';
    return e;
  }, [selected, feedType, amountText, amountKg, costRp]);

  const show = (key: string) => (submitted ? errors[key] : undefined);

  if (animals.length === 0) {
    return <EmptyState title="Belum ada ternak" message="Tambah ternak dulu, baru bisa mencatat pakan." />;
  }

  const save = async () => {
    if (saving) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      await addFeed({
        id: newId('f'),
        date: toStoredDate(date),
        feedType: feedType.trim(),
        amountKg,
        costRp,
        note: note.trim() || undefined,
        animalIds: selected,
      });
      successFeedback();
      router.back();
    } catch (error) {
      setSaving(false);
      notify('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    }
  };

  const amountHint =
    selected.length > 0 && amountKg > 0
      ? `Total untuk ${selected.length} ekor, sekitar ${perHead(amountKg / selected.length)} per ekor.`
      : 'Total untuk semua ekor yang dipilih.';

  return (
    <FormScreen
      footer={<BigActionButton label={saving ? 'Menyimpan...' : 'Simpan'} icon={Check} onPress={save} />}>
      <FormField
        label="Untuk ternak"
        required
        error={show('animals')}
        hint={selected.length > 0 ? `${selected.length} ekor dipilih.` : undefined}>
        <AnimalMultiPicker
          animals={animals}
          selected={selected}
          onChange={setSelected}
          invalid={!!show('animals')}
        />
      </FormField>

      <FormField label="Jenis pakan" required error={show('feedType')}>
        <TextField
          value={feedType}
          onChangeText={setFeedType}
          placeholder="Rumput gajah"
          maxLength={40}
          invalid={!!show('feedType')}
        />
        <View style={styles.suggestions}>
          {suggestions.map((s) => {
            const active = s.toLowerCase() === feedType.trim().toLowerCase();
            return (
              <Pressable
                key={s}
                onPress={() => setFeedType(s)}
                accessibilityRole="button"
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>

      <FormField label="Jumlah" required error={show('amount')} hint={amountHint}>
        <TextField
          value={amountText}
          onChangeText={setAmountText}
          placeholder="30"
          keyboardType="decimal-pad"
          suffix="kg"
          invalid={!!show('amount')}
        />
      </FormField>

      <FormField label="Tanggal" required>
        <DateField value={date} onChange={setDate} />
      </FormField>

      <FormField label="Biaya" error={show('cost')} hint="Opsional. Nanti dijumlahkan di laporan.">
        <TextField
          value={costText}
          onChangeText={setCostText}
          placeholder="25000"
          keyboardType="number-pad"
          suffix="Rp"
          invalid={!!show('cost')}
        />
      </FormField>

      <FormField label="Catatan" hint="Opsional, misalnya sisa pakan atau nafsu makan.">
        <TextField value={note} onChangeText={setNote} placeholder="Habis semua" maxLength={120} />
      </FormField>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
  },
  chipActive: {
    backgroundColor: Colors.accentSoft,
  },
  chipText: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: Fonts.semibold,
    color: Colors.primary,
  },
});
