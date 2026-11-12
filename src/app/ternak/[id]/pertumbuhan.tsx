import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { TrendingDown, TrendingUp } from '@/constants/icons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedNumber } from '@/components/animated-number';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { GrowthChart } from '@/components/growth-chart';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { Colors, Fonts, FontSize, Motion, Radius, Spacing } from '@/constants/theme';
import { useLivestock } from '@/hooks/use-livestock';
import { computeGrowth, formatAdg, formatGain } from '@/utils/growth';

type RangeKey = '1b' | '3b' | '6b' | '1t';

const RANGES: { key: RangeKey; label: string; days: number; text: string }[] = [
  { key: '1b', label: '1 bulan', days: 30, text: '1 bulan terakhir' },
  { key: '3b', label: '3 bulan', days: 90, text: '3 bulan terakhir' },
  { key: '6b', label: '6 bulan', days: 182, text: '6 bulan terakhir' },
  { key: '1t', label: '1 tahun', days: 365, text: '1 tahun terakhir' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const formatPercent = (n: number) => {
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${sign}${Math.abs(n).toFixed(1).replace('.', ',')}%`;
};

export default function PertumbuhanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { now, getAnimal } = useLivestock();
  // Rentang waktu yang dipilih disimpan di state, dikirim ke SegmentedTabs lewat props.
  const [range, setRange] = useState<RangeKey>('3b');
  const animal = getAnimal(id);

  const selected = RANGES.find((r) => r.key === range) ?? RANGES[1];

  // Hanya timbangan di dalam rentang yang dipilih, lalu dihitung ulang pertumbuhannya.
  const inRange = useMemo(() => {
    if (!animal) return null;
    const start = now.getTime() - selected.days * DAY_MS;
    const records = animal.growth.records.filter((r) => new Date(r.date).getTime() >= start);
    return computeGrowth(records, now);
  }, [animal, now, selected.days]);

  if (!animal || !inRange) {
    return <EmptyState title="Ternak tidak ditemukan" message="Data ternak ini mungkin sudah dihapus." />;
  }

  const enough = inRange.records.length >= 2;
  const percent =
    enough && inRange.firstWeightKg ? (inRange.totalGainKg / inRange.firstWeightKg) * 100 : 0;
  const isDown = inRange.totalGainKg < 0;
  const TrendIcon = isDown ? TrendingDown : TrendingUp;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `Pertumbuhan ${animal.nickname ?? animal.code}` }} />

      <FadeInView>
        <SegmentedTabs tabs={RANGES} active={range} onChange={setRange} variant="pill" />
      </FadeInView>

      {enough ? (
        <>
          <FadeInView delay={Motion.stagger}>
            <Card>
              <GrowthChart
                key={range}
                records={inRange.records}
                height={260}
                showAxis
                targetKg={animal.targetKg}
                color={isDown ? Colors.danger : Colors.chartLine}
              />
            </Card>
          </FadeInView>

          <FadeInView delay={Motion.stagger * 2}>
            <View style={[styles.summary, isDown && styles.summaryDown]}>
              <View style={[styles.summaryIcon, isDown && styles.summaryIconDown]}>
                <TrendIcon size={22} color={isDown ? Colors.danger : Colors.accent} strokeWidth={2} />
              </View>
              <View style={styles.summaryText}>
                <AnimatedNumber
                  key={range}
                  value={percent}
                  format={formatPercent}
                  style={[styles.summaryValue, isDown && styles.down]}
                />
                <Text style={styles.summaryLabel}>
                  Pertumbuhan {selected.text} · {inRange.records.length}x timbang
                </Text>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={Motion.stagger * 3} style={styles.row}>
            <Card style={styles.mini}>
              <Text style={styles.miniLabel}>Naik</Text>
              <Text style={[styles.miniValue, isDown && styles.down]}>
                {formatGain(inRange.totalGainKg)}
              </Text>
            </Card>
            <Card style={styles.mini}>
              <Text style={styles.miniLabel}>Rata-rata harian</Text>
              <Text style={[styles.miniValue, isDown && styles.down]}>
                {formatAdg(inRange.overallAdgKg)}
              </Text>
            </Card>
          </FadeInView>
        </>
      ) : (
        <EmptyState
          title="Belum cukup data"
          message={`Butuh minimal 2 kali timbang dalam ${selected.text}. Coba pilih rentang yang lebih panjang.`}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentSoft,
  },
  summaryDown: {
    backgroundColor: Colors.status.turun.bg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  summaryIconDown: {
    backgroundColor: Colors.surface,
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: FontSize.title + 4,
    fontFamily: Fonts.extrabold,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  down: {
    color: Colors.danger,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mini: {
    flex: 1,
    padding: Spacing.md,
    gap: 2,
  },
  miniLabel: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  miniValue: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
});
