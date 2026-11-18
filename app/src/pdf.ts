// Reads a lease file in the browser. Nothing is uploaded: the file is parsed on this device.
// Text PDFs give their text directly. Photos, and PDFs with no text layer (scans), are read twice on the device:
// by the on-device model through Firebase AI Logic, and by a plain text recogniser. The model's reading is used
// only when the two agree (see readcheck.ts); otherwise the recogniser's text is used. Either way `ocrUsed` tells
// the caller to ask the user to check the result.
import { ocr } from './ocr.ts';
import { nanoReadImage } from './ai.ts';
import { agreement, AGREE_MIN } from './readcheck.ts';
export interface Read { text: string; ocrUsed: boolean; reader?: 'on-device model' | 'text recogniser'; agree?: number }
type Progress = (msg: string) => void;
const MAX_SCAN_PAGES = 12; // shortcut: reading takes several seconds a page; raise if longer scans are common

async function readPages(pages: Blob[], what: string, progress: Progress): Promise<Read> {
  progress('Loading the text reader (about 10 MB the first time)...');
  const plain = need(await ocr(pages, (done, total, pct) => progress(`Reading ${what} on this device: page ${done + 1} of ${total}, ${pct}%`)));
  let model: string[] | null = [];
  try {
    for (const [i, p] of pages.entries()) {
      progress(`Second reading with the on-device model: page ${i + 1} of ${pages.length}`);
      const t = await nanoReadImage(p);
      if (t === null) { model = null; break; }
      model.push(t);
    }
  } catch { model = null; } // no image support, or the model failed: the recogniser's text stands
  if (!model) return { text: plain, ocrUsed: true, reader: 'text recogniser' };
  const text = model.join('\n\n').trim(), agree = agreement(text, plain);
  return agree >= AGREE_MIN ? { text, ocrUsed: true, reader: 'on-device model', agree } : { text: plain, ocrUsed: true, reader: 'text recogniser', agree };
}

export async function readLeaseFile(file: File, progress: Progress = () => {}): Promise<Read> {
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(file.name)) return readPages([file], 'the photo', progress);
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return { text: (await file.text()).trim(), ocrUsed: false };
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    let page = '';
    for (const it of content.items as { str?: string; hasEOL?: boolean }[]) page += (it.str ?? '') + (it.hasEOL ? '\n' : '');
    pages.push(page.trim());
  }
  const text = pages.join('\n\n').trim();
  if (text.replace(/\s/g, '').length >= 40) return { text, ocrUsed: false };
  // No text layer: a scan. Draw each page and read it.
  if (doc.numPages > MAX_SCAN_PAGES) throw new Error(`This scanned PDF has ${doc.numPages} pages. Scans are read up to ${MAX_SCAN_PAGES} pages; split the file or paste the text.`);
  progress('This PDF is a scan. Drawing its pages...');
  const images: Blob[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pg = await doc.getPage(n), viewport = pg.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
    await pg.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
    images.push(await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('Could not draw the page.'))), 'image/jpeg', 0.9)));
  }
  return readPages(images, 'the scan', progress);
}
function need(text: string): string {
  if (text.replace(/\s/g, '').length < 40) throw new Error('No readable text was found. Try a sharper, straight, well-lit photo, or paste the text.');
  return text;
}
