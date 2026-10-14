import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedJourneyBatchStore } from "./weighted-journey-batch-store.js";
import { newWeightedJourneyBatch } from "./weighted-journey-batch.js";

test("MemoryWeightedJourneyBatchStore finds what it saved", () => {
  const store = newMemoryWeightedJourneyBatchStore();
  const item = newWeightedJourneyBatch("code-274", "label-399");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
