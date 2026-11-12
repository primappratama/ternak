import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigActionButton } from '@/components/big-action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FadeInView } from '@/components/fade-in-view';
import { MetricCard } from '@/components/metric-card';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { Download, HeartPulse, PawPrint, Wallet, Wheat } from '@/constants/icons';
import { Colors, Fonts, FontSize, LetterSpacing, Motion, Spacing } from '@/constants/theme';
import { useLivestockStore } from '@/data/livestock-store';
import { useLivestock } from '@/hooks/use-livestock';
import { notify } from '@/utils/feedback';
import { formatGain, formatKg, SPECIES_LABEL } from '@/utils/growth';
import { sharePdf } from '@/utils/pdf';
import { formatRupiah } from '@/utils/records';
import { buildFarmReport, getPeriod, PERIOD_OPTIONS, type PeriodKey } from '@/utils/report';
import { farmReportHtml } from '@/utils/report-html';

/** Berapa ekor yang ditampilkan di layar; sisanya ada di PDF. */
const TOP_GROWTH = 5;

export default function LaporanScreen() {
  const { now, schedules } = useLivestock();
  const { animals, weights, feeds, health, settings } = useLivestockStore();
  const [periodKey, setPeriodKey] = useState<PeriodKey>('bulanIni');
  const [exporting, setExporting] = useState(false);

  // Semua angka laporan dihitung ulang saat periode atau data berubah.
  const report = useMemo(
    () => buildFarmReport(animals, weights, feeds, health, getPeriod(periodKey, now)),
    [animals, weights, feeds, health, periodKey, now],
  );

  // Diurutkan dari persen kenaikan, bukan kg, supaya sapi dan kambing bisa dibandingkan adil.
  const topGrowth = useMemo(
    () =>
      report.growth
        .filter((g) => g.gainKg !== undefined && g.startKg)
        .map((g) => ({ ...g, pct: ((g.gainKg ?? 0) / (g.startKg ?? 1)) * 100 }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, TOP_GROWTH),
    [report],
  );

  const exportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const html = farmReportHtml(report, settings, schedules, animals, now);
      const shared = await sharePdf(html, `laporan-ternak-${report.period.slug}.pdf`);
      if (!shared) notify('Nggak bisa dibagikan', 'HP ini tidak punya menu bagikan file.');
    } catch (error) {
      notify('Gagal membuat PDF', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    } finally {
      setExporting(false);
    }
  };

  const species = report.speciesCounts
    .map((s) => `${s.count} ${SPECIES_LABEL[s.species].toLowerCase()}`)
    .join(', ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <Text style={styles.largeTitle}>Laporan</Text>
          <Text style={styles.subtitle}>{report.period.label}</Text>
        </FadeInView>

        <FadeInView delay={Motion.stagger}>
          <SegmentedTabs tabs={PERIOD_OPTIONS} active={periodKey} onChange={setPeriodKey} variant="pill" />
        </FadeInView>

        {animals.length === 0 ? (
          <EmptyState title="Belum ada data" message="Tambah ternak dan catat timbangannya, lalu laporan muncul di sini." />
        ) : (
          <>
            <FadeInView delay={Motion.stagger * 2} style={styles.grid} key={`grid-${periodKey}`}>
              <View style={styles.row}>
                <MetricCard label="Ternak" icon={PawPrint} footnote={species || undefined}>
                  <Text style={styles.metric}>{report.animalCount} ekor</Text>
                </MetricCard>
                <MetricCard label="Total biaya" icon={Wallet} footnote="pakan + kesehatan">
                  <Text style={styles.metric} numberOfLines={1} adjustsFontSizeToFit>
                    {formatRupiah(report.totalCostRp)}
                  </Text>
                </MetricCard>
              </View>
              <View style={styles.row}>
                <MetricCard label="Pakan" icon={Wheat} footnote={report.feedCostRp > 0 ? formatRupiah(report.feedCostRp) : `${report.feeds.length} catatan`}>
                  <Text style={styles.metric}>{formatKg(report.feedTotalKg)}</Text>
                </MetricCard>
                <MetricCard label="Kesehatan" icon={HeartPulse} footnote={report.healthCostRp > 0 ? formatRupiah(report.healthCostRp) : undefined}>
                  <Text style={styles.metric}>{report.health.length} tindakan</Text>
                </MetricCard>
              </View>
            </FadeInView>

            <FadeInView delay={Motion.stagger * 3} key={`growth-${periodKey}`}>
              <Text style={styles.sectionTitle}>Pertumbuhan tercepat</Text>
              <Text style={styles.sectionHint}>Diurutkan dari persen kenaikan terhadap berat awal periode.</Text>
              <Card flush style={styles.sectionCard}>
                {topGrowth.length === 0 ? (
                  <Text style={styles.empty}>Belum ada 2 timbangan di periode ini.</Text>
                ) : (
                  topGrowth.map((g, i) => (
                    <View key={g.animal.id} style={[styles.line, i > 0 && styles.divider]}>
                      <Text style={styles.lineName} numberOfLines={1}>
                        {g.animal.code}
                        {g.animal.nickname ? <Text style={styles.lineNick}> {g.animal.nickname}</Text> : null}
                      </Text>
                      <Text style={[styles.lineValue, (g.gainKg ?? 0) < 0 && styles.down]}>
                        {formatGain(g.gainKg ?? 0)}
                      </Text>
                      <Text style={styles.lineSub}>
                        {g.pct >= 0 ? '+' : ''}
                        {g.pct.toFixed(1).replace('.', ',')}%
                      </Text>
                    </View>
                  ))
                )}
              </Card>
            </FadeInView>

            <FadeInView delay={Motion.stagger * 4} key={`feed-${periodKey}`}>
              <Text style={styles.sectionTitle}>Pakan per jenis</Text>
              <Card flush style={styles.sectionCard}>
                {report.feedByType.length === 0 ? (
                  <Text style={styles.empty}>Belum ada catatan pakan di periode ini.</Text>
                ) : (
                  report.feedByType.map((f, i) => (
                    <View key={f.feedType} style={[styles.line, i > 0 && styles.divider]}>
                      <Text style={styles.lineName} numberOfLines={1}>
                        {f.feedType}
                      </Text>
                      <Text style={styles.lineValue}>{formatKg(f.amountKg)}</Text>
                      <Text style={styles.lineSub}>{f.costRp > 0 ? formatRupiah(f.costRp) : '-'}</Text>
                    </View>
                  ))
                )}
              </Card>
            </FadeInView>

            <FadeInView delay={Motion.stagger * 5}>
              <BigActionButton
                label={exporting ? 'Menyiapkan PDF...' : 'Export ke PDF'}
                icon={Download}
                onPress={exportPdf}
              />
              <Text style={styles.hint}>
                PDF berisi tabel pertumbuhan semua ekor, pakan, kesehatan, biaya, dan jadwal. Bisa dikirim ke
                WhatsApp atau Drive.
              </Text>
            </FadeInView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.lg,
  },
  largeTitle: {
    fontSize: FontSize.largeTitle,
    fontFamily: Fonts.extrabold,
    letterSpacing: LetterSpacing.largeTitle,
    color: Colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  grid: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metric: {
    fontSize: FontSize.title,
    fontFamily: Fonts.extrabold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontSize: FontSize.headline,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  sectionHint: {
    marginTop: 2,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  sectionCard: {
    marginTop: Spacing.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  lineName: {
    flex: 1,
    fontSize: FontSize.caption,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  lineValue: {
    fontSize: FontSize.caption,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  lineSub: {
    minWidth: 76,
    textAlign: 'right',
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  lineNick: {
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  down: {
    color: Colors.danger,
  },
  empty: {
    padding: Spacing.lg,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  hint: {
    marginTop: Spacing.sm,
    fontSize: FontSize.footnote,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
});
