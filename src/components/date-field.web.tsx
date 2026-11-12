import { Calendar } from '@/constants/icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import { formatTanggalSedang } from '@/utils/time';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  invalid?: boolean;
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Versi browser (pratinjau): hanya tombol cepat Hari ini / Kemarin, tanpa kalender HP. */
export function DateField({ value, onChange, invalid }: Props) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  return (
    <View style={styles.wrap}>
      <View style={styles.quickRow}>
        {[
          { label: 'Hari ini', date: today },
          { label: 'Kemarin', date: yesterday },
        ].map((q) => {
          const active = sameDay(value, q.date);
          return (
            <Pressable
              key={q.label}
              onPress={() => onChange(q.date)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{q.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.box, invalid && styles.invalid]}>
        <Calendar size={18} color={Colors.textSecondary} />
        <Text style={styles.value}>{formatTanggalSedang(value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
  },
  chipActive: { backgroundColor: Colors.accentSoft },
  chipText: { fontSize: FontSize.footnote, fontFamily: Fonts.medium, color: Colors.textSecondary },
  chipTextActive: { fontFamily: Fonts.semibold, color: Colors.primary },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
  },
  invalid: { borderColor: Colors.danger },
  value: { flex: 1, fontSize: FontSize.body, fontFamily: Fonts.medium, color: Colors.text },
});
