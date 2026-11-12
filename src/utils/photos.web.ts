import * as ImagePicker from 'expo-image-picker';

/** Versi browser: foto dipilih dari file komputer, tidak disalin. Hanya untuk pratinjau. */

export async function pickPhoto(_source: 'camera' | 'library'): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

export async function persistPhoto(tempUri: string, _id: string): Promise<string> {
  return tempUri;
}

export function deletePhoto(_uri: string | undefined) {}
