import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardBudgetStore } from "./weighted-reward-budget-store.js";
import { newWeightedRewardBudget } from "./weighted-reward-budget.js";

test("MemoryWeightedRewardBudgetStore finds what it saved", () => {
  const store = newMemoryWeightedRewardBudgetStore();
  const item = newWeightedRewardBudget("code-56", "name-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
