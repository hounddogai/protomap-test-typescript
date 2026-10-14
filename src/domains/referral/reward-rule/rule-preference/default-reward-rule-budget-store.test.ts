import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultRewardRuleBudgetStore } from "./default-reward-rule-budget-store.js";
import { newDefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

test("MemoryDefaultRewardRuleBudgetStore finds what it saved", () => {
  const store = newMemoryDefaultRewardRuleBudgetStore();
  const item = newDefaultRewardRuleBudget("code-907", "title-403");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
