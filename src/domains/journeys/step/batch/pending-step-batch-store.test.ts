import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingStepBatchStore } from "./pending-step-batch-store.js";
import { newPendingStepBatch } from "./pending-step-batch.js";

test("MemoryPendingStepBatchStore finds what it saved", () => {
  const store = newMemoryPendingStepBatchStore();
  const item = newPendingStepBatch("code-990", "title-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
