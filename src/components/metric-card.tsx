import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';

import { Card } from './card';

type Props = {
  label: string;
  icon?: LucideIcon;
  /** Angka utama. Bisa teks biasa atau AnimatedNumber. */
  children: ReactNode;
  /** Keterangan kecil di bawah angka, misalnya perubahan berat. */
  footnote?: string;
  footnoteTone?: 'up' | 'down' | 'neutral';
};

/** Kartu angka kecil: ikon, label, angka, keterangan. */
export function MetricCard({ label, icon: Icon, children, footnote, footnoteTone = 'neutral' }: Props) {
  const toneColor =
    footnoteTone === 'up' ? Colors.accent : footnoteTone === 'down' ? Colors.danger : Colors.textSecondary;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        {Icon ? (
          <View style={styles.iconWrap}>
            <Icon size={16} color={Colors.accent} strokeWidth={2} />
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
      {footnote ? <Text style={[styles.footnote, { color: toneColor }]}>{footnote}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: Spacing.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
  },
  label: {
    flexShrink: 1,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  footnote: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.semibold,
  },
});
