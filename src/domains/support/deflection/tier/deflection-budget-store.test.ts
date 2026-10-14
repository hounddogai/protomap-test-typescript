import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionBudgetStore } from "./deflection-budget-store.js";
import { newDeflectionBudget } from "./deflection-budget.js";

test("MemoryDeflectionBudgetStore finds what it saved", () => {
  const store = newMemoryDeflectionBudgetStore();
  const item = newDeflectionBudget("code-813", "label-780");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
