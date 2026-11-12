import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Bagi rata selebar baris, misalnya untuk Jantan / Betina. */
  equalWidth?: boolean;
};

/** Pilihan tunggal berbentuk tombol pil. Yang terpilih hijau tua. */
export function ChoiceChips<T extends string>({ options, value, onChange, equalWidth }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.chip, equalWidth && styles.equal, active && styles.active]}>
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
  },
  equal: {
    flex: 1,
  },
  active: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  labelActive: {
    color: Colors.onPrimary,
  },
});
