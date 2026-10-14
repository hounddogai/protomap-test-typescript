import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyBudgetStore } from "./frequency-budget-store.js";
import { newFrequencyBudget } from "./frequency-budget.js";

test("MemoryFrequencyBudgetStore finds what it saved", () => {
  const store = newMemoryFrequencyBudgetStore();
  const item = newFrequencyBudget("code-881", "title-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
