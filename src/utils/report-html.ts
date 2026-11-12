import { LOGO_PATHS, LOGO_VIEWBOX } from '@/constants/brand';
import type { FeedRecord, HealthRecord, Settings } from '@/data/types';
import type { AnimalWithGrowth, Schedule } from '@/hooks/use-livestock';

import { formatAdg, formatGain, formatKg, SPECIES_LABEL, STATUS_LABEL } from './growth';
import { animalsLabel, dueLabel, formatRupiah, HEALTH_LABEL } from './records';
import type { FarmReport } from './report';
import { estimateTarget } from './target';
import { dayDiff, formatTanggalPendek, formatTanggalSedang } from './time';

/**
 * Template HTML laporan PDF. Satu file HTML lengkap dengan CSS di dalamnya,
 * lalu diubah jadi PDF oleh expo-print. Semua teks dari pengguna di-escape dulu.
 */

const C = {
  primary: '#163D22',
  accent: '#3E7D3A',
  soft: '#E8F0E6',
  line: '#DDE1DB',
  text: '#16201A',
  muted: '#5E6A61',
  faint: '#9AA39C',
  danger: '#C62828',
  warning: '#A15C00',
};

/** Ubah karakter khusus HTML supaya nama seperti "Si <Belang>" tidak merusak laporan. */
export function esc(value: string | number | undefined): string {
  if (value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const tanggal = (iso: string) => formatTanggalSedang(new Date(iso));

const logo = (width: number) =>
  `<svg width="${width}" viewBox="${LOGO_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">${LOGO_PATHS.map(
    (d) => `<path d="${d}" fill="${C.primary}" stroke="${C.primary}" stroke-width="3"/>`,
  ).join('')}</svg>`;

const CSS = `
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
         color: ${C.text}; font-size: 10.5pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .head { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 2px solid ${C.primary}; }
  .head .who { flex: 1; }
  .brand { font-size: 9pt; font-weight: 700; letter-spacing: 1.5px; color: ${C.accent}; }
  h1 { margin: 2px 0 0; font-size: 18pt; color: ${C.primary}; }
  .sub { color: ${C.muted}; font-size: 9.5pt; }
  .meta { text-align: right; color: ${C.muted}; font-size: 9pt; }
  h2 { margin: 20px 0 8px; font-size: 12pt; color: ${C.primary}; break-after: avoid; page-break-after: avoid; }
  /* Bagian pendek tidak dipotong di tengah; tabel panjang (pertumbuhan, riwayat) boleh lanjut ke halaman berikutnya. */
  section { break-inside: avoid; page-break-inside: avoid; }
  section.flow { break-inside: auto; page-break-inside: auto; }
  .grid { display: flex; gap: 8px; margin-top: 14px; }
  .box { flex: 1; background: ${C.soft}; border-radius: 8px; padding: 10px 12px; }
  .box .label { font-size: 8.5pt; color: ${C.muted}; }
  .box .value { font-size: 15pt; font-weight: 700; color: ${C.primary}; }
  .box .note { font-size: 8.5pt; color: ${C.muted}; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th { text-align: left; font-weight: 600; color: ${C.muted}; font-size: 8.5pt; padding: 6px 6px;
       border-bottom: 1px solid ${C.line}; background: #F6F7F5; }
  td { padding: 6px; border-bottom: 1px solid ${C.line}; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .up { color: ${C.accent}; } .down { color: ${C.danger}; } .warn { color: ${C.warning}; }
  .total td { font-weight: 700; border-bottom: none; }
  .empty { color: ${C.muted}; font-style: italic; padding: 6px 0; }
  .small { color: ${C.muted}; font-size: 8.5pt; }
  .foot { margin-top: 24px; padding-top: 8px; border-top: 1px solid ${C.line}; color: ${C.faint}; font-size: 8pt; }
  .profile { display: flex; gap: 16px; margin-top: 14px; align-items: center; }
  .photo { width: 110px; height: 110px; border-radius: 10px; object-fit: cover; background: ${C.soft}; }
  .code { font-size: 9pt; font-weight: 700; color: ${C.accent}; letter-spacing: 1px; }
  .name { font-size: 20pt; font-weight: 800; color: ${C.primary}; margin: 2px 0; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 8.5pt; font-weight: 600;
          background: ${C.soft}; color: ${C.accent}; }
  .chart { margin-top: 6px; border: 1px solid ${C.line}; border-radius: 8px; padding: 8px; }
`;

function page(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${CSS}</style></head><body>${body}</body></html>`;
}

function header(settings: Settings, title: string, subtitle: string, now: Date): string {
  return `<div class="head">
  ${logo(54)}
  <div class="who">
    <div class="brand">TERNAK</div>
    <h1>${esc(title)}</h1>
    <div class="sub">${esc(settings.farmName)}</div>
  </div>
  <div class="meta">${esc(subtitle)}<br>Dibuat ${esc(formatTanggalSedang(now))}<br>oleh ${esc(settings.ownerName)}</div>
</div>`;
}

function box(label: string, value: string, note?: string): string {
  return `<div class="box"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${
    note ? `<div class="note">${esc(note)}</div>` : ''
  }</div>`;
}

const gainClass = (kg: number | undefined) => (kg === undefined ? '' : kg < 0 ? 'down' : kg > 0 ? 'up' : '');

const footer = (note: string) =>
  `<div class="foot">Dibuat dengan aplikasi TERNAK. ${esc(note)}</div>`;

type AnimalLookup = { id: string; code: string; nickname?: string }[];

/** Di PDF, catatan kelompok menyebut semua kodenya (bukan "5 ekor") supaya bisa dicek. */
const whoOf = (ids: string[], animals: AnimalLookup) => {
  const list = animals.filter((a) => ids.includes(a.id));
  return list.length <= 1 ? animalsLabel(list) : list.map((a) => a.code).join(', ');
};

function healthTable(rows: HealthRecord[], animals: AnimalLookup, showAnimals: boolean, now: Date): string {
  if (rows.length === 0) return '<div class="empty">Belum ada catatan kesehatan.</div>';
  const body = rows
    .map((h) => {
      let next = '-';
      if (h.nextDate) {
        next = h.nextDone
          ? `${formatTanggalPendek(new Date(h.nextDate))} (selesai)`
          : `${formatTanggalPendek(new Date(h.nextDate))} (${dueLabel(h.nextDate, now).text.toLowerCase()})`;
      }
      return `<tr><td>${esc(tanggal(h.date))}</td><td>${esc(HEALTH_LABEL[h.kind])}${
        h.title ? `<br><span class="small">${esc(h.title)}</span>` : ''
      }${h.note ? `<br><span class="small">${esc(h.note)}</span>` : ''}</td>${
        showAnimals ? `<td>${esc(whoOf(h.animalIds, animals))}</td>` : ''
      }<td>${esc(next)}</td><td class="num">${h.costRp !== undefined ? esc(formatRupiah(h.costRp)) : '-'}</td></tr>`;
    })
    .join('');
  return `<table><thead><tr><th>Tanggal</th><th>Tindakan</th>${
    showAnimals ? '<th>Ternak</th>' : ''
  }<th>Jadwal berikutnya</th><th class="num">Biaya</th></tr></thead><tbody>${body}</tbody></table>`;
}

/** Laporan seluruh peternakan untuk satu periode. */
export function farmReportHtml(
  report: FarmReport,
  settings: Settings,
  schedules: Schedule[],
  animals: AnimalLookup,
  now: Date = new Date(),
): string {
  const r = report;
  const species = r.speciesCounts.map((s) => `${s.count} ${SPECIES_LABEL[s.species].toLowerCase()}`).join(', ');

  const growthRows = r.growth
    .map(
      (g) => `<tr>
  <td><b>${esc(g.animal.code)}</b>${g.animal.nickname ? `<br><span class="small">${esc(g.animal.nickname)}</span>` : ''}</td>
  <td>${esc(SPECIES_LABEL[g.animal.species])}</td>
  <td class="num">${g.startKg !== undefined ? esc(formatKg(g.startKg)) : '-'}</td>
  <td class="num">${g.endKg !== undefined ? esc(formatKg(g.endKg)) : '-'}</td>
  <td class="num ${gainClass(g.gainKg)}">${g.gainKg !== undefined ? esc(formatGain(g.gainKg)) : '-'}</td>
  <td class="num">${esc(formatAdg(g.adgKg))}</td>
  <td class="num">${g.weighCount}x</td>
</tr>`,
    )
    .join('');

  const feedRows = r.feedByType
    .map(
      (f) => `<tr><td>${esc(f.feedType)}</td><td class="num">${esc(formatKg(f.amountKg))}</td><td class="num">${
        f.count
      }x</td><td class="num">${f.costRp > 0 ? esc(formatRupiah(f.costRp)) : '-'}</td></tr>`,
    )
    .join('');

  const scheduleRows = schedules
    .map((s) => {
      const due = dueLabel(s.nextDate, now);
      return `<tr><td>${esc(tanggal(s.nextDate))}</td><td>${esc(HEALTH_LABEL[s.record.kind])}${
        s.record.title ? ` · ${esc(s.record.title)}` : ''
      }</td><td>${esc(whoOf(s.record.animalIds, animals))}</td><td class="${
        due.tone === 'danger' ? 'down' : due.tone === 'warning' ? 'warn' : ''
      }">${esc(due.text)}</td></tr>`;
    })
    .join('');

  const body = `
${header(settings, 'Laporan Peternakan', r.period.label, now)}
<div class="grid">
  ${box('Jumlah ternak', `${r.animalCount} ekor`, species || undefined)}
  ${box('Ternak masuk', `${r.enteredCount} ekor`, 'di periode ini')}
  ${box('Penimbangan', `${r.weighCount} kali`)}
  ${box('Total biaya', formatRupiah(r.totalCostRp), `pakan ${formatRupiah(r.feedCostRp)}, kesehatan ${formatRupiah(r.healthCostRp)}`)}
</div>

<section class="flow"><h2>Pertumbuhan berat</h2>
${
  r.growth.length === 0
    ? '<div class="empty">Belum ada ternak.</div>'
    : `<table><thead><tr><th>Ternak</th><th>Jenis</th><th class="num">Awal</th><th class="num">Akhir</th><th class="num">Naik</th><th class="num">Per hari</th><th class="num">Timbang</th></tr></thead><tbody>${growthRows}</tbody></table>
<div class="small" style="margin-top:4px">Awal = timbangan terakhir sebelum periode (atau yang pertama di dalam periode). Per hari dihitung kalau jarak timbang minimal 1 hari.</div>`
}

</section>
<section><h2>Pakan</h2>
${
  r.feedByType.length === 0
    ? '<div class="empty">Belum ada catatan pakan di periode ini.</div>'
    : `<table><thead><tr><th>Jenis pakan</th><th class="num">Total</th><th class="num">Dicatat</th><th class="num">Biaya</th></tr></thead><tbody>${feedRows}
<tr class="total"><td>Total</td><td class="num">${esc(formatKg(r.feedTotalKg))}</td><td class="num">${r.feeds.length}x</td><td class="num">${esc(formatRupiah(r.feedCostRp))}</td></tr></tbody></table>`
}

</section>
<section><h2>Kesehatan</h2>
${healthTable(r.health, animals, true, now)}

</section>
<section><h2>Jadwal yang belum dikerjakan</h2>
${
  schedules.length === 0
    ? '<div class="empty">Tidak ada jadwal.</div>'
    : `<table><thead><tr><th>Tanggal</th><th>Tindakan</th><th>Ternak</th><th>Status</th></tr></thead><tbody>${scheduleRows}</tbody></table>`
}
</section>

${footer('Angka dihitung dari catatan timbang, pakan, dan kesehatan yang diisi di aplikasi.')}`;

  return page(`Laporan ${settings.farmName} ${r.period.label}`, body);
}

/** Grafik garis sederhana (SVG) untuk kartu ternak. */
function chartSvg(records: { date: string; weightKg: number }[], targetKg?: number): string {
  if (records.length < 2) return '<div class="empty">Grafik muncul setelah ada 2 timbangan.</div>';
  const W = 520;
  const H = 150;
  const pad = { l: 46, r: 10, t: 12, b: 22 };
  const times = records.map((r) => new Date(r.date).getTime());
  const values = records.map((r) => r.weightKg);
  const domain = targetKg !== undefined ? [...values, targetKg] : values;
  const spread = Math.max(...domain) - Math.min(...domain) || 1;
  const min = Math.min(...domain) - spread * 0.15;
  const max = Math.max(...domain) + spread * 0.15;
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const x = (t: number) => pad.l + ((t - tMin) / (tMax - tMin || 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const pts = records.map((r, i) => `${x(times[i]).toFixed(1)},${y(r.weightKg).toFixed(1)}`).join(' ');
  const label = (v: number) => `<text x="${pad.l - 6}" y="${y(v) + 3}" font-size="9" fill="${C.faint}" text-anchor="end">${esc(formatKg(v))}</text>`;
  const target =
    targetKg !== undefined
      ? `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(targetKg)}" y2="${y(targetKg)}" stroke="${C.primary}" stroke-dasharray="5 4"/>
         <text x="${W - pad.r}" y="${y(targetKg) - 4}" font-size="9" font-weight="600" fill="${C.primary}" text-anchor="end">Target ${esc(formatKg(targetKg))}</text>`
      : '';
  return `<div class="chart"><svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}" stroke="${C.line}"/>
  ${label(Math.min(...values))}${label(Math.max(...values))}
  ${target}
  <polyline points="${pts}" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  ${records.map((r, i) => `<circle cx="${x(times[i]).toFixed(1)}" cy="${y(r.weightKg).toFixed(1)}" r="3" fill="#fff" stroke="${C.accent}" stroke-width="1.5"/>`).join('')}
  <text x="${pad.l}" y="${H - 6}" font-size="9" fill="${C.faint}">${esc(formatTanggalPendek(new Date(tMin)))}</text>
  <text x="${W - pad.r}" y="${H - 6}" font-size="9" fill="${C.faint}" text-anchor="end">${esc(formatTanggalPendek(new Date(tMax)))}</text>
</svg></div>`;
}

/** Kartu satu ekor: identitas, berat, target, grafik, riwayat timbang, kesehatan, dan pakan. */
export function animalCardHtml(
  animal: AnimalWithGrowth,
  settings: Settings,
  feeds: FeedRecord[],
  health: HealthRecord[],
  animals: AnimalLookup,
  photo: string | undefined,
  now: Date = new Date(),
): string {
  const g = animal.growth;
  const target = animal.targetKg !== undefined ? estimateTarget(g, animal.targetKg, now) : undefined;
  let targetNote = 'belum diatur';
  if (target) {
    if (target.kind === 'tercapai') targetNote = 'sudah tercapai';
    else if (target.kind === 'perkiraan' && !target.overdue)
      targetNote = `perkiraan ${formatTanggalSedang(target.etaDate)}`;
    else targetNote = `kurang ${formatKg(target.remainingKg)}`;
  }

  const history = [...g.records].reverse();
  const MAX_WEIGHTS = 15;
  const weightRows = history
    .slice(0, MAX_WEIGHTS)
    .map((w, i) => {
      const older = history[i + 1];
      const change = older ? w.weightKg - older.weightKg : undefined;
      return `<tr><td>${esc(tanggal(w.date))}</td><td class="num">${esc(formatKg(w.weightKg))}</td><td class="num ${gainClass(
        change,
      )}">${change !== undefined ? esc(formatGain(change)) : 'awal'}</td><td>${esc(w.note ?? '')}</td></tr>`;
    })
    .join('');

  const myFeeds = feeds.filter((f) => f.animalIds.includes(animal.id)).sort((a, b) => b.date.localeCompare(a.date));
  const MAX_FEEDS = 10;
  const feedRows = myFeeds
    .slice(0, MAX_FEEDS)
    .map(
      (f) => `<tr><td>${esc(tanggal(f.date))}</td><td>${esc(f.feedType)}</td><td class="num">${esc(
        formatKg(f.amountKg),
      )}${f.animalIds.length > 1 ? `<br><span class="small">untuk ${f.animalIds.length} ekor</span>` : ''}</td><td class="num">${
        f.costRp !== undefined ? esc(formatRupiah(f.costRp)) : '-'
      }</td></tr>`,
    )
    .join('');

  const myHealth = health.filter((h) => h.animalIds.includes(animal.id)).sort((a, b) => b.date.localeCompare(a.date));
  const days = dayDiff(animal.entryDate, now);

  const body = `
${header(settings, 'Kartu Ternak', `${animal.code}${animal.nickname ? ` · ${animal.nickname}` : ''}`, now)}
<div class="profile">
  ${photo ? `<img class="photo" src="${esc(photo)}">` : ''}
  <div>
    <div class="code">${esc(animal.code)}</div>
    <div class="name">${esc(animal.nickname ?? animal.code)}</div>
    <div class="sub">${esc(SPECIES_LABEL[animal.species])} · ${animal.sex === 'jantan' ? 'Jantan' : 'Betina'} · masuk ${esc(
      tanggal(animal.entryDate),
    )} (${days} hari)</div>
    <div style="margin-top:6px"><span class="pill">${esc(STATUS_LABEL[g.status])}</span></div>
  </div>
</div>

<div class="grid">
  ${box('Berat terakhir', g.latestWeightKg !== undefined ? formatKg(g.latestWeightKg) : '-', g.records.length ? `ditimbang ${formatTanggalPendek(new Date(g.records[g.records.length - 1].date))}` : undefined)}
  ${box('Berat awal', g.firstWeightKg !== undefined ? formatKg(g.firstWeightKg) : '-')}
  ${box('Kenaikan', formatGain(g.totalGainKg), `rata-rata ${formatAdg(g.overallAdgKg)}`)}
  ${box('Target', target ? formatKg(target.targetKg) : '-', targetNote)}
</div>

<section><h2>Grafik berat</h2>
${chartSvg(g.records, animal.targetKg)}

</section>
<section class="flow"><h2>Riwayat timbang</h2>
${
  history.length === 0
    ? '<div class="empty">Belum ada timbangan.</div>'
    : `<table><thead><tr><th>Tanggal</th><th class="num">Berat</th><th class="num">Perubahan</th><th>Catatan</th></tr></thead><tbody>${weightRows}</tbody></table>${
        history.length > MAX_WEIGHTS ? `<div class="small">${history.length - MAX_WEIGHTS} timbangan lebih lama tidak ditampilkan.</div>` : ''
      }`
}

</section>
<section><h2>Kesehatan</h2>
${healthTable(myHealth, animals, false, now)}

</section>
<section><h2>Pakan terakhir</h2>
${
  myFeeds.length === 0
    ? '<div class="empty">Belum ada catatan pakan.</div>'
    : `<table><thead><tr><th>Tanggal</th><th>Pakan</th><th class="num">Jumlah</th><th class="num">Biaya</th></tr></thead><tbody>${feedRows}</tbody></table>`
}
</section>

${footer('Berat dan kenaikan dihitung dari catatan timbang di aplikasi.')}`;

  return page(`Kartu ternak ${animal.code}`, body);
}
