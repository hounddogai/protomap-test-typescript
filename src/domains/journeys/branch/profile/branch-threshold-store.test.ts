import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchThresholdStore } from "./branch-threshold-store.js";
import { newBranchThreshold } from "./branch-threshold.js";

test("MemoryBranchThresholdStore finds what it saved", () => {
  const store = newMemoryBranchThresholdStore();
  const item = newBranchThreshold("code-684", "title-536");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
