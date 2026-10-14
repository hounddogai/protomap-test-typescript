import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintBudgetStore } from "./complaint-budget-store.js";
import { newComplaintBudget } from "./complaint-budget.js";

test("MemoryComplaintBudgetStore finds what it saved", () => {
  const store = newMemoryComplaintBudgetStore();
  const item = newComplaintBudget("code-303", "name-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
