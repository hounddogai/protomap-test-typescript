import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientStreakBudgetStore } from "./lenient-streak-budget-store.js";
import { newLenientStreakBudget } from "./lenient-streak-budget.js";

test("MemoryLenientStreakBudgetStore finds what it saved", () => {
  const store = newMemoryLenientStreakBudgetStore();
  const item = newLenientStreakBudget("code-63", "title-894");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
