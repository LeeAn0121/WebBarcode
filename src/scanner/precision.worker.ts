/// <reference types="vite/client" />
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// Ship the matching WASM with the app; no third-party CDN is needed at scan time.
prepareZXingModule({ overrides: { locateFile: () => wasmUrl } });

self.onmessage = async ({ data }: MessageEvent<ImageData>) => {
  try {
    const results = await readBarcodes(data, {
      formats: ['QRCode', 'EAN-13', 'EAN-8', 'Code128', 'Code39', 'UPC-A', 'UPC-E', 'ITF'],
      tryHarder: true,
      tryRotate: true,
      tryInvert: true,
      maxNumberOfSymbols: 1,
    });
    self.postMessage({ text: results[0]?.text });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
