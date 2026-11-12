import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import type { GrowthStatus } from '@/data/types';
import { STATUS_LABEL } from '@/utils/growth';

type Props = {
  status: GrowthStatus;
};

/** Pil kecil status pertumbuhan: titik + teks, warna sesuai status. */
export function StatusBadge({ status }: Props) {
  const tone = Colors.status[status];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.label, { color: tone.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.semibold,
  },
});
