import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortPlanStore } from "./cohort-plan-store.js";
import { newCohortPlan } from "./cohort-plan.js";

test("MemoryCohortPlanStore finds what it saved", () => {
  const store = newMemoryCohortPlanStore();
  const item = newCohortPlan("code-451", "name-449");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
