import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalConversionBudgetStore } from "./global-conversion-budget-store.js";
import { newGlobalConversionBudget } from "./global-conversion-budget.js";

test("MemoryGlobalConversionBudgetStore finds what it saved", () => {
  const store = newMemoryGlobalConversionBudgetStore();
  const item = newGlobalConversionBudget("code-581", "label-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
