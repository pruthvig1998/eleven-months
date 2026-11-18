// Reads text from a photo or a scanned page on this device (Tesseract compiled to WebAssembly). The image is
// never uploaded. shortcut: the recogniser code and English data are fetched from the library's CDN on first
// use (about 10 MB, then cached); host them with the app if that CDN must not be a dependency.
// English only. Recognition makes mistakes, so the caller shows the text for the user to correct before scanning.
type Img = Blob;
export async function ocr(images: Img[], onProgress: (done: number, total: number, pct: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  let page = 0;
  const worker = await createWorker('eng', 1, { logger: m => { if (m.status === 'recognizing text') onProgress(page, images.length, Math.round(m.progress * 100)); } });
  try {
    const out: string[] = [];
    for (const img of images) { out.push((await worker.recognize(img)).data.text.trim()); page++; }
    return out.join('\n\n').trim();
  } finally { await worker.terminate(); }
}
