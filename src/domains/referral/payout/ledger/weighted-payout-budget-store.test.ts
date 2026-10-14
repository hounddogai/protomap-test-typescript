import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPayoutBudgetStore } from "./weighted-payout-budget-store.js";
import { newWeightedPayoutBudget } from "./weighted-payout-budget.js";

test("MemoryWeightedPayoutBudgetStore finds what it saved", () => {
  const store = newMemoryWeightedPayoutBudgetStore();
  const item = newWeightedPayoutBudget("code-982", "title-586");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
