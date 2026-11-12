import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Simpan CSV ke folder sementara app, lalu buka menu bagikan HP
 * (WhatsApp, Google Drive, email, dan lain-lain).
 * Hasilnya false kalau HP tidak punya menu bagikan.
 */
export async function shareCsv(fileName: string, content: string): Promise<boolean> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(content);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Kirim data ternak',
  });
  return true;
}
