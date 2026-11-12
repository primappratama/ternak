import { NativeTabs } from 'expo-router/native-tabs';

import { Colors, Fonts } from '@/constants/theme';

/** Tab bawah: tab aktif berupa pil hijau tua dengan ikon putih (sesuai design system). */
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={Colors.surface}
      indicatorColor={Colors.primary}
      iconColor={{ default: Colors.textSecondary, selected: Colors.onPrimary }}
      labelStyle={{
        default: { color: Colors.textSecondary, fontFamily: Fonts.medium },
        selected: { color: Colors.primary, fontFamily: Fonts.semibold },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Beranda</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ternak">
        <NativeTabs.Trigger.Label>Ternak</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="pawprint" md="pets" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="aktivitas">
        <NativeTabs.Trigger.Label>Aktivitas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="laporan">
        <NativeTabs.Trigger.Label>Laporan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
