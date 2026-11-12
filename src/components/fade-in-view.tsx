import { type PropsWithChildren, useEffect, useState } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { Motion } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props = PropsWithChildren<{
  /** Jeda sebelum muncul (ms). Dipakai untuk efek muncul berurutan. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}>;

/** Membungkus elemen supaya muncul pelan dari bawah. */
export function FadeInView({ delay = 0, style, children }: Props) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Motion.fadeIn,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduced]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
