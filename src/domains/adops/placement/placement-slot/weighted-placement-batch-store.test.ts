import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPlacementBatchStore } from "./weighted-placement-batch-store.js";
import { newWeightedPlacementBatch } from "./weighted-placement-batch.js";

test("MemoryWeightedPlacementBatchStore finds what it saved", () => {
  const store = newMemoryWeightedPlacementBatchStore();
  const item = newWeightedPlacementBatch("code-832", "title-160");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
