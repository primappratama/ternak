import { Image } from 'expo-image';
import { PawPrint } from '@/constants/icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius } from '@/constants/theme';
import type { Animal } from '@/data/types';

type Props = {
  animal: Pick<Animal, 'code' | 'photoUri'>;
  size?: number;
};

/**
 * Foto ternak. Kalau belum ada foto, tampil kotak hijau lembut berisi ikon dan kode,
 * supaya daftar tetap rapi walau peternak belum sempat memotret.
 */
export function AnimalAvatar({ animal, size = 56 }: Props) {
  if (animal.photoUri) {
    return (
      <Image
        source={{ uri: animal.photoUri }}
        style={[styles.box, { width: size, height: size }]}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.box, styles.fallback, { width: size, height: size }]}>
      <PawPrint size={size * 0.34} color={Colors.accent} strokeWidth={2} />
      <Text style={[styles.code, { fontSize: Math.max(10, size * 0.18) }]} numberOfLines={1}>
        {animal.code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.accentSoft,
  },
  code: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.bold,
    color: Colors.accent,
  },
});
