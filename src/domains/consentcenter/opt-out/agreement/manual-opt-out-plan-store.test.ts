import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualOptOutPlanStore } from "./manual-opt-out-plan-store.js";
import { newManualOptOutPlan } from "./manual-opt-out-plan.js";

test("MemoryManualOptOutPlanStore finds what it saved", () => {
  const store = newMemoryManualOptOutPlanStore();
  const item = newManualOptOutPlan("code-191", "name-221");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
