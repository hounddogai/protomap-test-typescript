import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLevelPlanStore } from "./manual-level-plan-store.js";
import { newManualLevelPlan } from "./manual-level-plan.js";

test("MemoryManualLevelPlanStore finds what it saved", () => {
  const store = newMemoryManualLevelPlanStore();
  const item = newManualLevelPlan("code-260", "label-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
