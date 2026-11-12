import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, CircleCheck, Target } from '@/constants/icons';
import { Colors, Fonts, FontSize, Motion, Radius, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatAdg, formatKg } from '@/utils/growth';
import type { TargetEstimate } from '@/utils/target';
import { formatTanggalSedang } from '@/utils/time';

import { Card } from './card';

type Props = {
  /** Kosong berarti ternak ini belum punya target. */
  estimate?: TargetEstimate;
  latestKg?: number;
  /** Buka form edit untuk mengatur atau mengubah target. */
  onEdit: () => void;
};

/**
 * Kartu target berat di halaman Detail: progres dari berat awal ke target,
 * sisa berat, dan perkiraan tanggal tercapai.
 */
export function TargetCard({ estimate, latestKg, onEdit }: Props) {
  if (!estimate) {
    return (
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel="Atur target berat"
        style={({ pressed }) => [styles.empty, pressed && styles.emptyPressed]}>
        <View style={styles.iconWrap}>
          <Target size={18} color={Colors.accent} />
        </View>
        <View style={styles.emptyText}>
          <Text style={styles.emptyTitle}>Atur target berat</Text>
          <Text style={styles.emptyBody}>Misalnya berat siap jual, biar kelihatan kapan kira-kira tercapai.</Text>
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </Pressable>
    );
  }

  const reached = estimate.kind === 'tercapai';

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          {reached ? (
            <CircleCheck size={18} color={Colors.accent} />
          ) : (
            <Target size={18} color={Colors.accent} />
          )}
        </View>
        <Text style={styles.label}>Target berat</Text>
        <Text style={styles.target}>{formatKg(estimate.targetKg)}</Text>
        <Pressable onPress={onEdit} hitSlop={10} accessibilityRole="button" accessibilityLabel="Ubah target berat">
          <Text style={styles.edit}>Ubah</Text>
        </Pressable>
      </View>

      <ProgressBar progress={estimate.progress} />

      <View style={styles.scale}>
        <Text style={styles.scaleText}>
          {latestKg !== undefined ? `${formatKg(latestKg)} sekarang` : ''}
        </Text>
        <Text style={[styles.scaleText, styles.scaleStrong]}>
          {reached ? 'Tercapai' : `kurang ${formatKg(estimate.remainingKg)}`}
        </Text>
      </View>

      <View style={styles.divider} />
      <Estimate estimate={estimate} />
    </Card>
  );
}

function Estimate({ estimate }: { estimate: TargetEstimate }) {
  switch (estimate.kind) {
    case 'tercapai':
      return (
        <Text style={styles.body}>
          Tercapai sejak <Text style={styles.strong}>{formatTanggalSedang(estimate.reachedOn)}</Text>.
        </Text>
      );
    case 'perkiraan':
      if (estimate.overdue) {
        return (
          <Text style={styles.body}>
            Harusnya sudah tercapai sekitar{' '}
            <Text style={styles.strong}>{formatTanggalSedang(estimate.etaDate)}</Text>. Timbang lagi untuk
            memastikan.
          </Text>
        );
      }
      return (
        <View style={styles.etaWrap}>
          <Text style={styles.etaLabel}>Perkiraan tercapai</Text>
          <Text style={styles.etaDate}>{formatTanggalSedang(estimate.etaDate)}</Text>
          <Text style={styles.note}>
            {estimate.daysLeft === 0 ? 'Hari ini' : `Sekitar ${estimate.daysLeft} hari lagi`}, dari rata-rata{' '}
            {formatAdg(estimate.adgKg)}. Bisa berubah tiap kali timbang.
          </Text>
        </View>
      );
    case 'kurangData':
      return (
        <Text style={styles.body}>
          Perkiraan tanggal muncul setelah ada 2 timbangan yang berjarak minimal 1 hari.
        </Text>
      );
    case 'tidakNaik':
      return (
        <Text style={styles.body}>
          Berat belum naik sejak timbangan pertama ({formatAdg(estimate.adgKg)}), jadi tanggalnya belum bisa
          diperkirakan.
        </Text>
      );
    case 'terlaluLama':
      return (
        <Text style={styles.body}>
          Dengan laju sekarang ({formatAdg(estimate.adgKg)}) butuh lebih dari 2 tahun. Cek lagi targetnya atau
          pakannya.
        </Text>
      );
  }
}

function ProgressBar({ progress }: { progress: number }) {
  const reduced = useReducedMotion();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      anim.setValue(progress);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: progress,
      duration: Motion.count,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, progress, reduced]);

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <Animated.View
        style={[
          styles.fill,
          { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    flex: 1,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  target: {
    fontSize: FontSize.headline,
    fontFamily: Fonts.bold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  edit: {
    marginLeft: Spacing.sm,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.accent,
  },
  track: {
    height: 10,
    marginTop: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: FontSize.micro,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  scaleStrong: {
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginVertical: Spacing.xs,
  },
  etaWrap: {
    gap: 2,
  },
  etaLabel: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  etaDate: {
    fontSize: FontSize.title,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  note: {
    marginTop: 2,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.regular,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  strong: {
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.separator,
  },
  emptyPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  emptyText: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    fontSize: FontSize.body,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  emptyBody: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});
