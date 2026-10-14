import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckBatchStore } from "./fraud-check-batch-store.js";
import { newFraudCheckBatch } from "./fraud-check-batch.js";

test("MemoryFraudCheckBatchStore finds what it saved", () => {
  const store = newMemoryFraudCheckBatchStore();
  const item = newFraudCheckBatch("code-587", "label-305");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
