import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchEstimateStore } from "./branch-estimate-store.js";
import { newBranchEstimate } from "./branch-estimate.js";

test("MemoryBranchEstimateStore finds what it saved", () => {
  const store = newMemoryBranchEstimateStore();
  const item = newBranchEstimate("code-999", "title-208");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
