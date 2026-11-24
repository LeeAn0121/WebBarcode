import { test } from "node:test";
import assert from "node:assert/strict";
import { setCameraControls } from "../src/scanner/cameraControls.ts";

test("zoom changes preserve high resolution, focus and active torch", async () => {
  const initial = {
    width: { ideal: 3840 },
    height: { ideal: 2160 },
    frameRate: { ideal: 24 },
    advanced: [{ focusMode: "continuous" }, { zoom: 1, torch: true }],
  };
  let applied;
  await setCameraControls(
    {
      getConstraints: () => initial,
      applyConstraints: async (value) => {
        applied = value;
      },
    },
    { zoom: 2 },
  );
  assert.deepEqual(applied.width, initial.width);
  assert.deepEqual(applied.height, initial.height);
  assert.deepEqual(applied.frameRate, initial.frameRate);
  assert.deepEqual(applied.advanced, [
    { focusMode: "continuous", zoom: 2, torch: true },
  ]);
  assert.equal(initial.advanced[1].zoom, 1);
});
test("camera failures propagate instead of reporting a control change as successful", async () => {
  await assert.rejects(
    setCameraControls(
      {
        getConstraints: () => ({}),
        applyConstraints: async () => {
          throw new Error("not supported");
        },
      },
      { torch: true },
    ),
    /not supported/,
  );
});

test("overlapping zoom and torch updates read the latest committed constraints", async () => {
  let current = {
    width: { ideal: 3840 },
    advanced: [{ zoom: 1, torch: false }],
  };
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const calls = [];
  const track = {
    getConstraints: () => current,
    applyConstraints: async (value) => {
      calls.push(value);
      if (calls.length === 1) await gate;
      current = value;
    },
  };
  const zoom = setCameraControls(track, { zoom: 2 });
  const torch = setCameraControls(track, { torch: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls.length, 1);
  release();
  await Promise.all([zoom, torch]);
  assert.deepEqual(current.advanced, [{ zoom: 2, torch: true }]);
  assert.deepEqual(current.width, { ideal: 3840 });
});

test("a failed request does not block a later control retry", async () => {
  let count = 0;
  const track = {
    getConstraints: () => ({}),
    applyConstraints: async () => {
      if (++count === 1) throw new Error("first request failed");
    },
  };
  const first = setCameraControls(track, { zoom: 2 });
  const second = setCameraControls(track, { torch: true });
  await assert.rejects(first, /first request failed/);
  await second;
  assert.equal(count, 2);
});
