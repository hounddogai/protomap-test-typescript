import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBranchCycleStore } from "./adaptive-branch-cycle-store.js";
import { newAdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

test("MemoryAdaptiveBranchCycleStore finds what it saved", () => {
  const store = newMemoryAdaptiveBranchCycleStore();
  const item = newAdaptiveBranchCycle("code-383", "label-958");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
