import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { FadeInView } from '@/components/fade-in-view';
import { LivestockCard } from '@/components/livestock-card';
import { SearchBar } from '@/components/search-bar';
import { SpeciesFilter } from '@/components/species-filter';
import { Colors, Fonts, FontSize, LetterSpacing, Motion, Spacing } from '@/constants/theme';
import type { Species } from '@/data/types';
import { useLivestock } from '@/hooks/use-livestock';

export default function DaftarTernakScreen() {
  const router = useRouter();
  const { now, animals, speciesCounts } = useLivestock();

  // Kata kunci dan filter jenis disimpan di state halaman, dikirim ke komponen lewat props.
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return animals.filter(
      (a) =>
        (!species || a.species === species) &&
        (!q || a.code.toLowerCase().includes(q) || (a.nickname ?? '').toLowerCase().includes(q)),
    );
  }, [animals, query, species]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <Text style={styles.largeTitle}>Daftar ternak</Text>
        </FadeInView>

        <FadeInView delay={Motion.stagger} style={styles.controls}>
          <SearchBar value={query} onChangeText={setQuery} />
          <SpeciesFilter
            options={speciesCounts}
            total={animals.length}
            selected={species}
            onChange={setSpecies}
          />
        </FadeInView>

        {visible.length === 0 ? (
          <EmptyState
            title={query ? 'Nggak ketemu' : 'Belum ada ternak'}
            message={
              query
                ? `Nggak ada ternak dengan kode atau nama "${query}".`
                : 'Daftarkan ternak lewat tombol + di pojok kanan bawah.'
            }
          />
        ) : (
          <View style={styles.list}>
            {visible.map((animal, i) => (
              <FadeInView key={animal.id} delay={Motion.stagger * Math.min(i + 2, 10)}>
                <LivestockCard
                  animal={animal}
                  now={now}
                  onPress={() =>
                    router.push({ pathname: '/ternak/[id]', params: { id: animal.id } })
                  }
                />
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>

      <Fab accessibilityLabel="Tambah ternak" onPress={() => router.push('/tambah')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 3,
    gap: Spacing.lg,
  },
  largeTitle: {
    fontSize: FontSize.largeTitle,
    fontFamily: Fonts.extrabold,
    letterSpacing: LetterSpacing.largeTitle,
    color: Colors.text,
  },
  controls: {
    gap: Spacing.md,
  },
  list: {
    gap: Spacing.md,
  },
});
