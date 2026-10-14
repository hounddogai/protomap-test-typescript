import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionPlanStore } from "./redemption-plan-store.js";
import { newRedemptionPlan } from "./redemption-plan.js";

test("MemoryRedemptionPlanStore finds what it saved", () => {
  const store = newMemoryRedemptionPlanStore();
  const item = newRedemptionPlan("code-19", "name-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
