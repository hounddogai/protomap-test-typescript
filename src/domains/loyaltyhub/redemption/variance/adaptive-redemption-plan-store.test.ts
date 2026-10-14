import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRedemptionPlanStore } from "./adaptive-redemption-plan-store.js";
import { newAdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

test("MemoryAdaptiveRedemptionPlanStore finds what it saved", () => {
  const store = newMemoryAdaptiveRedemptionPlanStore();
  const item = newAdaptiveRedemptionPlan("code-319", "title-782");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
