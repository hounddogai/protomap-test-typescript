import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryLevelPlanStore } from "./primary-level-plan-store.js";
import { newPrimaryLevelPlan } from "./primary-level-plan.js";

test("MemoryPrimaryLevelPlanStore finds what it saved", () => {
  const store = newMemoryPrimaryLevelPlanStore();
  const item = newPrimaryLevelPlan("code-669", "name-793");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
