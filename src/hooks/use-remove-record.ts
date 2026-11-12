import { useLivestockStore } from '@/data/livestock-store';
import { confirmAsync, notify, successFeedback } from '@/utils/feedback';
import { HEALTH_LABEL } from '@/utils/records';
import { formatTanggalSedang } from '@/utils/time';

import type { Activity } from './use-livestock';

/** Hapus catatan pakan atau kesehatan, dengan konfirmasi. Timbangan dihapus dari tab Riwayat. */
export function useRemoveRecord() {
  const { deleteFeed, deleteHealth } = useLivestockStore();

  return async (a: Activity) => {
    if (a.kind === 'timbang') return;
    const what = a.kind === 'pakan' ? `pakan ${a.record.feedType}` : HEALTH_LABEL[a.record.kind].toLowerCase();
    const group =
      a.animals.length > 1 ? ` Catatan ini untuk ${a.animals.length} ekor, jadi terhapus untuk semuanya.` : '';
    const ok = await confirmAsync(
      'Hapus catatan?',
      `Catatan ${what} tanggal ${formatTanggalSedang(new Date(a.date))} akan dihapus.${group}`,
      'Hapus',
      true,
    );
    if (!ok) return;
    try {
      if (a.kind === 'pakan') await deleteFeed(a.id);
      else await deleteHealth(a.id);
      successFeedback();
    } catch (error) {
      notify('Gagal menghapus', error instanceof Error ? error.message : 'Coba lagi sebentar.');
    }
  };
}
