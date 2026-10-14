import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLevelBudgetStore } from "./manual-level-budget-store.js";
import { newManualLevelBudget } from "./manual-level-budget.js";

test("MemoryManualLevelBudgetStore finds what it saved", () => {
  const store = newMemoryManualLevelBudgetStore();
  const item = newManualLevelBudget("code-479", "title-167");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
