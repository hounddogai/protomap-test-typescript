import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFraudCheckPlanStore } from "./capped-fraud-check-plan-store.js";
import { newCappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

test("MemoryCappedFraudCheckPlanStore finds what it saved", () => {
  const store = newMemoryCappedFraudCheckPlanStore();
  const item = newCappedFraudCheckPlan("code-188", "label-235");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
