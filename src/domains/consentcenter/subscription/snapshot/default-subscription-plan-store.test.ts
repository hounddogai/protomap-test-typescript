import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSubscriptionPlanStore } from "./default-subscription-plan-store.js";
import { newDefaultSubscriptionPlan } from "./default-subscription-plan.js";

test("MemoryDefaultSubscriptionPlanStore finds what it saved", () => {
  const store = newMemoryDefaultSubscriptionPlanStore();
  const item = newDefaultSubscriptionPlan("code-96", "label-320");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
