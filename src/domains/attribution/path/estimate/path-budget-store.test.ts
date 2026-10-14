import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathBudgetStore } from "./path-budget-store.js";
import { newPathBudget } from "./path-budget.js";

test("MemoryPathBudgetStore finds what it saved", () => {
  const store = newMemoryPathBudgetStore();
  const item = newPathBudget("code-828", "title-402");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
