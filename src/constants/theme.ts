import { Platform, type ViewStyle } from 'react-native';

/**
 * Design system TERNAK (dikunci, semua halaman mengikuti ini).
 *
 * Palet 4 warna:
 * - Hijau tua  #163D22: tombol utama, pil aktif, kartu hero, tab aktif
 * - Hijau      #3E7D3A: ikon, grafik, angka naik
 * - Hijau muda #E8F0E6: latar ikon dan pil
 * - Abu        #DDE1DB: garis dan pemisah
 * Font: Inter. Warna lain hanya untuk status.
 */

export const Colors = {
  background: '#F6F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1EC',
  text: '#16201A',
  textSecondary: '#5E6A61',
  textMuted: '#9AA39C',
  separator: '#DDE1DB',

  primary: '#163D22',
  primaryPressed: '#0E2A17',
  onPrimary: '#FFFFFF',

  accent: '#3E7D3A',
  accentSoft: '#E8F0E6',

  chartLine: '#3E7D3A',
  chartFill: 'rgba(62, 125, 58, 0.12)',
  chartGrid: '#EEF1ED',

  warning: '#B26A00',
  danger: '#C62828',

  /** Warna pil status pertumbuhan: teks dan latar. */
  status: {
    normal: { fg: '#3E7D3A', bg: '#E8F0E6' },
    melambat: { fg: '#A15C00', bg: '#FCEFD9' },
    turun: { fg: '#C62828', bg: '#FCE6E6' },
    belumDitimbang: { fg: '#5F6B62', bg: '#ECEFEB' },
  },
} as const;

/** Nama font Inter per ketebalan. Di Android, ketebalan dipilih lewat nama font, bukan fontWeight. */
export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const FontSize = {
  micro: 12,
  footnote: 13,
  caption: 15,
  body: 16,
  headline: 18,
  title: 22,
  largeTitle: 30,
  hero: 44,
} as const;

export const LetterSpacing = {
  largeTitle: -0.6,
  hero: -1.2,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Bayangan halus untuk kartu putih. */
export const Shadow: ViewStyle = Platform.select({
  android: { elevation: 2 },
  default: {
    shadowColor: '#1B3A1F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
}) as ViewStyle;

export const ButtonHeight = 54;

/** Durasi animasi (ms). */
export const Motion = {
  draw: 1200,
  count: 900,
  fadeIn: 420,
  stagger: 60,
} as const;
