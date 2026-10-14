import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentPlanStore } from "./enrollment-plan-store.js";
import { newEnrollmentPlan } from "./enrollment-plan.js";

test("MemoryEnrollmentPlanStore finds what it saved", () => {
  const store = newMemoryEnrollmentPlanStore();
  const item = newEnrollmentPlan("code-604", "title-243");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
