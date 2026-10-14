import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedStepAdjustmentStore } from "./batched-step-adjustment-store.js";
import { newBatchedStepAdjustment } from "./batched-step-adjustment.js";

test("MemoryBatchedStepAdjustmentStore finds what it saved", () => {
  const store = newMemoryBatchedStepAdjustmentStore();
  const item = newBatchedStepAdjustment("code-578", "name-491");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
