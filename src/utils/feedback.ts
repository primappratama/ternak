import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

/** Getar singkat tanda berhasil disimpan. Diam saja kalau HP nggak mendukung. */
export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Dialog konfirmasi Ya/Batal yang bisa di-await. */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = 'Ya',
  destructive = false,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Pesan singkat dengan satu tombol OK. */
export function notify(title: string, message: string) {
  Alert.alert(title, message);
}
