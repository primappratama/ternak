import { Plus } from '@/constants/icons';
import { Pressable, StyleSheet } from 'react-native';

import { Colors, Shadow } from '@/constants/theme';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
};

/** Tombol bulat mengambang di pojok kanan bawah. */
export function Fab({ onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: pressed ? Colors.primaryPressed : Colors.primary },
      ]}>
      <Plus size={26} color={Colors.onPrimary} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow,
  },
});
