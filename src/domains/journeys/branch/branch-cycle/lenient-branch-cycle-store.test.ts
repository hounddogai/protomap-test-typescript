import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientBranchCycleStore } from "./lenient-branch-cycle-store.js";
import { newLenientBranchCycle } from "./lenient-branch-cycle.js";

test("MemoryLenientBranchCycleStore finds what it saved", () => {
  const store = newMemoryLenientBranchCycleStore();
  const item = newLenientBranchCycle("code-769", "name-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
