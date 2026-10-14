import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWarmupBudgetStore } from "./seasonal-warmup-budget-store.js";
import { newSeasonalWarmupBudget } from "./seasonal-warmup-budget.js";

test("MemorySeasonalWarmupBudgetStore finds what it saved", () => {
  const store = newMemorySeasonalWarmupBudgetStore();
  const item = newSeasonalWarmupBudget("code-796", "name-375");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
