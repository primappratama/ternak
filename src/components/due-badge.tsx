import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius } from '@/constants/theme';
import type { DueTone } from '@/utils/records';

const TONE = {
  danger: Colors.status.turun,
  warning: Colors.status.melambat,
  neutral: Colors.status.belumDitimbang,
} as const;

/** Pil kecil jatuh tempo jadwal: merah kalau lewat, oranye kalau dekat. */
export function DueBadge({ due }: { due: { text: string; tone: DueTone } }) {
  const color = TONE[due.tone];
  return (
    <View style={[styles.pill, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.fg }]}>{due.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  text: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.semibold,
  },
});
