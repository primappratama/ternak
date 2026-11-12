import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /** Hilangkan padding bawaan, misalnya untuk daftar yang punya padding sendiri. */
  flush?: boolean;
}>;

/** Kartu putih dengan sudut membulat dan bayangan halus. Dasar hampir semua blok di app. */
export function Card({ style, flush = false, children }: Props) {
  return <View style={[styles.card, !flush && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow,
  },
  padded: {
    padding: Spacing.lg,
  },
});
