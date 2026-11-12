import { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { Motion } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props = {
  value: number;
  /** Cara menampilkan angka, misalnya formatKg. Default: dibulatkan. */
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
};

/** Angka yang menghitung naik dari 0 ke nilainya saat pertama muncul. */
export function AnimatedNumber({ value, format, style, duration = Motion.count }: Props) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return <Text style={style}>{format ? format(display) : String(Math.round(display))}</Text>;
}
