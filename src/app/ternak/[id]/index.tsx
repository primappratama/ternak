import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import {
  Activity,
  Calendar,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Pencil,
  Scale,
  Share2,
  Trash2,
  TrendingUp,
  Wheat,
} from '@/constants/icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityRow } from '@/components/activity-row';
import { AnimalHero } from '@/components/animal-hero';
import { AnimatedNumber } from '@/components/animated-number';
import { BigActionButton } from '@/components/big-action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { MetricCard } from '@/components/metric-card';
import { ScheduleList } from '@/components/schedule-list';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { TargetCard } from '@/components/target-card';
import { Colors, Fonts, FontSize, Motion, Radius, Spacing } from '@/constants/theme';
import { useLivestockStore } from '@/data/livestock-store';
import { useLivestock } from '@/hooks/use-livestock';
import { useRemoveRecord } from '@/hooks/use-remove-record';
import { confirmAsync, notify, successFeedback } from '@/utils/feedback';
import { formatAdg, formatGain, formatKg } from '@/utils/growth';
import { photoDataUri, sharePdf } from '@/utils/pdf';
import { deletePhoto } from '@/utils/photos';
import { animalCardHtml } from '@/utils/report-html';
import { estimateTarget } from '@/utils/target';
import { dayDiff, formatTanggalPendek, formatTanggalSedang } from '@/utils/time';

type TabKey = 'ringkasan' | 'riwayat' | 'catatan';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'catatan', label: 'Catatan' },
];

export default function DetailTernakScreen() {
  const router = useRouter();
  // Id ternak dikirim dari halaman sebelumnya lewat params navigasi.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { now, getAnimal, deleteAnimal, deleteWeight, schedules, notesFor } = useLivestock();
  const removeRecord = useRemoveRecord();
  const [tab, setTab] = useState<TabKey>('ringkasan');
  const [sharing, setSharing] = useState(false);
  const { animals, feeds, health, settings } = useLivestockStore();
  const animal = getAnimal(id);

  if (!animal) {
    return <EmptyState title="Ternak tidak ditemukan" message="Data ternak ini mungkin sudah dihapus." />;
  }

  const { growth } = animal;
  const isDown = growth.status === 'turun';
  const history = [...growth.records].reverse();
  const lastChange = history.length >= 2 ? history[0].weightKg - history[1].weightKg : undefined;
  const notes = notesFor(animal.id);
  const animalSchedules = schedules.filter((sch) => sch.record.animalIds.includes(animal.id));

  const removeAnimal = async () => {
    const ok = await confirmAsync(
      `Hapus ${animal.nickname ?? animal.code}?`,
      'Data ternak, semua timbangan, catatan pakan/kesehatannya, dan fotonya akan dihapus permanen. Catatan kelompok tetap ada untuk ekor lain.',
      'Hapus',
      true,
    );
    if (!ok) return;
    try {
      await deleteAnimal(animal.id);
      deletePhoto(animal.photoUri);
      successFeedback();
      router.back();
    } catch (error) {
      notify('Gagal menghapus', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    }
  };

  // Kartu ternak (PDF) untuk dikirim, misalnya ke calon pembeli.
  const shareCard = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const photo = await photoDataUri(animal.photoUri);
      const html = animalCardHtml(animal, settings, feeds, health, animals, photo, now);
      const shared = await sharePdf(html, `kartu-${animal.code.toLowerCase()}.pdf`);
      if (!shared) notify('Nggak bisa dibagikan', 'HP ini tidak punya menu bagikan file.');
    } catch (error) {
      notify('Gagal membuat PDF', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    } finally {
      setSharing(false);
    }
  };

  const removeWeight = async (recordId: string, label: string) => {
    if (growth.records.length <= 1) {
      notify('Nggak bisa dihapus', 'Ini satu-satunya timbangan. Catat timbangan baru dulu, baru hapus yang ini.');
      return;
    }
    const ok = await confirmAsync('Hapus timbangan?', `Timbangan ${label} akan dihapus.`, 'Hapus', true);
    if (!ok) return;
    await deleteWeight(recordId);
    successFeedback();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: animal.code,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={shareCard}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Kirim kartu ${animal.code} (PDF)`}>
                <Share2 size={20} color={Colors.text} />
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/ternak/[id]/edit', params: { id: animal.id } })}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Ubah data ${animal.code}`}>
                <Pencil size={20} color={Colors.text} />
              </Pressable>
              <Pressable
                onPress={removeAnimal}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Hapus ${animal.code}`}>
                <Trash2 size={20} color={Colors.danger} />
              </Pressable>
            </View>
          ),
        }}
      />

      <FadeInView>
        <AnimalHero animal={animal} daysInPen={dayDiff(animal.entryDate, now)} />
      </FadeInView>

      <FadeInView delay={Motion.stagger}>
        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />
      </FadeInView>

      {tab === 'ringkasan' ? (
        <>
          <FadeInView delay={Motion.stagger * 2} style={styles.row}>
            <MetricCard
              label="Berat terakhir"
              icon={Scale}
              footnote={lastChange !== undefined ? `${formatGain(lastChange)} dari sebelumnya` : undefined}
              footnoteTone={lastChange === undefined ? 'neutral' : lastChange < 0 ? 'down' : 'up'}>
              <AnimatedNumber
                value={growth.latestWeightKg ?? 0}
                format={formatKg}
                style={styles.metricValue}
              />
            </MetricCard>
            <MetricCard
              label="Berat awal"
              icon={Calendar}
              footnote={
                growth.records[0]
                  ? `ditimbang ${formatTanggalPendek(new Date(growth.records[0].date))}`
                  : undefined
              }>
              <AnimatedNumber
                value={growth.firstWeightKg ?? 0}
                format={formatKg}
                style={styles.metricValue}
              />
            </MetricCard>
          </FadeInView>

          <FadeInView delay={Motion.stagger * 3} style={styles.row}>
            <MetricCard
              label="Rata-rata harian"
              icon={TrendingUp}
              footnote={growth.overallAdgKg === undefined ? 'butuh jarak timbang 1 hari' : undefined}>
              {growth.overallAdgKg !== undefined ? (
                <AnimatedNumber
                  value={growth.overallAdgKg}
                  format={formatAdg}
                  style={styles.metricValue}
                />
              ) : (
                <Text style={[styles.metricValue, styles.muted]}>-</Text>
              )}
            </MetricCard>
            <MetricCard
              label="Harian terakhir"
              icon={Activity}
              footnote={growth.lastAdgKg === undefined ? 'butuh jarak timbang 1 hari' : undefined}>
              {growth.lastAdgKg !== undefined ? (
                <AnimatedNumber
                  value={growth.lastAdgKg}
                  format={formatAdg}
                  style={[styles.metricValue, isDown && styles.down]}
                />
              ) : (
                <Text style={[styles.metricValue, styles.muted]}>-</Text>
              )}
            </MetricCard>
          </FadeInView>

          <FadeInView delay={Motion.stagger * 4}>
            <TargetCard
              estimate={
                animal.targetKg !== undefined ? estimateTarget(growth, animal.targetKg, now) : undefined
              }
              latestKg={growth.latestWeightKg}
              onEdit={() => router.push({ pathname: '/ternak/[id]/edit', params: { id: animal.id } })}
            />
          </FadeInView>

          <FadeInView delay={Motion.stagger * 5} style={styles.actions}>
            <BigActionButton
              label="Catat berat"
              icon={Scale}
              variant="secondary"
              onPress={() => router.push({ pathname: '/timbang', params: { id: animal.id } })}
            />
            <Pressable
              onPress={() =>
                router.push({ pathname: '/ternak/[id]/pertumbuhan', params: { id: animal.id } })
              }
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.growthButton,
                { backgroundColor: pressed ? Colors.primaryPressed : Colors.primary },
              ]}>
              <TrendingUp size={20} color={Colors.onPrimary} strokeWidth={2} />
              <Text style={styles.growthButtonText}>Lihat pertumbuhan</Text>
              <ChevronRight size={20} color={Colors.onPrimary} />
            </Pressable>
          </FadeInView>
        </>
      ) : null}

      {tab === 'riwayat' ? (
        <FadeInView style={styles.historyWrap}>
          <Text style={styles.historyHint}>Tekan lama satu baris untuk menghapus timbangan.</Text>
          <Card flush>
            {history.map((record, i) => {
              const older = history[i + 1];
              const change = older ? record.weightKg - older.weightKg : undefined;
              const label = `${formatKg(record.weightKg)} tanggal ${formatTanggalSedang(new Date(record.date))}`;
              return (
                <Pressable
                  key={record.id}
                  onLongPress={() => removeWeight(record.id, label)}
                  delayLongPress={400}
                  accessibilityHint="Tekan lama untuk menghapus"
                  style={({ pressed }) => [
                    styles.historyRow,
                    i > 0 && styles.divider,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatTanggalSedang(new Date(record.date))}</Text>
                    {record.note ? <Text style={styles.historyNote}>{record.note}</Text> : null}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyWeight}>{formatKg(record.weightKg)}</Text>
                    <Text
                      style={[styles.historyChange, change !== undefined && change < 0 && styles.down]}>
                      {change !== undefined ? formatGain(change) : 'awal'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </FadeInView>
      ) : null}

      {tab === 'catatan' ? (
        <FadeInView style={styles.notesWrap}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <BigActionButton
                label="Pakan"
                icon={Wheat}
                variant="secondary"
                onPress={() => router.push({ pathname: '/pakan', params: { id: animal.id } })}
              />
            </View>
            <View style={styles.flex}>
              <BigActionButton
                label="Kesehatan"
                icon={HeartPulse}
                variant="secondary"
                onPress={() => router.push({ pathname: '/kesehatan', params: { id: animal.id } })}
              />
            </View>
          </View>

          {animalSchedules.length > 0 ? (
            <>
              <Text style={styles.notesHeading}>Jadwal berikutnya</Text>
              <ScheduleList
                schedules={animalSchedules}
                now={now}
                showAnimals={false}
                onPress={(sch) =>
                  router.push({ pathname: '/kesehatan', params: { followUp: sch.record.id } })
                }
              />
            </>
          ) : null}

          <Text style={styles.notesHeading}>Riwayat pakan dan kesehatan</Text>
          {notes.length === 0 ? (
            <Card style={styles.notes}>
              <ClipboardList size={28} color={Colors.accent} strokeWidth={1.8} />
              <Text style={styles.notesTitle}>Belum ada catatan</Text>
              <Text style={styles.notesText}>
                Catat pemberian pakan, vaksin, obat cacing, atau pengobatan lewat tombol di atas.
              </Text>
            </Card>
          ) : (
            <>
              <Card flush>
                {notes.map((a, i) => (
                  <ActivityRow
                    key={`${a.kind}-${a.id}`}
                    activity={a}
                    now={now}
                    showAnimals={false}
                    divider={i > 0}
                    onLongPress={() => removeRecord(a)}
                  />
                ))}
              </Card>
              <Text style={styles.historyHint}>Tekan lama satu catatan untuk menghapus.</Text>
            </>
          )}
        </FadeInView>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  notesWrap: {
    gap: Spacing.md,
  },
  notesHeading: {
    marginTop: Spacing.sm,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricValue: {
    fontSize: FontSize.title,
    fontFamily: Fonts.extrabold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  down: {
    color: Colors.danger,
  },
  muted: {
    color: Colors.textMuted,
  },
  growthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 56,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  growthButtonText: {
    flex: 1,
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.onPrimary,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  historyWrap: {
    gap: Spacing.sm,
  },
  historyHint: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  historyLeft: {
    flex: 1,
    gap: 2,
  },
  historyNote: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.6,
  },
  actions: {
    gap: Spacing.md,
  },
  historyDate: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyWeight: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  historyChange: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.semibold,
    color: Colors.accent,
  },
  notes: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  notesTitle: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  notesText: {
    fontSize: FontSize.caption,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
