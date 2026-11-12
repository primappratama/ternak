import { Image } from 'expo-image';
import { PawPrint } from '@/constants/icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, LetterSpacing, Radius, Spacing } from '@/constants/theme';
import type { AnimalWithGrowth } from '@/hooks/use-livestock';
import { SPECIES_LABEL } from '@/utils/growth';

import { StatusBadge } from './status-badge';

type Props = {
  animal: AnimalWithGrowth;
  daysInPen: number;
};

/**
 * Panel besar di atas halaman detail: foto ternak dengan nama di atasnya.
 * Kalau belum ada foto, pakai panel hijau tua dengan ikon, supaya tetap rapi.
 */
export function AnimalHero({ animal, daysInPen }: Props) {
  const title = animal.nickname ?? animal.code;

  return (
    <View style={styles.hero}>
      {animal.photoUri ? (
        <>
          <Image source={{ uri: animal.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.shade} />
        </>
      ) : (
        <PawPrint size={190} color="#2C5A36" strokeWidth={1} style={styles.decor} />
      )}

      <View style={styles.text}>
        <Text style={styles.code}>{animal.code}</Text>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.meta}>
          {SPECIES_LABEL[animal.species]} · {animal.sex === 'jantan' ? 'Jantan' : 'Betina'} ·{' '}
          {daysInPen} hari di kandang
        </Text>
        <View style={styles.badge}>
          <StatusBadge status={animal.growth.status} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 200,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: Radius.lg + 4,
    backgroundColor: Colors.primary,
  },
  shade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  decor: {
    position: 'absolute',
    right: -30,
    top: -20,
  },
  text: {
    padding: Spacing.xl,
    gap: 2,
  },
  code: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: '#BFD8BC',
  },
  name: {
    fontSize: FontSize.largeTitle,
    fontFamily: Fonts.extrabold,
    letterSpacing: LetterSpacing.largeTitle,
    color: Colors.onPrimary,
  },
  meta: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: '#DCE9DA',
  },
  badge: {
    marginTop: Spacing.sm,
  },
});
