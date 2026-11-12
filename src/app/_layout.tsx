// Impor per ketebalan supaya cuma 5 file font yang ikut ke app, bukan semua varian Inter.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, Fonts, FontSize } from '@/constants/theme';
import { LivestockProvider, useLivestockStore } from '@/data/livestock-store';

// Splash tetap tampil sampai font Inter dan database siap, supaya layar nggak kosong atau "loncat".
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <LivestockProvider>
      <AppShell />
    </LivestockProvider>
  );
}

/**
 * Navigasi utama: Stack di luar, 4 tab (Beranda, Ternak, Aktivitas, Laporan) di dalam grup (tabs).
 * Halaman detail dan form dibuka di atas tab.
 */
function AppShell() {
  const { ready: dataReady } = useLivestockStore();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const fontsDone = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontsDone && dataReady) SplashScreen.hideAsync();
  }, [fontsDone, dataReady]);

  if (!fontsDone || !dataReady) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          headerTintColor: Colors.text,
          headerTitleStyle: { fontSize: FontSize.headline, fontFamily: Fonts.bold, color: Colors.text },
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ternak/[id]/index" options={{ title: 'Detail ternak' }} />
        <Stack.Screen name="ternak/[id]/pertumbuhan" options={{ title: 'Pertumbuhan berat' }} />
        <Stack.Screen name="ternak/[id]/edit" options={{ title: 'Ubah data ternak' }} />
        <Stack.Screen name="tambah" options={{ title: 'Tambah ternak' }} />
        <Stack.Screen name="timbang" options={{ title: 'Catat berat' }} />
        <Stack.Screen name="pakan" options={{ title: 'Log pakan' }} />
        <Stack.Screen name="kesehatan" options={{ title: 'Kesehatan' }} />
        <Stack.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
      </Stack>
    </>
  );
}
