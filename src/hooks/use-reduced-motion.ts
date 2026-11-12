import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * true kalau pengguna menyalakan "kurangi gerakan" di pengaturan HP.
 * Semua animasi di app ini dilewati kalau nilainya true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
