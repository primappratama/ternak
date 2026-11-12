import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityRow } from '@/components/activity-row';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { Colors, Fonts, FontSize, LetterSpacing, Motion, Spacing } from '@/constants/theme';
import { type Activity, useLivestock } from '@/hooks/use-livestock';
import { useRemoveRecord } from '@/hooks/use-remove-record';

type Filter = 'semua' | Activity['kind'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'timbang', label: 'Timbang' },
  { key: 'pakan', label: 'Pakan' },
  { key: 'kesehatan', label: 'Kesehatan' },
];

/** Batas baris yang ditampilkan supaya daftar tetap ringan walau catatannya sudah ratusan. */
const MAX_ROWS = 100;

export default function AktivitasScreen() {
  const router = useRouter();
  const { now, activities } = useLivestock();
  const removeRecord = useRemoveRecord();
  const [filter, setFilter] = useState<Filter>('semua');

  const shown = useMemo(
    () => (filter === 'semua' ? activities : activities.filter((a) => a.kind === filter)),
    [activities, filter],
  );

  const openAnimal = (a: Activity) => {
    if (a.animals.length !== 1) return;
    router.push({ pathname: '/ternak/[id]', params: { id: a.animals[0].id } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.largeTitle}>Aktivitas</Text>
          <Text style={styles.subtitle}>
            Timbang, pakan, dan kesehatan terbaru. Tekan lama catatan pakan atau kesehatan untuk menghapus.
          </Text>
        </FadeInView>

        <FadeInView delay={Motion.stagger}>
          <SegmentedTabs tabs={FILTERS} active={filter} onChange={setFilter} variant="pill" />
        </FadeInView>

        {shown.length === 0 ? (
          <EmptyState
            title="Belum ada catatan"
            message="Catatan timbang, pakan, dan kesehatan muncul di sini setelah disimpan."
          />
        ) : (
          <FadeInView delay={Motion.stagger * 2} key={filter}>
            <Card flush>
              {shown.slice(0, MAX_ROWS).map((a, i) => (
                <ActivityRow
                  key={`${a.kind}-${a.id}`}
                  activity={a}
                  now={now}
                  divider={i > 0}
                  onPress={a.animals.length === 1 ? () => openAnimal(a) : undefined}
                  onLongPress={a.kind !== 'timbang' ? () => removeRecord(a) : undefined}
                />
              ))}
            </Card>
            {shown.length > MAX_ROWS ? (
              <Text style={styles.more}>
                Menampilkan {MAX_ROWS} catatan terbaru dari {shown.length}.
              </Text>
            ) : null}
          </FadeInView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.lg,
  },
  largeTitle: {
    fontSize: FontSize.largeTitle,
    fontFamily: Fonts.extrabold,
    letterSpacing: LetterSpacing.largeTitle,
    color: Colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  more: {
    marginTop: Spacing.sm,
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
