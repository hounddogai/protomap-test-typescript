import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBranchPlanStore } from "./fallback-branch-plan-store.js";
import { newFallbackBranchPlan } from "./fallback-branch-plan.js";

test("MemoryFallbackBranchPlanStore finds what it saved", () => {
  const store = newMemoryFallbackBranchPlanStore();
  const item = newFallbackBranchPlan("code-140", "name-598");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
