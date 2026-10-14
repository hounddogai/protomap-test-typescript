import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveJourneyBatchStore } from "./adaptive-journey-batch-store.js";
import { newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

test("MemoryAdaptiveJourneyBatchStore finds what it saved", () => {
  const store = newMemoryAdaptiveJourneyBatchStore();
  const item = newAdaptiveJourneyBatch("code-139", "title-12");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
