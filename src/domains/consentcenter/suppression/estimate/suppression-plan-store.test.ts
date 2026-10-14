import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionPlanStore } from "./suppression-plan-store.js";
import { newSuppressionPlan } from "./suppression-plan.js";

test("MemorySuppressionPlanStore finds what it saved", () => {
  const store = newMemorySuppressionPlanStore();
  const item = newSuppressionPlan("code-723", "label-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
