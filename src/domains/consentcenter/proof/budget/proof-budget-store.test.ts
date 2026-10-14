import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofBudgetStore } from "./proof-budget-store.js";
import { newProofBudget } from "./proof-budget.js";

test("MemoryProofBudgetStore finds what it saved", () => {
  const store = newMemoryProofBudgetStore();
  const item = newProofBudget("code-712", "name-556");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
