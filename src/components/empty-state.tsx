import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.body,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.regular,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
