import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalRewardBudgetStore } from "./seasonal-reward-budget-store.js";
import { newSeasonalRewardBudget } from "./seasonal-reward-budget.js";

test("MemorySeasonalRewardBudgetStore finds what it saved", () => {
  const store = newMemorySeasonalRewardBudgetStore();
  const item = newSeasonalRewardBudget("code-488", "label-301");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
