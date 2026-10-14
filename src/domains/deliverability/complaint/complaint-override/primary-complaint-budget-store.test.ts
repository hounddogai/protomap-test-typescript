import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryComplaintBudgetStore } from "./primary-complaint-budget-store.js";
import { newPrimaryComplaintBudget } from "./primary-complaint-budget.js";

test("MemoryPrimaryComplaintBudgetStore finds what it saved", () => {
  const store = newMemoryPrimaryComplaintBudgetStore();
  const item = newPrimaryComplaintBudget("code-997", "name-83");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
