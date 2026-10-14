import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDeflectionBudgetStore } from "./capped-deflection-budget-store.js";
import { newCappedDeflectionBudget } from "./capped-deflection-budget.js";

test("MemoryCappedDeflectionBudgetStore finds what it saved", () => {
  const store = newMemoryCappedDeflectionBudgetStore();
  const item = newCappedDeflectionBudget("code-674", "label-149");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
