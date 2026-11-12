import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
};

/** Tombol pintasan berbentuk kotak dengan ikon, dipakai di grid beranda. */
export function QuickAction({ label, icon: Icon, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={Colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
  },
  label: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
});
