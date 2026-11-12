import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimalMultiPicker } from '@/components/animal-multi-picker';
import { BigActionButton } from '@/components/big-action-button';
import { ChoiceChips } from '@/components/choice-chips';
import { DateField } from '@/components/date-field';
import { EmptyState } from '@/components/empty-state';
import { FormField, TextField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { CalendarClock, Check } from '@/constants/icons';
import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import { useLivestockStore } from '@/data/livestock-store';
import type { HealthKind } from '@/data/types';
import { confirmAsync, notify, successFeedback } from '@/utils/feedback';
import { newId, toStoredDate } from '@/utils/form';
import { animalsLabel, HEALTH_LABEL, parseRupiah } from '@/utils/records';
import { formatTanggalSedang } from '@/utils/time';

const KIND_OPTIONS = (Object.keys(HEALTH_LABEL) as HealthKind[]).map((value) => ({
  value,
  label: HEALTH_LABEL[value],
}));

/** Label isian nama menyesuaikan jenis tindakan. */
const TITLE_LABEL: Record<HealthKind, { label: string; placeholder: string }> = {
  vaksin: { label: 'Nama vaksin', placeholder: 'Vaksin PMK' },
  obatCacing: { label: 'Nama obat', placeholder: 'Albendazole' },
  vitamin: { label: 'Nama vitamin', placeholder: 'Vitamin B kompleks' },
  pengobatan: { label: 'Keluhan / penyakit', placeholder: 'Diare' },
  pemeriksaan: { label: 'Hasil pemeriksaan', placeholder: 'Sehat, nafsu makan baik' },
  lainnya: { label: 'Keterangan', placeholder: 'Potong kuku' },
};

type NextKey = 'none' | '2m' | '1b' | '3b' | '6b';

const NEXT_OPTIONS: { value: NextKey; label: string }[] = [
  { value: 'none', label: 'Tidak ada' },
  { value: '2m', label: '2 minggu' },
  { value: '1b', label: '1 bulan' },
  { value: '3b', label: '3 bulan' },
  { value: '6b', label: '6 bulan' },
];

/** Tanggal jadwal berikutnya, dihitung dari tanggal tindakan. */
function nextFrom(date: Date, key: NextKey): Date | undefined {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  if (key === 'none') return undefined;
  if (key === '2m') d.setDate(d.getDate() + 14);
  if (key === '1b') d.setMonth(d.getMonth() + 1);
  if (key === '3b') d.setMonth(d.getMonth() + 3);
  if (key === '6b') d.setMonth(d.getMonth() + 6);
  return d;
}

export default function KesehatanScreen() {
  const router = useRouter();
  // id: ternak dari halaman Detail. followUp: catatan lama yang jadwalnya sedang dikerjakan.
  const params = useLocalSearchParams<{ id?: string; followUp?: string }>();
  const { animals, health, addHealth, markHealthNextDone } = useLivestockStore();
  const followUp = health.find((h) => h.id === params.followUp && !h.nextDone);
  const existingIds = new Set(animals.map((a) => a.id));

  const [selected, setSelected] = useState<string[]>(() => {
    if (followUp) return followUp.animalIds.filter((id) => existingIds.has(id));
    return params.id && existingIds.has(params.id) ? [params.id] : [];
  });
  const [kind, setKind] = useState<HealthKind | null>(followUp?.kind ?? null);
  const [title, setTitle] = useState(followUp?.title ?? '');
  const [date, setDate] = useState(() => new Date());
  const [next, setNext] = useState<NextKey>('none');
  const [costText, setCostText] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const costRp = parseRupiah(costText);
  const nextDate = nextFrom(date, next);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (selected.length === 0) e.animals = 'Pilih minimal satu ekor.';
    if (!kind) e.kind = 'Pilih jenis tindakan.';
    if (costRp !== undefined && Number.isNaN(costRp)) e.cost = 'Tulis angka saja, misalnya 25000.';
    return e;
  }, [selected, kind, costRp]);

  const show = (key: string) => (submitted ? errors[key] : undefined);

  if (animals.length === 0) {
    return (
      <EmptyState title="Belum ada ternak" message="Tambah ternak dulu, baru bisa mencatat kesehatan." />
    );
  }

  const save = async () => {
    if (saving) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || !kind) return;
    setSaving(true);
    try {
      await addHealth({
        id: newId('h'),
        date: toStoredDate(date),
        kind,
        title: title.trim() || undefined,
        costRp,
        note: note.trim() || undefined,
        animalIds: selected,
        nextDate: nextDate?.toISOString(),
      });
      // Jadwal lama dianggap selesai karena tindakannya baru saja dicatat.
      if (followUp) await markHealthNextDone(followUp.id);
      successFeedback();
      router.back();
    } catch (error) {
      setSaving(false);
      notify('Gagal menyimpan', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    }
  };

  const skipSchedule = async () => {
    if (!followUp) return;
    const ok = await confirmAsync(
      'Lewati jadwal ini?',
      'Jadwal hilang dari Beranda tanpa mencatat tindakan baru. Catatan lamanya tetap ada.',
      'Lewati',
    );
    if (!ok) return;
    await markHealthNextDone(followUp.id);
    router.back();
  };

  const titleCopy = TITLE_LABEL[kind ?? 'lainnya'];
  const followAnimals = followUp ? animals.filter((a) => followUp.animalIds.includes(a.id)) : [];

  return (
    <FormScreen
      footer={<BigActionButton label={saving ? 'Menyimpan...' : 'Simpan'} icon={Check} onPress={save} />}>
      {followUp && followUp.nextDate ? (
        <View style={styles.banner}>
          <CalendarClock size={20} color={Colors.primary} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              Jadwal {HEALTH_LABEL[followUp.kind].toLowerCase()}
              {followUp.title ? ` (${followUp.title})` : ''}
            </Text>
            <Text style={styles.bannerBody}>
              {formatTanggalSedang(new Date(followUp.nextDate))} untuk {animalsLabel(followAnimals)}. Simpan
              catatan ini untuk menandai jadwalnya selesai.
            </Text>
            <Pressable onPress={skipSchedule} hitSlop={8} accessibilityRole="button">
              <Text style={styles.bannerLink}>Lewati jadwal tanpa mencatat</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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

      <FormField label="Jenis tindakan" required error={show('kind')}>
        <ChoiceChips options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </FormField>

      <FormField label={titleCopy.label} hint="Opsional.">
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder={titleCopy.placeholder}
          maxLength={60}
        />
      </FormField>

      <FormField label="Tanggal" required>
        <DateField value={date} onChange={setDate} />
      </FormField>

      <FormField
        label="Jadwal berikutnya"
        hint={
          nextDate
            ? `Muncul di Beranda menjelang ${formatTanggalSedang(nextDate)}.`
            : 'Misalnya obat cacing diulang 3 bulan lagi.'
        }>
        <ChoiceChips options={NEXT_OPTIONS} value={next} onChange={setNext} />
      </FormField>

      <FormField label="Biaya" error={show('cost')} hint="Opsional. Nanti dijumlahkan di laporan.">
        <TextField
          value={costText}
          onChangeText={setCostText}
          placeholder="20000"
          keyboardType="number-pad"
          suffix="Rp"
          invalid={!!show('cost')}
        />
      </FormField>

      <FormField label="Catatan" hint="Opsional, misalnya dosis atau gejala.">
        <TextField value={note} onChangeText={setNote} placeholder="2 ml per ekor" maxLength={160} />
      </FormField>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentSoft,
  },
  bannerText: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontSize: FontSize.body,
    fontFamily: Fonts.semibold,
    color: Colors.primary,
  },
  bannerBody: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  bannerLink: {
    marginTop: 2,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.accent,
  },
});
