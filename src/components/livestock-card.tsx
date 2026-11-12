import { ChevronRight } from '@/constants/icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Shadow, Spacing } from '@/constants/theme';
import type { AnimalWithGrowth } from '@/hooks/use-livestock';
import { formatKg, SPECIES_LABEL } from '@/utils/growth';
import { dayDiff } from '@/utils/time';

import { AnimalAvatar } from './animal-avatar';
import { StatusBadge } from './status-badge';

type Props = {
  animal: AnimalWithGrowth;
  now: Date;
  onPress?: () => void;
};

/** Kartu satu ekor ternak: foto, nama, jenis, berat terakhir, dan status. */
export function LivestockCard({ animal, now, onPress }: Props) {
  const { growth } = animal;
  const title = animal.nickname ? `${animal.nickname}` : animal.code;
  const sex = animal.sex === 'jantan' ? 'Jantan' : 'Betina';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${SPECIES_LABEL[animal.species]} ${title}, kode ${animal.code}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <AnimalAvatar animal={animal} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {title}
          <Text style={styles.code}>  {animal.code}</Text>
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {SPECIES_LABEL[animal.species]} · {sex} · {dayDiff(animal.entryDate, now)} hari
        </Text>
        <View style={styles.bottom}>
          <Text style={styles.weight}>
            {growth.latestWeightKg !== undefined ? formatKg(growth.latestWeightKg) : '-'}
          </Text>
          <StatusBadge status={growth.status} />
        </View>
      </View>

      <ChevronRight size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow,
  },
  pressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  code: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  meta: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  weight: {
    fontSize: FontSize.body,
    fontFamily: Fonts.bold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
});
