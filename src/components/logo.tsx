import Svg, { Path } from 'react-native-svg';

import { LOGO_PATHS, LOGO_RATIO, LOGO_VIEWBOX } from '@/constants/brand';
import { Colors } from '@/constants/theme';

type Props = {
  /** Lebar logo dalam piksel. Tinggi menyesuaikan perbandingan aslinya. */
  width?: number;
  color?: string;
};

/** Logo TERNAK (kepala ternak dari daun), digambar dari file SVG asli supaya tajam di semua ukuran. */
export function Logo({ width = 32, color = Colors.primary }: Props) {
  return (
    <Svg width={width} height={width * LOGO_RATIO} viewBox={LOGO_VIEWBOX} accessibilityLabel="Logo Ternak">
      {LOGO_PATHS.map((d) => (
        <Path key={d.slice(0, 12)} d={d} fill={color} stroke={color} strokeWidth={3} />
      ))}
    </Svg>
  );
}
