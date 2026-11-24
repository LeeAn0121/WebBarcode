import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import JsBarcode from "jsbarcode";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import {
  prepareZXingModule as prepareWriter,
  writeBarcode,
} from "zxing-wasm/writer";
import {
  decodeLabelFrame,
  LABEL_FORMATS,
} from "../src/scanner/labelDecoder.ts";

prepareZXingModule({
  overrides: {
    wasmBinary: readFileSync(
      new URL(
        "../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm",
        import.meta.url,
      ),
    ),
  },
});
prepareWriter({
  overrides: {
    wasmBinary: readFileSync(
      new URL(
        "../node_modules/zxing-wasm/dist/writer/zxing_writer.wasm",
        import.meta.url,
      ),
    ),
  },
});
const PAYLOAD = "KSU202611240001";

function blank(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4).fill(255),
  };
}
function linear(
  format,
  {
    module = 2,
    height = 48,
    ink = 0,
    lighting = 0,
    corruptChecksum = false,
  } = {},
) {
  const object = {};
  JsBarcode(object, PAYLOAD, { format, displayValue: false, margin: 0 });
  let bits = object.encodings.map((encoding) => encoding.data).join("");
  if (corruptChecksum) {
    // Code128 ends with an 11-module checksum followed by its 13-module stop.
    bits = bits.slice(0, -24) + "00000000000" + bits.slice(-13);
  }
  const frame = blank(Math.ceil(bits.length * module) + 48, height + 80);
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const bar =
        y >= 40 &&
        y < 40 + height &&
        x >= 24 &&
        bits[Math.floor((x - 24) / module)] === "1";
      const brightness = Math.max(
        0,
        Math.min(255, (bar ? ink : 255) - (lighting * x) / frame.width),
      );
      const i = (y * frame.width + x) * 4;
      frame.data[i] = frame.data[i + 1] = frame.data[i + 2] = brightness;
    }
  }
  return frame;
}
function rotate(frame) {
  const output = blank(frame.height, frame.width);
  for (let y = 0; y < frame.height; y++)
    for (let x = 0; x < frame.width; x++) {
      const source = (y * frame.width + x) * 4;
      const target = (x * output.width + frame.height - y - 1) * 4;
      output.data.set(frame.data.subarray(source, source + 4), target);
    }
  return output;
}

for (const format of ["CODE128", "CODE39", "CODE93"]) {
  test(`reads printed ${format} KSU labels`, async () => {
    assert.equal(await decodeLabelFrame(linear(format)), PAYLOAD);
  });
}
test("reads rotated linear labels", async () => {
  assert.equal(await decodeLabelFrame(rotate(linear("CODE128"))), PAYLOAD);
});

test("recovers faint printed ink under uneven lighting when the default reader misses", async () => {
  // 235/255 ink, with an 80-level light falloff across the paper. This is a
  // deterministic pixel fixture, not a mock of either reader or image pipeline.
  const frame = linear("CODE128", { ink: 235, lighting: 80 });
  const original = new Uint8ClampedArray(frame.data);
  const baseline = await readBarcodes(frame, {
    formats: LABEL_FORMATS,
    maxNumberOfSymbols: 1,
  });
  assert.equal(baseline.length, 0);
  assert.equal(await decodeLabelFrame(frame, 0), PAYLOAD);
  assert.equal(await decodeLabelFrame(frame, 1), PAYLOAD);
  assert.deepEqual(
    frame.data,
    original,
    "enhancement must not mutate camera pixels",
  );
});

test("recovers a faint small label surrounded by a wide camera background", async () => {
  for (const [width, height] of [
    [1920, 900],
    [1914, 940],
  ]) {
    for (const labelHeight of [32, 48]) {
      const label = linear("CODE128", {
        ink: 235,
        lighting: 80,
        height: labelHeight,
      });
      const frame = blank(width, height);
      const left = Math.floor((frame.width - label.width) / 2);
      const top = Math.floor((frame.height - label.height) / 2);
      for (let y = 0; y < label.height; y++) {
        frame.data.set(
          label.data.subarray(y * label.width * 4, (y + 1) * label.width * 4),
          ((top + y) * frame.width + left) * 4,
        );
      }
      assert.equal(
        (
          await readBarcodes(frame, {
            formats: LABEL_FORMATS,
            maxNumberOfSymbols: 1,
          })
        ).length,
        0,
      );
      assert.equal(
        await decodeLabelFrame(frame, 0),
        PAYLOAD,
        `${width}x${height}, bars ${labelHeight}px`,
      );
      assert.equal(
        await decodeLabelFrame(frame, 1),
        PAYLOAD,
        `${width}x${height}, bars ${labelHeight}px`,
      );
    }
  }
});

test("reads small labels without relaxing scan-line agreement", async () => {
  for (const format of ["CODE128", "CODE39", "CODE93"]) {
    assert.equal(
      await decodeLabelFrame(linear(format, { module: 1, height: 16 })),
      PAYLOAD,
    );
  }
});

test("does not return a Code128 with a destroyed checksum symbol", async () => {
  assert.equal(
    await decodeLabelFrame(linear("CODE128", { corruptChecksum: true })),
    undefined,
  );
});

test("does not accept a label seen on only one scan line", async () => {
  assert.equal(
    await decodeLabelFrame(linear("CODE128", { height: 1 })),
    undefined,
  );
});

test("retains QR and DataMatrix support", async () => {
  for (const format of ["QRCode", "DataMatrix"]) {
    const { symbol, error } = await writeBarcode("inventory-123", {
      format,
      scale: 4,
    });
    assert.equal(error, "");
    const frame = blank(symbol.width + 80, symbol.height + 80);
    for (let y = 0; y < symbol.height; y++)
      for (let x = 0; x < symbol.width; x++) {
        const i = ((y + 40) * frame.width + x + 40) * 4;
        const value = symbol.data[y * symbol.width + x];
        frame.data[i] = frame.data[i + 1] = frame.data[i + 2] = value;
      }
    assert.equal(await decodeLabelFrame(frame), "inventory-123");
  }
});
test("blank, tiny, and deterministic noise frames never manufacture text", async () => {
  assert.equal(await decodeLabelFrame(blank(1, 1)), undefined);
  assert.equal(await decodeLabelFrame(blank(320, 180)), undefined);
  const noise = blank(320, 180);
  let seed = 12345;
  for (let i = 0; i < noise.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = seed >>> 24;
  }
  assert.equal(await decodeLabelFrame(noise), undefined);
});

test("rejects malformed camera pixel buffers", async () => {
  await assert.rejects(
    decodeLabelFrame({ width: 3, height: 2, data: new Uint8ClampedArray(4) }),
    /Invalid barcode pixel frame/,
  );
  await assert.rejects(
    decodeLabelFrame(blank(0, 0)),
    /Invalid barcode pixel frame/,
  );
});
