import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';

type Props = {
  icon: LucideIcon;
  title: string;
  message: string;
  /** Tahap pengerjaan, ditampilkan sebagai label kecil. */
  stage: string;
};

/** Isi sementara untuk halaman yang belum dibuat, supaya alurnya tetap bisa dicoba. */
export function ComingSoon({ icon: Icon, title, message, stage }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={32} color={Colors.accent} strokeWidth={1.8} />
      </View>
      <Text style={styles.stage}>{stage}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
    marginBottom: Spacing.sm,
  },
  stage: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FontSize.title,
    fontFamily: Fonts.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
