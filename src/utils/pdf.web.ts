/**
 * Versi browser (pratinjau): laporan dibuka di dialog cetak browser,
 * dari situ bisa disimpan sebagai PDF.
 */
export async function sharePdf(html: string, _fileName: string): Promise<boolean> {
  const frame = document.createElement('iframe');
  Object.assign(frame.style, { position: 'fixed', width: '0', height: '0', border: '0', right: '0', bottom: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) return false;
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => frame.remove(), 1000);
  return true;
}

export async function photoDataUri(uri: string | undefined): Promise<string | undefined> {
  return uri;
}
