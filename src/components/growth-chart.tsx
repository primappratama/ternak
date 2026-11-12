import { useEffect, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Colors, Fonts, Motion } from '@/constants/theme';
import type { WeightRecord } from '@/data/types';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { polylineLength, toLinePath } from '@/utils/chart';
import { formatKg } from '@/utils/growth';
import { formatTanggalPendek } from '@/utils/time';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Sudah diurutkan dari timbangan paling lama ke paling baru. */
  records: WeightRecord[];
  height?: number;
  /** Warna garis, misalnya merah kalau berat turun. */
  color?: string;
  /**
   * true: tampilkan sumbu berat (kg) di kiri dan titik di tiap timbangan (halaman Pertumbuhan).
   * false: versi ringkas tanpa sumbu.
   */
  showAxis?: boolean;
  /** Target berat (kg). Digambar sebagai garis putus-putus, hanya di versi showAxis. */
  targetKg?: number;
};

const GRID_LINES = 4;

/**
 * Grafik pertumbuhan berat per ekor. Garisnya tergambar dari kiri ke kanan,
 * lalu area di bawahnya dan titik-titiknya muncul.
 */
export function GrowthChart({
  records,
  height = 220,
  color = Colors.chartLine,
  showAxis = false,
  targetKg,
}: Props) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [draw] = useState(() => new Animated.Value(0));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Label sumbu ditaruh di luar area grafik supaya nggak pernah menimpa garis.
  const pad = { top: 16, right: 10, bottom: 26, left: showAxis ? 52 : 8 };
  const ready = width > 0 && records.length >= 2;

  const times = records.map((r) => new Date(r.date).getTime());
  const weights = records.map((r) => r.weightKg);
  const showTarget = showAxis && targetKg !== undefined;
  // Target ikut menentukan batas atas/bawah supaya garisnya selalu kelihatan.
  const domain = showTarget && targetKg !== undefined ? [...weights, targetKg] : weights;
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const spread = Math.max(...domain) - Math.min(...domain) || 1;
  const wMin = Math.min(...domain) - spread * 0.2;
  const wMax = Math.max(...domain) + spread * 0.2;

  const plotW = Math.max(0, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const x = (t: number) => pad.left + ((t - tMin) / (tMax - tMin || 1)) * plotW;
  const y = (w: number) => pad.top + (1 - (w - wMin) / (wMax - wMin)) * plotH;

  const points = records.map((r, i) => ({ x: x(times[i]), y: y(r.weightKg) }));
  const length = polylineLength(points);

  useEffect(() => {
    if (!ready) return;
    if (reduced) {
      draw.setValue(1);
      return;
    }
    draw.setValue(0);
    const animation = Animated.timing(draw, {
      toValue: 1,
      duration: Motion.draw,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [draw, ready, length, reduced]);

  let content = null;
  if (ready) {
    const linePath = toLinePath(points);
    const baseY = pad.top + plotH;
    const areaPath = `${linePath} L ${x(tMax)} ${baseY} L ${x(tMin)} ${baseY} Z`;
    const targetY = showTarget && targetKg !== undefined ? y(targetKg) : undefined;
    // Garis bantu yang terlalu dekat dengan garis target dilewati supaya labelnya nggak dempet.
    const gridValues = Array.from(
      { length: GRID_LINES },
      (_, i) => wMin + ((wMax - wMin) * (i + 0.5)) / GRID_LINES,
    ).filter((v) => targetY === undefined || Math.abs(y(v) - targetY) > 18);
    const first = points[0];
    const last = points[points.length - 1];
    const fadeIn = draw.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0, 1] });

    content = (
      <Svg width={width} height={height}>
        {gridValues.map((v) => (
          <Line
            key={`g-${v}`}
            x1={pad.left}
            x2={width - pad.right}
            y1={y(v)}
            y2={y(v)}
            stroke={Colors.chartGrid}
            strokeWidth={1}
          />
        ))}
        {showAxis
          ? gridValues.map((v) => (
              <SvgText
                key={`gl-${v}`}
                x={pad.left - 8}
                y={y(v) + 4}
                fontSize={11}
                fontFamily={Fonts.medium}
                fill={Colors.textMuted}
                textAnchor="end">
                {formatKg(v)}
              </SvgText>
            ))
          : null}

        {targetY !== undefined && targetKg !== undefined ? (
          <>
            <Line
              x1={pad.left}
              x2={width - pad.right}
              y1={targetY}
              y2={targetY}
              stroke={Colors.primary}
              strokeWidth={1.5}
              strokeDasharray="6 5"
            />
            <SvgText
              x={width - pad.right}
              y={targetY - 6}
              fontSize={11}
              fontFamily={Fonts.semibold}
              fill={Colors.primary}
              textAnchor="end">
              {`Target ${formatKg(targetKg)}`}
            </SvgText>
          </>
        ) : null}

        <AnimatedPath
          d={areaPath}
          fill={Colors.chartFill}
          opacity={draw.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] })}
        />
        <AnimatedPath
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [length, 0] })}
        />
        {showAxis
          ? points.slice(0, -1).map((p, i) => (
              <AnimatedCircle
                key={records[i].id}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={Colors.surface}
                stroke={color}
                strokeWidth={2}
                opacity={fadeIn}
              />
            ))
          : null}
        <AnimatedCircle
          cx={last.x}
          cy={last.y}
          r={6}
          fill={color}
          stroke={Colors.surface}
          strokeWidth={3}
          opacity={fadeIn}
        />

        {!showAxis ? (
          <SvgText
            x={first.x + 2}
            y={Math.min(first.y + 20, baseY - 4)}
            fontSize={12}
            fontFamily={Fonts.semibold}
            fill={Colors.textSecondary}>
            {formatKg(records[0].weightKg)}
          </SvgText>
        ) : null}

        <SvgText
          x={pad.left}
          y={height - 6}
          fontSize={11}
          fontFamily={Fonts.medium}
          fill={Colors.textMuted}>
          {formatTanggalPendek(new Date(tMin))}
        </SvgText>
        <SvgText
          x={width - pad.right}
          y={height - 6}
          fontSize={11}
          fontFamily={Fonts.medium}
          fill={Colors.textMuted}
          textAnchor="end">
          {formatTanggalPendek(new Date(tMax))}
        </SvgText>
      </Svg>
    );
  }

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
