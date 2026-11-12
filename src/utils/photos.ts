import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Foto ternak disalin ke folder milik app ("photos"), karena file hasil kamera/galeri
 * bisa dihapus sistem kapan saja. Database hanya menyimpan alamat file salinannya.
 */
const photoDir = () => new Directory(Paths.document, 'photos');

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

/** Buka kamera atau galeri. Hasilnya alamat file sementara, atau null kalau batal / izin ditolak. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    return result.canceled ? null : (result.assets[0]?.uri ?? null);
  }
  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/** Salin foto sementara ke folder app, lalu kembalikan alamat salinannya. */
export async function persistPhoto(tempUri: string, id: string): Promise<string> {
  const dir = photoDir();
  dir.create({ idempotent: true, intermediates: true });
  const extension = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
  // Nama file diberi waktu supaya foto pengganti punya alamat baru (gambar lama tidak nyangkut di cache).
  const target = new File(dir, `${id}-${Date.now()}.${extension}`);
  await new File(tempUri).copy(target);
  return target.uri;
}

/** Hapus file foto kalau masih ada. Kegagalan diabaikan karena data utamanya sudah terhapus. */
export function deletePhoto(uri: string | undefined) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // abaikan
  }
}
