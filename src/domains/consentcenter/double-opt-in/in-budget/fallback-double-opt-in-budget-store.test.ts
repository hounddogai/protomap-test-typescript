import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDoubleOptInBudgetStore } from "./fallback-double-opt-in-budget-store.js";
import { newFallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

test("MemoryFallbackDoubleOptInBudgetStore finds what it saved", () => {
  const store = newMemoryFallbackDoubleOptInBudgetStore();
  const item = newFallbackDoubleOptInBudget("code-316", "name-326");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
