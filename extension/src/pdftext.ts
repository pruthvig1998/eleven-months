// Reads the text layer of a PDF on this device with pdf.js (bundled; no network). Scanned PDFs have no text layer:
// those need the web app, which can read page images on the device.
export async function pdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    let page = '';
    for (const it of content.items as { str?: string; hasEOL?: boolean }[]) page += (it.str ?? '') + (it.hasEOL ? '\n' : '');
    pages.push(page.trim());
  }
  return pages.join('\n\n').trim();
}
