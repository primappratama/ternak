import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Check } from '@/constants/icons';
import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import type { Animal, Species } from '@/data/types';
import { SPECIES_LABEL } from '@/utils/growth';

import { AnimalAvatar } from './animal-avatar';

type Props = {
  animals: Animal[];
  selected: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
};

/**
 * Pilih beberapa ternak sekaligus. Ada pil cepat "Semua" dan per jenis (misalnya "Domba"),
 * lalu daftar ternak dengan centang untuk memilih satu per satu.
 */
export function AnimalMultiPicker({ animals, selected, onChange, invalid }: Props) {
  const chosen = useMemo(() => new Set(selected), [selected]);
  const sorted = useMemo(
    () => [...animals].sort((a, b) => a.code.localeCompare(b.code, 'id', { numeric: true })),
    [animals],
  );

  const groups = useMemo(() => {
    const bySpecies = new Map<Species, string[]>();
    sorted.forEach((a) => bySpecies.set(a.species, [...(bySpecies.get(a.species) ?? []), a.id]));
    const list = [{ key: 'semua', label: 'Semua', ids: sorted.map((a) => a.id) }];
    // Pil per jenis hanya berguna kalau ada lebih dari satu jenis.
    if (bySpecies.size > 1) {
      bySpecies.forEach((ids, species) => list.push({ key: species, label: SPECIES_LABEL[species], ids }));
    }
    return list;
  }, [sorted]);

  const toggleGroup = (ids: string[]) => {
    const allIn = ids.every((id) => chosen.has(id));
    const next = new Set(chosen);
    ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
    onChange(sorted.filter((a) => next.has(a.id)).map((a) => a.id));
  };

  const toggleOne = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(sorted.filter((a) => next.has(a.id)).map((a) => a.id));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {groups.map((g) => {
          const active = g.ids.length > 0 && g.ids.every((id) => chosen.has(id));
          return (
            <Pressable
              key={g.key}
              onPress={() => toggleGroup(g.ids)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {g.label} ({g.ids.length})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.list, invalid && styles.invalid]}>
        {sorted.map((animal, i) => {
          const on = chosen.has(animal.id);
          return (
            <Pressable
              key={animal.id}
              onPress={() => toggleOne(animal.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={animal.nickname ? `${animal.code} ${animal.nickname}` : animal.code}
              style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}>
              <View style={[styles.box, on && styles.boxOn]}>
                {on ? <Check size={16} color={Colors.onPrimary} strokeWidth={3} /> : null}
              </View>
              <AnimalAvatar animal={animal} size={36} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {animal.nickname ?? animal.code}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {SPECIES_LABEL[animal.species]} · {animal.code}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    fontFamily: Fonts.semibold,
    color: Colors.onPrimary,
  },
  list: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  invalid: {
    borderColor: Colors.danger,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  pressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  meta: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});
