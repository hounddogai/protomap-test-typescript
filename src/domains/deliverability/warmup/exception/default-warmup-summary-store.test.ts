import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultWarmupSummaryStore } from "./default-warmup-summary-store.js";
import { newDefaultWarmupSummary } from "./default-warmup-summary.js";

test("MemoryDefaultWarmupSummaryStore finds what it saved", () => {
  const store = newMemoryDefaultWarmupSummaryStore();
  const item = newDefaultWarmupSummary("code-379", "label-730");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
