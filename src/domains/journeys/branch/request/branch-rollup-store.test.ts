import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchRollupStore } from "./branch-rollup-store.js";
import { newBranchRollup } from "./branch-rollup.js";

test("MemoryBranchRollupStore finds what it saved", () => {
  const store = newMemoryBranchRollupStore();
  const item = newBranchRollup("code-205", "label-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
