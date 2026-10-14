import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchTargetStore } from "./branch-target-store.js";
import { newBranchTarget } from "./branch-target.js";

test("MemoryBranchTargetStore finds what it saved", () => {
  const store = newMemoryBranchTargetStore();
  const item = newBranchTarget("code-806", "label-138");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
