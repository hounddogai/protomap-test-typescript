import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSuppressionPlanStore } from "./lenient-suppression-plan-store.js";
import { newLenientSuppressionPlan } from "./lenient-suppression-plan.js";

test("MemoryLenientSuppressionPlanStore finds what it saved", () => {
  const store = newMemoryLenientSuppressionPlanStore();
  const item = newLenientSuppressionPlan("code-886", "label-676");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
