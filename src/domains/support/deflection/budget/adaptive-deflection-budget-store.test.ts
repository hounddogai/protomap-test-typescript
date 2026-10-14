import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDeflectionBudgetStore } from "./adaptive-deflection-budget-store.js";
import { newAdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

test("MemoryAdaptiveDeflectionBudgetStore finds what it saved", () => {
  const store = newMemoryAdaptiveDeflectionBudgetStore();
  const item = newAdaptiveDeflectionBudget("code-276", "title-208");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
