import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSenderBatchStore } from "./batched-sender-batch-store.js";
import { newBatchedSenderBatch } from "./batched-sender-batch.js";

test("MemoryBatchedSenderBatchStore finds what it saved", () => {
  const store = newMemoryBatchedSenderBatchStore();
  const item = newBatchedSenderBatch("code-323", "label-988");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
