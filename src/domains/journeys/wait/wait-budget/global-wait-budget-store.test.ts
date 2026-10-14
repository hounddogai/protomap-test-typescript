import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalWaitBudgetStore } from "./global-wait-budget-store.js";
import { newGlobalWaitBudget } from "./global-wait-budget.js";

test("MemoryGlobalWaitBudgetStore finds what it saved", () => {
  const store = newMemoryGlobalWaitBudgetStore();
  const item = newGlobalWaitBudget("code-250", "label-572");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
