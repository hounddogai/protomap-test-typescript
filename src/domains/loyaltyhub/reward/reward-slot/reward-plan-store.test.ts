import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardPlanStore } from "./reward-plan-store.js";
import { newRewardPlan } from "./reward-plan.js";

test("MemoryRewardPlanStore finds what it saved", () => {
  const store = newMemoryRewardPlanStore();
  const item = newRewardPlan("code-799", "label-217");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
