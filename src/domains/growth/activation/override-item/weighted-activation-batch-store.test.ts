import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedActivationBatchStore } from "./weighted-activation-batch-store.js";
import { newWeightedActivationBatch } from "./weighted-activation-batch.js";

test("MemoryWeightedActivationBatchStore finds what it saved", () => {
  const store = newMemoryWeightedActivationBatchStore();
  const item = newWeightedActivationBatch("code-500", "name-302");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
