import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckBudgetStore } from "./fraud-check-budget-store.js";
import { newFraudCheckBudget } from "./fraud-check-budget.js";

test("MemoryFraudCheckBudgetStore finds what it saved", () => {
  const store = newMemoryFraudCheckBudgetStore();
  const item = newFraudCheckBudget("code-537", "label-249");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
