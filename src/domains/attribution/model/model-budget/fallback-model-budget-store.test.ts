import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackModelBudgetStore } from "./fallback-model-budget-store.js";
import { newFallbackModelBudget } from "./fallback-model-budget.js";

test("MemoryFallbackModelBudgetStore finds what it saved", () => {
  const store = newMemoryFallbackModelBudgetStore();
  const item = newFallbackModelBudget("code-443", "label-983");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
