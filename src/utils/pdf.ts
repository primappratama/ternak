import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/** Ukuran kertas A4 dalam point (72 per inci). */
const A4 = { width: 595, height: 842 };

/**
 * Ubah HTML jadi PDF A4, beri nama file yang jelas, lalu buka menu bagikan HP.
 * Hasilnya false kalau HP tidak punya menu bagikan.
 */
export async function sharePdf(html: string, fileName: string): Promise<boolean> {
  const { uri } = await Print.printToFileAsync({ html, ...A4 });
  // File hasil expo-print namanya acak; dipindah supaya penerima melihat nama yang jelas.
  const target = new File(Paths.cache, fileName);
  await new File(uri).move(target, { overwrite: true });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Kirim laporan',
  });
  return true;
}

/** Foto ternak sebagai data URI supaya bisa ditempel di PDF. Gagal dibaca: tanpa foto. */
export async function photoDataUri(uri: string | undefined): Promise<string | undefined> {
  if (!uri) return undefined;
  try {
    const extension = uri.split('.').pop()?.toLowerCase();
    const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${await new File(uri).base64()}`;
  } catch {
    return undefined;
  }
}
