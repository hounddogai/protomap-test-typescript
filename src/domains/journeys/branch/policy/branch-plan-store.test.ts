import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchPlanStore } from "./branch-plan-store.js";
import { newBranchPlan } from "./branch-plan.js";

test("MemoryBranchPlanStore finds what it saved", () => {
  const store = newMemoryBranchPlanStore();
  const item = newBranchPlan("code-360", "label-709");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
