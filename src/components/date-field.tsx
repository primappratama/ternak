import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar } from '@/constants/icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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

/**
 * Isian tanggal. Ada tombol cepat "Hari ini" dan "Kemarin",
 * dan kalender bawaan HP untuk tanggal lain.
 */
export function DateField({ value, onChange, minimumDate, maximumDate = new Date(), invalid }: Props) {
  const [showIos, setShowIos] = useState(false);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  const openCalendar = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setShowIos((v) => !v);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.quickRow}>
        <QuickChip label="Hari ini" active={sameDay(value, today)} onPress={() => onChange(today)} />
        <QuickChip
          label="Kemarin"
          active={sameDay(value, yesterday)}
          onPress={() => onChange(yesterday)}
        />
      </View>
      <Pressable
        onPress={openCalendar}
        accessibilityRole="button"
        accessibilityLabel="Pilih tanggal"
        style={[styles.box, invalid && styles.invalid]}>
        <Calendar size={18} color={Colors.textSecondary} />
        <Text style={styles.value}>{formatTanggalSedang(value)}</Text>
        <Text style={styles.change}>Ganti</Text>
      </Pressable>
      {Platform.OS === 'ios' && showIos ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="inline"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(_, date) => {
            if (date) onChange(date);
          }}
        />
      ) : null}
    </View>
  );
}

function QuickChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  invalid: {
    borderColor: Colors.danger,
  },
  value: {
    flex: 1,
    fontSize: FontSize.body,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  change: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.accent,
  },
});
