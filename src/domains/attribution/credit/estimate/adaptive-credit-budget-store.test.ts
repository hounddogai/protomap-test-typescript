import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCreditBudgetStore } from "./adaptive-credit-budget-store.js";
import { newAdaptiveCreditBudget } from "./adaptive-credit-budget.js";

test("MemoryAdaptiveCreditBudgetStore finds what it saved", () => {
  const store = newMemoryAdaptiveCreditBudgetStore();
  const item = newAdaptiveCreditBudget("code-353", "title-284");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
