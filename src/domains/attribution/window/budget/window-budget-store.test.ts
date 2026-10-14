import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowBudgetStore } from "./window-budget-store.js";
import { newWindowBudget } from "./window-budget.js";

test("MemoryWindowBudgetStore finds what it saved", () => {
  const store = newMemoryWindowBudgetStore();
  const item = newWindowBudget("code-862", "name-55");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
