import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFraudCheckPlanStore } from "./manual-fraud-check-plan-store.js";
import { newManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

test("MemoryManualFraudCheckPlanStore finds what it saved", () => {
  const store = newMemoryManualFraudCheckPlanStore();
  const item = newManualFraudCheckPlan("code-71", "title-720");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
