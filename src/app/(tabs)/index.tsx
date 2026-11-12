import { useRouter } from 'expo-router';
import { HeartPulse, Plus, Scale, Settings, Wheat } from '@/constants/icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedNumber } from '@/components/animated-number';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { LivestockCard } from '@/components/livestock-card';
import { Logo } from '@/components/logo';
import { QuickAction } from '@/components/quick-action';
import { ScheduleList } from '@/components/schedule-list';
import {
  Colors,
  Fonts,
  FontSize,
  LetterSpacing,
  Motion,
  Radius,
  Shadow,
  Spacing,
} from '@/constants/theme';
import { useLivestockStore } from '@/data/livestock-store';
import { useLivestock } from '@/hooks/use-livestock';
import { dueLabel, SCHEDULE_WINDOW_DAYS } from '@/utils/records';
import { formatTanggalPanjang } from '@/utils/time';

export default function BerandaScreen() {
  const router = useRouter();
  const { now, stats, needsAttention, schedules } = useLivestock();
  // Jadwal yang sudah lewat atau jatuh tempo dalam 14 hari.
  const dueSoon = schedules.filter((sch) => dueLabel(sch.nextDate, now).days <= SCHEDULE_WINDOW_DAYS);
  const { settings } = useLivestockStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={1}>
              Halo, {settings.ownerName}
            </Text>
            <Text style={styles.farm} numberOfLines={1}>
              {settings.farmName} · {formatTanggalPanjang(now)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/pengaturan')}
            accessibilityRole="button"
            accessibilityLabel="Pengaturan"
            hitSlop={6}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
            <Settings size={22} color={Colors.primary} />
          </Pressable>
        </FadeInView>

        <FadeInView delay={Motion.stagger}>
          <Pressable
            onPress={() => router.push('/ternak')}
            accessibilityRole="button"
            accessibilityLabel={`Total ternak ${stats.total}`}
            style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
            <View style={styles.heroDecor}>
              <Logo width={230} color="#2A5A37" />
            </View>
            <Text style={styles.heroLabel}>Total ternak</Text>
            <AnimatedNumber value={stats.total} style={styles.heroValue} />
            <View style={styles.heroRow}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>+{stats.masukBulanIni} masuk bulan ini</Text>
              </View>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{stats.ditimbangMingguIni} ditimbang 7 hari</Text>
              </View>
            </View>
          </Pressable>
        </FadeInView>

        <FadeInView delay={Motion.stagger * 2} style={styles.grid}>
          <View style={styles.gridRow}>
            <QuickAction label="Catat berat" icon={Scale} onPress={() => router.push('/timbang')} />
            <QuickAction label="Pakan" icon={Wheat} onPress={() => router.push('/pakan')} />
          </View>
          <View style={styles.gridRow}>
            <QuickAction
              label="Kesehatan"
              icon={HeartPulse}
              onPress={() => router.push('/kesehatan')}
            />
            <QuickAction label="Tambah ternak" icon={Plus} onPress={() => router.push('/tambah')} />
          </View>
        </FadeInView>

        {dueSoon.length > 0 ? (
          <FadeInView delay={Motion.stagger * 3} style={styles.scheduleWrap}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Jadwal kesehatan</Text>
              <Text style={styles.sectionCount}>{dueSoon.length} jadwal</Text>
            </View>
            <ScheduleList
              schedules={dueSoon}
              now={now}
              onPress={(sch) => router.push({ pathname: '/kesehatan', params: { followUp: sch.record.id } })}
            />
          </FadeInView>
        ) : null}

        <FadeInView delay={Motion.stagger * 3} style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Perlu perhatian</Text>
          <Text style={styles.sectionCount}>{stats.perluPerhatian} ekor</Text>
        </FadeInView>

        {stats.total === 0 ? (
          <EmptyState
            title="Belum ada ternak"
            message="Mulai dengan tombol Tambah ternak di atas. Berat awalnya jadi titik pertama grafik."
          />
        ) : needsAttention.length === 0 ? (
          <EmptyState
            title="Semua ternak aman"
            message="Nggak ada ternak yang beratnya turun, melambat, atau telat ditimbang."
          />
        ) : (
          <View style={styles.list}>
            {needsAttention.map((animal, i) => (
              <FadeInView key={animal.id} delay={Motion.stagger * (4 + i)}>
                <LivestockCard
                  animal={animal}
                  now={now}
                  onPress={() =>
                    router.push({ pathname: '/ternak/[id]', params: { id: animal.id } })
                  }
                />
              </FadeInView>
            ))}
          </View>
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
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    ...Shadow,
  },
  greeting: {
    fontSize: FontSize.largeTitle,
    fontFamily: Fonts.extrabold,
    letterSpacing: LetterSpacing.largeTitle,
    color: Colors.text,
  },
  farm: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  hero: {
    overflow: 'hidden',
    padding: Spacing.xl,
    borderRadius: Radius.lg + 4,
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  heroDecor: {
    position: 'absolute',
    right: -40,
    bottom: -18,
    opacity: 0.6,
  },
  heroLabel: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: '#CFE5CC',
  },
  heroValue: {
    fontSize: FontSize.hero + 8,
    fontFamily: Fonts.extrabold,
    letterSpacing: LetterSpacing.hero,
    color: Colors.onPrimary,
    fontVariant: ['tabular-nums'],
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  heroChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  heroChipText: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.semibold,
    color: Colors.onPrimary,
  },
  grid: {
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: -Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.headline,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  sectionCount: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.warning,
  },
  list: {
    gap: Spacing.md,
  },
  scheduleWrap: {
    gap: Spacing.md,
  },
});
