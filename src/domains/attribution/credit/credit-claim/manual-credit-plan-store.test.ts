import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualCreditPlanStore } from "./manual-credit-plan-store.js";
import { newManualCreditPlan } from "./manual-credit-plan.js";

test("MemoryManualCreditPlanStore finds what it saved", () => {
  const store = newMemoryManualCreditPlanStore();
  const item = newManualCreditPlan("code-365", "label-354");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
