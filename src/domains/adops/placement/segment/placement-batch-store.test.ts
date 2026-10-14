import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementBatchStore } from "./placement-batch-store.js";
import { newPlacementBatch } from "./placement-batch.js";

test("MemoryPlacementBatchStore finds what it saved", () => {
  const store = newMemoryPlacementBatchStore();
  const item = newPlacementBatch("code-171", "label-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
