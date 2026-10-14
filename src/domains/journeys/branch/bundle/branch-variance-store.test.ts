import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchVarianceStore } from "./branch-variance-store.js";
import { newBranchVariance } from "./branch-variance.js";

test("MemoryBranchVarianceStore finds what it saved", () => {
  const store = newMemoryBranchVarianceStore();
  const item = newBranchVariance("code-861", "label-477");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
