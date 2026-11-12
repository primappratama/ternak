import { Image } from 'expo-image';
import { Camera, ImagePlus } from '@/constants/icons';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import { pickPhoto } from '@/utils/photos';

type Props = {
  uri: string | null;
  onChange: (uri: string | null) => void;
};

/** Kotak foto di form. Ketuk untuk ambil dari kamera atau galeri. */
export function PhotoPicker({ uri, onChange }: Props) {
  const choose = async (source: 'camera' | 'library') => {
    const picked = await pickPhoto(source);
    if (picked) onChange(picked);
  };

  const open = () => {
    if (Platform.OS === 'web') {
      choose('library');
      return;
    }
    Alert.alert('Foto ternak', 'Ambil foto dari mana?', [
      { text: 'Kamera', onPress: () => choose('camera') },
      { text: 'Galeri', onPress: () => choose('library') },
      ...(uri ? [{ text: 'Hapus foto', style: 'destructive' as const, onPress: () => onChange(null) }] : []),
      { text: 'Batal', style: 'cancel' as const },
    ]);
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Ganti foto ternak' : 'Tambah foto ternak'}
      style={({ pressed }) => [styles.box, pressed && styles.pressed]}>
      {uri ? (
        <>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.badge}>
            <Camera size={14} color={Colors.onPrimary} />
            <Text style={styles.badgeText}>Ganti</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.iconWrap}>
            <ImagePlus size={26} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>Tambah foto</Text>
          <Text style={styles.sub}>Opsional, dari kamera atau galeri</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  sub: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  badge: {
    position: 'absolute',
    bottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(22, 61, 34, 0.85)',
  },
  badgeText: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.semibold,
    color: Colors.onPrimary,
  },
});
