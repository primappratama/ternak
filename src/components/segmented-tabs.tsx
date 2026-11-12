import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';

type Props<T extends string> = {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  /**
   * underline: tab dengan garis bawah (Ringkasan / Riwayat / Catatan).
   * pill: pil kecil, yang aktif hijau tua (3 bulan / 6 bulan / 1 tahun). Bisa digeser kalau tidak muat.
   *   Dipakai di halaman yang padding kirinya Spacing.xl.
   */
  variant?: 'underline' | 'pill';
};

/** Pilihan tab di dalam halaman. Tab aktif disimpan di state halaman dan dikirim lewat props. */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'underline',
}: Props<T>) {
  const isPill = variant === 'pill';
  const items = tabs.map((tab) => {
    const isActive = tab.key === active;
    return (
      <Pressable
        key={tab.key}
        onPress={() => onChange(tab.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        style={
          isPill
            ? [styles.pill, isActive && styles.pillActive]
            : [styles.underlineTab, isActive && styles.underlineTabActive]
        }>
        <Text
          style={[
            styles.label,
            isActive && (isPill ? styles.pillLabelActive : styles.underlineLabelActive),
          ]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  });

  if (isPill) {
    // Pil bisa digeser ke samping kalau tidak muat di layar sempit.
    // Margin negatif supaya pil bisa digeser sampai tepi layar, sejajar dengan padding halaman.
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillBar}>
        {items}
      </ScrollView>
    );
  }

  return <View style={styles.underlineBar}>{items}</View>;
}

const styles = StyleSheet.create({
  underlineBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  underlineTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -StyleSheet.hairlineWidth,
  },
  underlineTabActive: {
    borderBottomColor: Colors.primary,
  },
  underlineLabelActive: {
    color: Colors.primary,
    fontFamily: Fonts.semibold,
  },
  pillScroll: {
    flexGrow: 0,
    marginHorizontal: -Spacing.xl,
  },
  pillBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillLabelActive: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semibold,
  },
  label: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
});
