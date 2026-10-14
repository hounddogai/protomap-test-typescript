import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPacingPlanStore } from "./primary-pacing-plan-store.js";
import { newPrimaryPacingPlan } from "./primary-pacing-plan.js";

test("MemoryPrimaryPacingPlanStore finds what it saved", () => {
  const store = newMemoryPrimaryPacingPlanStore();
  const item = newPrimaryPacingPlan("code-701", "title-432");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
