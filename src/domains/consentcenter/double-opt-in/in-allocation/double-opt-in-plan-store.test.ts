import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInPlanStore } from "./double-opt-in-plan-store.js";
import { newDoubleOptInPlan } from "./double-opt-in-plan.js";

test("MemoryDoubleOptInPlanStore finds what it saved", () => {
  const store = newMemoryDoubleOptInPlanStore();
  const item = newDoubleOptInPlan("code-52", "label-665");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
