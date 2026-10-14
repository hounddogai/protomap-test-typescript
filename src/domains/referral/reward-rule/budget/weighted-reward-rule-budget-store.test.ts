import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardRuleBudgetStore } from "./weighted-reward-rule-budget-store.js";
import { newWeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

test("MemoryWeightedRewardRuleBudgetStore finds what it saved", () => {
  const store = newMemoryWeightedRewardRuleBudgetStore();
  const item = newWeightedRewardRuleBudget("code-717", "title-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
