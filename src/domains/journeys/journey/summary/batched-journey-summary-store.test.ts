import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedJourneySummaryStore } from "./batched-journey-summary-store.js";
import { newBatchedJourneySummary } from "./batched-journey-summary.js";

test("MemoryBatchedJourneySummaryStore finds what it saved", () => {
  const store = newMemoryBatchedJourneySummaryStore();
  const item = newBatchedJourneySummary("code-922", "title-7");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
