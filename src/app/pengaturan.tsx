import Constants from 'expo-constants';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BigActionButton } from '@/components/big-action-button';
import { Card } from '@/components/card';
import { FormField, TextField } from '@/components/form-field';
import { Logo } from '@/components/logo';
import { Check, ChevronRight, Eraser, FileSpreadsheet, Trash2 } from '@/constants/icons';
import { Colors, Fonts, FontSize, Radius, Spacing } from '@/constants/theme';
import { useLivestockStore } from '@/data/livestock-store';
import { SAMPLE_ANIMAL_IDS } from '@/data/mock-data';
import { buildLivestockCsv, csvFileName } from '@/utils/csv';
import { shareCsv } from '@/utils/export';
import { confirmAsync, notify, successFeedback } from '@/utils/feedback';

const MAX_NAME = 30;
const MAX_FARM = 40;

export default function PengaturanScreen() {
  const { animals, weights, feeds, health, settings, updateSettings, clearSample, clearAll } =
    useLivestockStore();

  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [farmName, setFarmName] = useState(settings.farmName);
  const [busy, setBusy] = useState<null | 'nama' | 'export' | 'contoh' | 'semua'>(null);

  const samples = useMemo(() => animals.filter((a) => SAMPLE_ANIMAL_IDS.includes(a.id)), [animals]);
  const sampleWeights = useMemo(() => {
    const ids = new Set(samples.map((a) => a.id));
    return weights.filter((w) => ids.has(w.animalId)).length;
  }, [samples, weights]);

  const nameError = !ownerName.trim() ? 'Isi nama kamu, misalnya Pak Dedi.' : undefined;
  const farmError = !farmName.trim() ? 'Isi nama peternakan.' : undefined;
  const dirty = ownerName.trim() !== settings.ownerName || farmName.trim() !== settings.farmName;

  const run = async (key: NonNullable<typeof busy>, task: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await task();
    } catch (error) {
      notify('Gagal', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    } finally {
      setBusy(null);
    }
  };

  const saveNames = () =>
    run('nama', async () => {
      if (nameError || farmError) return;
      await updateSettings({ ownerName: ownerName.trim(), farmName: farmName.trim() });
      successFeedback();
    });

  const exportCsv = () =>
    run('export', async () => {
      if (animals.length === 0) {
        notify('Belum ada data', 'Tambah ternak dulu, baru bisa di-export.');
        return;
      }
      const shared = await shareCsv(csvFileName(), buildLivestockCsv(animals, weights));
      if (!shared) notify('Nggak bisa dibagikan', 'HP ini tidak punya menu bagikan file.');
    });

  const removeSamples = () =>
    run('contoh', async () => {
      const names = samples
        .slice(0, 3)
        .map((a) => (a.nickname ? `${a.code} ${a.nickname}` : a.code))
        .join(', ');
      const ok = await confirmAsync(
        `Hapus ${samples.length} ternak contoh?`,
        `${names}${samples.length > 3 ? ', dan lainnya' : ''} beserta ${sampleWeights} timbangan dan catatan pakan/kesehatannya akan dihapus permanen, termasuk yang kamu tambahkan sendiri ke ternak itu. Ternak buatanmu tetap aman.`,
        'Hapus',
        true,
      );
      if (!ok) return;
      await clearSample();
      successFeedback();
    });

  const removeAll = () =>
    run('semua', async () => {
      const ok = await confirmAsync(
        'Hapus semua data?',
        `${animals.length} ternak, ${weights.length} timbangan, ${feeds.length + health.length} catatan pakan/kesehatan, dan semua foto akan dihapus permanen dari HP ini. Ini tidak bisa dibatalkan. Kalau mau simpan salinan, export CSV dulu.`,
        'Hapus semua',
        true,
      );
      if (!ok) return;
      await clearAll();
      successFeedback();
    });

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Profil</Text>
      <Card style={styles.profile}>
        <FormField label="Nama kamu" error={nameError} hint={`Muncul di Beranda: "Halo, ${ownerName.trim() || '...'}".`}>
          <TextField
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Pak Dedi"
            maxLength={MAX_NAME}
            invalid={!!nameError}
          />
        </FormField>
        <FormField label="Nama peternakan" error={farmError}>
          <TextField
            value={farmName}
            onChangeText={setFarmName}
            placeholder="Peternakan Sejahtera"
            maxLength={MAX_FARM}
            invalid={!!farmError}
          />
        </FormField>
        <BigActionButton
          label={busy === 'nama' ? 'Menyimpan...' : dirty ? 'Simpan nama' : 'Tersimpan'}
          icon={Check}
          disabled={!dirty || !!nameError || !!farmError}
          onPress={saveNames}
        />
      </Card>

      <Text style={styles.sectionTitle}>Data</Text>
      <Card flush>
        <Row
          icon={FileSpreadsheet}
          title={busy === 'export' ? 'Menyiapkan file...' : 'Export data (CSV)'}
          subtitle={`${animals.length} ternak, ${weights.length} timbangan. Kirim ke WhatsApp, Drive, atau email, lalu buka di Excel atau Google Sheets.`}
          onPress={exportCsv}
        />
        {samples.length > 0 ? (
          <>
            <View style={styles.separator} />
            <Row
              icon={Eraser}
              title="Hapus data contoh"
              subtitle={`${samples.length} ternak contoh bawaan app (D-01 Si Belang dkk.). Ternak buatanmu tetap ada.`}
              onPress={removeSamples}
            />
          </>
        ) : null}
        <View style={styles.separator} />
        <Row
          icon={Trash2}
          title="Hapus semua data"
          subtitle="Semua ternak, timbangan, pakan, kesehatan, dan foto. Nama di Profil tetap."
          tone="danger"
          disabled={animals.length === 0}
          onPress={removeAll}
        />
      </Card>

      <Text style={styles.sectionTitle}>Tentang</Text>
      <Card style={styles.about}>
        <Logo width={56} />
        <View style={styles.aboutText}>
          <Text style={styles.appName}>TERNAK</Text>
          <Text style={styles.version}>Versi {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </Card>
      <Text style={styles.note}>
        Data tersimpan di HP ini saja dan tidak dikirim ke internet. Kalau aplikasi dihapus, datanya ikut
        hilang, jadi export CSV sesekali sebagai cadangan.
      </Text>
    </ScrollView>
  );
}

type RowProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  onPress: () => void;
};

function Row({ icon: Icon, title, subtitle, tone = 'default', disabled = false, onPress }: RowProps) {
  const danger = tone === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Icon size={20} color={danger ? Colors.danger : Colors.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.md,
  },
  profile: {
    gap: Spacing.lg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
  },
  rowIconDanger: {
    backgroundColor: Colors.status.turun.bg,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: FontSize.body,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  rowTitleDanger: {
    color: Colors.danger,
  },
  rowSubtitle: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  aboutText: {
    gap: 2,
  },
  appName: {
    fontSize: FontSize.headline,
    fontFamily: Fonts.extrabold,
    letterSpacing: 1,
    color: Colors.primary,
  },
  version: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  note: {
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 19,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xs,
  },
});
