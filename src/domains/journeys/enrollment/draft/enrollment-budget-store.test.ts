import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentBudgetStore } from "./enrollment-budget-store.js";
import { newEnrollmentBudget } from "./enrollment-budget.js";

test("MemoryEnrollmentBudgetStore finds what it saved", () => {
  const store = newMemoryEnrollmentBudgetStore();
  const item = newEnrollmentBudget("code-166", "label-493");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
