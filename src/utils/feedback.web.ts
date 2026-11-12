/** Versi browser: dialog bawaan browser, tanpa getar. Hanya untuk pratinjau. */

export function successFeedback() {}

export function confirmAsync(
  title: string,
  message: string,
  _confirmLabel = 'Ya',
  _destructive = false,
): Promise<boolean> {
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}

export function notify(title: string, message: string) {
  window.alert(`${title}\n\n${message}`);
}
