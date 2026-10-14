import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWindowBatchStore } from "./batched-window-batch-store.js";
import { newBatchedWindowBatch } from "./batched-window-batch.js";

test("MemoryBatchedWindowBatchStore finds what it saved", () => {
  const store = newMemoryBatchedWindowBatchStore();
  const item = newBatchedWindowBatch("code-481", "label-798");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
