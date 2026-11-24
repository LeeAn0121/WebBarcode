import { test } from "node:test";
import assert from "node:assert/strict";
import { getCameraCaptureRegion } from "../src/scanner/cameraFrame.ts";

test("full visible 4K height and fine bars are preserved on every capture", () => {
  const crop = getCameraCaptureRegion(3840, 2160, 390, 440);
  assert.equal(crop.width, crop.outputWidth);
  assert.equal(crop.height, crop.outputHeight);
  assert.equal(crop.height, 2160);
  assert(crop.x > 0);
  assert.equal(crop.y, 0);
});
test("full-view frames match the actual visible object-cover region", () => {
  const crop = getCameraCaptureRegion(1920, 1080, 360, 360);
  assert.deepEqual(crop, {
    x: 420,
    y: 0,
    width: 1080,
    height: 1080,
    outputWidth: 1080,
    outputHeight: 1080,
  });
});
test("portrait camera frames are cropped in the correct direction", () => {
  const crop = getCameraCaptureRegion(1080, 1920, 360, 360);
  assert.equal(crop.x, 0);
  assert.equal(crop.y, 420);
  assert.equal(crop.outputWidth, 1080);
  assert.equal(crop.outputHeight, 1080);
});
test("4K landscape retains the full native frame", () => {
  const crop = getCameraCaptureRegion(3840, 2160, 3840, 2160);
  assert.equal(crop.outputWidth, 3840);
  assert.equal(crop.outputHeight, 2160);
});
test("larger sensors retain all edges within a 4K transfer budget", () => {
  const crop = getCameraCaptureRegion(7680, 4320, 7680, 4320);
  assert.equal(crop.x, 0);
  assert.equal(crop.y, 0);
  assert.equal(crop.width, 7680);
  assert.equal(crop.height, 4320);
  assert.equal(crop.outputWidth, 3840);
  assert.equal(crop.outputHeight, 2160);
});
test("unmeasured video layout remains usable and invalid cameras are rejected", () => {
  assert.equal(getCameraCaptureRegion(0, 1080, 100, 100), null);
  assert.equal(getCameraCaptureRegion(NaN, 1080, 100, 100), null);
  const crop = getCameraCaptureRegion(640, 480, 0, 0);
  assert.equal(crop.width, 640);
  assert.equal(crop.height, 480);
});
