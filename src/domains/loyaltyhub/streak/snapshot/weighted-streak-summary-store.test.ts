import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedStreakSummaryStore } from "./weighted-streak-summary-store.js";
import { newWeightedStreakSummary } from "./weighted-streak-summary.js";

test("MemoryWeightedStreakSummaryStore finds what it saved", () => {
  const store = newMemoryWeightedStreakSummaryStore();
  const item = newWeightedStreakSummary("code-873", "title-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
