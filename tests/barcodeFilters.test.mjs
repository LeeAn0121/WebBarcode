import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyQuickFilter,
  getQuickFilterCounts,
} from "../src/barcodeFilters.ts";

const now = new Date(2026, 10, 24, 12);
const records = [
  {
    id: "today-memo",
    created_at: new Date(2026, 10, 24, 0, 1).toISOString(),
    memo: "키보드",
  },
  {
    id: "yesterday-empty",
    created_at: new Date(2026, 10, 23, 23, 59).toISOString(),
    memo: "   ",
  },
  {
    id: "today-empty",
    created_at: new Date(2026, 10, 24, 23, 59).toISOString(),
  },
  {
    id: "old-memo",
    created_at: new Date(2026, 10, 20, 14).toISOString(),
    memo: "장비",
  },
];

test("today uses the user local calendar day, including both sides of midnight", () => {
  assert.deepEqual(
    applyQuickFilter(records, "today", now).map((row) => row.id),
    ["today-memo", "today-empty"],
  );
});

test("memo filter excludes absent, empty, null and whitespace-only notes", () => {
  assert.deepEqual(
    applyQuickFilter(
      [...records, { created_at: "", memo: null }],
      "hasMemo",
    ).map((row) => row.id),
    ["today-memo", "old-memo"],
  );
});

test("counts describe the supplied folder/search subset without changing record order", () => {
  assert.deepEqual(getQuickFilterCounts(records.slice(1), now), {
    all: 3,
    today: 1,
    hasMemo: 1,
  });
  assert.deepEqual(applyQuickFilter(records, "all", now), records);
  assert.notEqual(applyQuickFilter(records, "all", now), records);
});

test("invalid dates cannot appear in today results", () => {
  assert.deepEqual(
    applyQuickFilter([{ created_at: "invalid" }], "today", now),
    [],
  );
});
