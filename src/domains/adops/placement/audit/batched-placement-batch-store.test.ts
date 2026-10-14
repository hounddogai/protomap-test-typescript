import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPlacementBatchStore } from "./batched-placement-batch-store.js";
import { newBatchedPlacementBatch } from "./batched-placement-batch.js";

test("MemoryBatchedPlacementBatchStore finds what it saved", () => {
  const store = newMemoryBatchedPlacementBatchStore();
  const item = newBatchedPlacementBatch("code-491", "title-36");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
