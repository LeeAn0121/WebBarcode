/// <reference types="vite/client" />
import { prepareZXingModule } from "zxing-wasm/reader";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";
import { decodeLabelFrame } from "./labelDecoder.ts";

// Ship the matching WASM with the app; no third-party CDN is needed at scan time.
prepareZXingModule({ overrides: { locateFile: () => wasmUrl } });
let attempt = 0;

self.onmessage = async ({ data }: MessageEvent<ImageData>) => {
  try {
    self.postMessage({ text: await decodeLabelFrame(data, attempt++) });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
