import { Search } from '@/constants/icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Shadow, Spacing } from '@/constants/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/** Kolom cari. Teksnya disimpan di state halaman dan dikirim ke sini lewat props. */
export function SearchBar({ value, onChangeText, placeholder = 'Cari kode atau nama ternak' }: Props) {
  return (
    <View style={styles.box}>
      <Search size={18} color={Colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Cari ternak"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    ...Shadow,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FontSize.caption,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
});
