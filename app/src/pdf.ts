// Reads a lease file in the browser. Nothing is uploaded: the file is parsed on this device.
// Text PDFs give their text directly. Photos, and PDFs with no text layer (scans), go through on-device
// text recognition; `ocrUsed` tells the caller to ask the user to check the result.
import { ocr } from './ocr.ts';
export interface Read { text: string; ocrUsed: boolean }
type Progress = (msg: string) => void;
const MAX_SCAN_PAGES = 12; // shortcut: recognition takes several seconds a page; raise if longer scans are common

export async function readLeaseFile(file: File, progress: Progress = () => {}): Promise<Read> {
  const say = (what: string) => (done: number, total: number, pct: number) => progress(`Reading ${what} on this device: page ${done + 1} of ${total}, ${pct}%`);
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(file.name)) {
    progress('Loading the text reader (about 10 MB the first time)...');
    return { text: need(await ocr([file], say('the photo'))), ocrUsed: true };
  }
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
  // No text layer: a scan. Draw each page and recognise it.
  if (doc.numPages > MAX_SCAN_PAGES) throw new Error(`This scanned PDF has ${doc.numPages} pages. Scans are read up to ${MAX_SCAN_PAGES} pages; split the file or paste the text.`);
  progress('This PDF is a scan. Loading the text reader (about 10 MB the first time)...');
  const canvases: HTMLCanvasElement[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pg = await doc.getPage(n), viewport = pg.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
    await pg.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
    canvases.push(canvas);
  }
  return { text: need(await ocr(canvases, say('the scan'))), ocrUsed: true };
}
function need(text: string): string {
  if (text.replace(/\s/g, '').length < 40) throw new Error('No readable text was found. Try a sharper, straight, well-lit photo, or paste the text.');
  return text;
}
