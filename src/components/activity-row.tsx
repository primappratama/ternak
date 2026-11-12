import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeartPulse, Scale, Wheat } from '@/constants/icons';
import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Activity } from '@/hooks/use-livestock';
import { formatKg } from '@/utils/growth';
import { animalsLabel, dueLabel, formatRupiah, HEALTH_LABEL } from '@/utils/records';
import { formatRelatif, formatTanggalPendek } from '@/utils/time';

import { DueBadge } from './due-badge';

type Props = {
  activity: Activity;
  now: Date;
  /** true di daftar Aktivitas (sebut ternaknya), false di tab Catatan satu ekor. */
  showAnimals?: boolean;
  divider?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

const ICONS = { timbang: Scale, pakan: Wheat, kesehatan: HeartPulse } as const;

/** Satu baris catatan: timbang, pakan, atau kesehatan. Dipakai di Aktivitas dan tab Catatan. */
export function ActivityRow({ activity: a, now, showAnimals = true, divider, onPress, onLongPress }: Props) {
  const Icon = ICONS[a.kind];
  const who = animalsLabel(a.animals);

  let title: string;
  let value: string | undefined;
  let note: string | undefined;
  if (a.kind === 'timbang') {
    title = `Timbang · ${formatKg(a.weightKg)}`;
  } else if (a.kind === 'pakan') {
    title = `${a.record.feedType} · ${formatKg(a.record.amountKg)}`;
    value = a.record.costRp !== undefined ? formatRupiah(a.record.costRp) : undefined;
    note = a.record.note;
  } else {
    title = `${HEALTH_LABEL[a.record.kind]}${a.record.title ? ` · ${a.record.title}` : ''}`;
    value = a.record.costRp !== undefined ? formatRupiah(a.record.costRp) : undefined;
    note = a.record.note;
  }

  // Di daftar satu ekor, catatan kelompok tetap diberi tahu dipakai bareng berapa ekor.
  const whoText = showAnimals
    ? `${who} · `
    : a.kind !== 'timbang' && a.animals.length > 1
      ? `Bersama ${a.animals.length - 1} ekor lain · `
      : '';
  const meta = `${whoText}${formatTanggalPendek(new Date(a.date))}, ${formatRelatif(a.date, now)}`;
  const next = a.kind === 'kesehatan' ? a.record.nextDate : undefined;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      disabled={!onPress && !onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onLongPress ? 'Tekan lama untuk menghapus' : undefined}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={Colors.accent} strokeWidth={2} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={2}>
            {note}
          </Text>
        ) : null}
        {next && a.kind === 'kesehatan' ? (
          <View style={styles.nextRow}>
            {a.record.nextDone ? (
              <Text style={styles.nextDone}>Jadwal {formatTanggalPendek(new Date(next))} selesai</Text>
            ) : (
              <>
                <Text style={styles.nextLabel}>Berikutnya {formatTanggalPendek(new Date(next))}</Text>
                <DueBadge due={dueLabel(next, now)} />
              </>
            )}
          </View>
        ) : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  note: {
    marginTop: 2,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.text,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  nextLabel: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  nextDone: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  value: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.bold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
});
