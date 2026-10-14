import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionBudgetStore } from "./conversion-budget-store.js";
import { newConversionBudget } from "./conversion-budget.js";

test("MemoryConversionBudgetStore finds what it saved", () => {
  const store = newMemoryConversionBudgetStore();
  const item = newConversionBudget("code-972", "name-644");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
