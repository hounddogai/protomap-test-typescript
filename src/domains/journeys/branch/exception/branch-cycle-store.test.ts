import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchCycleStore } from "./branch-cycle-store.js";
import { newBranchCycle } from "./branch-cycle.js";

test("MemoryBranchCycleStore finds what it saved", () => {
  const store = newMemoryBranchCycleStore();
  const item = newBranchCycle("code-624", "title-324");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
