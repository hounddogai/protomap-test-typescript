import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutBudgetStore } from "./payout-budget-store.js";
import { newPayoutBudget } from "./payout-budget.js";

test("MemoryPayoutBudgetStore finds what it saved", () => {
  const store = newMemoryPayoutBudgetStore();
  const item = newPayoutBudget("code-179", "name-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
