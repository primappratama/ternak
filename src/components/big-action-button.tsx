import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ButtonHeight, Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  icon?: LucideIcon;
  /** primary = hijau penuh (aksi utama), secondary = putih. */
  variant?: 'primary' | 'secondary';
  /** Tombol pudar dan tidak bisa ditekan, misalnya saat belum ada perubahan. */
  disabled?: boolean;
  onPress: () => void;
};

/** Tombol utama selebar layar, misalnya "Simpan" atau "Export ke PDF". */
export function BigActionButton({ label, icon: Icon, variant = 'primary', disabled = false, onPress }: Props) {
  const isPrimary = variant === 'primary';
  const fg = isPrimary ? Colors.onPrimary : Colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        isPrimary
          ? { backgroundColor: pressed ? Colors.primaryPressed : Colors.primary }
          : { backgroundColor: pressed ? Colors.surfaceMuted : Colors.surface },
      ]}>
      {Icon ? <Icon size={20} color={fg} strokeWidth={2} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: ButtonHeight,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
  },
  disabled: {
    opacity: 0.4,
  },
});
