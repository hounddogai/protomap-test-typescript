import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRulePlanStore } from "./reward-rule-plan-store.js";
import { newRewardRulePlan } from "./reward-rule-plan.js";

test("MemoryRewardRulePlanStore finds what it saved", () => {
  const store = newMemoryRewardRulePlanStore();
  const item = newRewardRulePlan("code-822", "title-244");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
