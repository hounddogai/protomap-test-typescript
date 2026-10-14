import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedActivationBatchStore } from "./batched-activation-batch-store.js";
import { newBatchedActivationBatch } from "./batched-activation-batch.js";

test("MemoryBatchedActivationBatchStore finds what it saved", () => {
  const store = newMemoryBatchedActivationBatchStore();
  const item = newBatchedActivationBatch("code-919", "title-196");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
