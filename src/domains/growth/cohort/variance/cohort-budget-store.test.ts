import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortBudgetStore } from "./cohort-budget-store.js";
import { newCohortBudget } from "./cohort-budget.js";

test("MemoryCohortBudgetStore finds what it saved", () => {
  const store = newMemoryCohortBudgetStore();
  const item = newCohortBudget("code-471", "title-362");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
