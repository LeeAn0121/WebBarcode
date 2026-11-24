import { readBarcodes, type ReaderOptions } from "zxing-wasm/reader";

/** RGBA pixels; deliberately independent of Canvas and ImageData constructors. */
export interface PixelFrame {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export const LABEL_FORMATS: NonNullable<ReaderOptions["formats"]> = [
  "QRCode",
  "EAN13",
  "EAN8",
  "Code128",
  "Code39",
  "UPCA",
  "UPCE",
  "ITF",
  "Code93",
  "Codabar",
  "DataMatrix",
  "PDF417",
  "DataBar",
  "DataBarExp",
];

const OPTIONS: ReaderOptions = {
  formats: LABEL_FORMATS,
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  minLineCount: 2,
  maxNumberOfSymbols: 1,
  returnErrors: false,
};

function centerBand(frame: PixelFrame): PixelFrame {
  // Retain the complete horizontal quiet zones; a narrow square crop cuts long labels.
  const height = Math.max(1, Math.round(frame.height * 0.66));
  const top = Math.floor((frame.height - height) / 2);
  return {
    width: frame.width,
    height,
    data: frame.data.slice(
      top * frame.width * 4,
      (top + height) * frame.width * 4,
    ),
  };
}

function enhance(frame: PixelFrame): PixelFrame {
  // A fixed local window follows the printed modules rather than the much
  // larger camera frame, where a broad window would mix in paper edges.
  const radius = 16;
  const { width, height, data } = frame;
  const gray = new Uint8ClampedArray(width * height);
  const histogram = new Uint32Array(256);
  // Subtract slow horizontal lighting changes without thresholding the barcode.
  // This preserves faint edges for ZXing's own binarizer and checksum validation.

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const offset = (row + x) * 4;
      gray[row + x] =
        (data[offset] * 77 + data[offset + 1] * 150 + data[offset + 2] * 29) >>
        8;
    }
  }
  const normalized = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = 0; x <= Math.min(width - 1, radius); x++) sum += gray[row + x];
    for (let x = 0; x < width; x++) {
      const count =
        Math.min(width - 1, x + radius) - Math.max(0, x - radius) + 1;
      const value = Math.max(
        0,
        Math.min(255, Math.round(128 + gray[row + x] - sum / count)),
      );
      normalized[row + x] = value;
      histogram[value]++;
      if (x - radius >= 0) sum -= gray[row + x - radius];
      if (x + radius + 1 < width) sum += gray[row + x + radius + 1];
    }
  }
  const percentile = (fraction: number) => {
    const target = normalized.length * fraction;
    let count = 0;
    for (let value = 0; value < 256; value++) {
      count += histogram[value];
      if (count >= target) return value;
    }
    return 255;
  };
  // Sparse labels can occupy less than 2% of a camera frame. Flat paper
  // dominates the normalized histogram at 128; widen the tails in that case.
  const low = percentile(
    histogram[128] > normalized.length * 0.7 ? 0.005 : 0.02,
  );
  const high = percentile(0.98);
  // Upscale horizontally only: duplicating rows would turn a single observed
  // scan line into two agreeing lines. The caller limits input to 1.5M pixels,
  // so this output is at most 3M pixels (12MB of RGBA).
  const scale = 2;
  const output = new Uint8ClampedArray(width * height * scale * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width * scale; x++) {
      const value = normalized[y * width + Math.floor(x / scale)];
      const stretched =
        high > low ? ((value - low) * 255) / (high - low) : value;
      const offset = (y * width * scale + x) * 4;
      output[offset] = output[offset + 1] = output[offset + 2] = stretched;
      output[offset + 3] = 255;
    }
  }
  return { width: width * scale, height, data: output };
}

async function read(frame: PixelFrame): Promise<string | undefined> {
  const results = await readBarcodes(frame as ImageData, OPTIONS);
  return results.find((result) => result.isValid && !result.error)?.text;
}

/** At most three decodes per frame; normal misses resolve to undefined. */
export async function decodeLabelFrame(
  frame: PixelFrame,
  attempt = 0,
): Promise<string | undefined> {
  if (
    !Number.isSafeInteger(frame.width) ||
    !Number.isSafeInteger(frame.height) ||
    frame.width <= 0 ||
    frame.height <= 0 ||
    frame.data.length !== frame.width * frame.height * 4
  ) {
    throw new Error("Invalid barcode pixel frame");
  }
  const center = centerBand(frame);
  const centered = await read(center);
  if (centered !== undefined) return centered;
  // Oversized inputs still get their original pixels scanned, but no enhancement copies.
  // Alternate fallback order so a stream does not always pay for full-frame decoding first.
  const canEnhance = center.width * center.height <= 1_500_000;
  if (canEnhance && attempt % 2 !== 0) {
    return (await read(enhance(center))) ?? (await read(frame));
  }
  return (
    (await read(frame)) ??
    (canEnhance ? await read(enhance(center)) : undefined)
  );
}
