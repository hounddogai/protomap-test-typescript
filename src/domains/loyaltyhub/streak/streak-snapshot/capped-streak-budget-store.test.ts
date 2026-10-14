import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStreakBudgetStore } from "./capped-streak-budget-store.js";
import { newCappedStreakBudget } from "./capped-streak-budget.js";

test("MemoryCappedStreakBudgetStore finds what it saved", () => {
  const store = newMemoryCappedStreakBudgetStore();
  const item = newCappedStreakBudget("code-369", "title-981");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
