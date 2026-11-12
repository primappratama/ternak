import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarClock, ChevronRight } from '@/constants/icons';
import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Schedule } from '@/hooks/use-livestock';
import { animalsLabel, dueLabel, HEALTH_LABEL } from '@/utils/records';
import { formatTanggalPendek } from '@/utils/time';

import { Card } from './card';
import { DueBadge } from './due-badge';

type Props = {
  schedules: Schedule[];
  now: Date;
  /** Buka form Kesehatan untuk mengerjakan jadwal ini. */
  onPress: (schedule: Schedule) => void;
  /** Sebut ternaknya (Beranda). Di halaman satu ekor tidak perlu. */
  showAnimals?: boolean;
};

/** Daftar jadwal kesehatan berikutnya, misalnya obat cacing ulang. */
export function ScheduleList({ schedules, now, onPress, showAnimals = true }: Props) {
  return (
    <Card flush>
      {schedules.map((s, i) => {
        const title = `${HEALTH_LABEL[s.record.kind]}${s.record.title ? ` · ${s.record.title}` : ''}`;
        const meta = `${showAnimals ? `${animalsLabel(s.animals)} · ` : ''}${formatTanggalPendek(new Date(s.nextDate))}`;
        return (
          <Pressable
            key={s.record.id}
            onPress={() => onPress(s)}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${meta}`}
            style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}>
            <View style={styles.iconWrap}>
              <CalendarClock size={18} color={Colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            </View>
            <DueBadge due={dueLabel(s.nextDate, now)} />
            <ChevronRight size={18} color={Colors.textMuted} />
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  pressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  meta: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});
