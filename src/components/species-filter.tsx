import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Species } from '@/data/types';
import { SPECIES_LABEL } from '@/utils/growth';

type Props = {
  /** Jenis yang ada di kandang beserta jumlah ekornya. */
  options: { species: Species; count: number }[];
  total: number;
  /** null berarti "Semua". */
  selected: Species | null;
  onChange: (value: Species | null) => void;
};

/** Pil filter jenis ternak dengan jumlah ekor. Pilihan aktif dikirim lewat props dari halaman. */
export function SpeciesFilter({ options, total, selected, onChange }: Props) {
  const items = [{ species: null as Species | null, count: total }, ...options];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map(({ species, count }) => {
        const active = species === selected;
        return (
          <Pressable
            key={species ?? 'semua'}
            onPress={() => onChange(species)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {species ? SPECIES_LABEL[species] : 'Semua'} ({count})
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.onPrimary,
  },
});
