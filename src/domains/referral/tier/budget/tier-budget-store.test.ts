import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierBudgetStore } from "./tier-budget-store.js";
import { newTierBudget } from "./tier-budget.js";

test("MemoryTierBudgetStore finds what it saved", () => {
  const store = newMemoryTierBudgetStore();
  const item = newTierBudget("code-613", "label-303");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
