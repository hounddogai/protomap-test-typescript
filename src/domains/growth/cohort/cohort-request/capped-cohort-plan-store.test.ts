import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCohortPlanStore } from "./capped-cohort-plan-store.js";
import { newCappedCohortPlan } from "./capped-cohort-plan.js";

test("MemoryCappedCohortPlanStore finds what it saved", () => {
  const store = newMemoryCappedCohortPlanStore();
  const item = newCappedCohortPlan("code-944", "name-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
