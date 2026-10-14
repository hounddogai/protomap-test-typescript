import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedLevelEstimateStore } from "./batched-level-estimate-store.js";
import { newBatchedLevelEstimate } from "./batched-level-estimate.js";

test("MemoryBatchedLevelEstimateStore finds what it saved", () => {
  const store = newMemoryBatchedLevelEstimateStore();
  const item = newBatchedLevelEstimate("code-356", "name-9");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
