import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryStepBudgetStore } from "./primary-step-budget-store.js";
import { newPrimaryStepBudget } from "./primary-step-budget.js";

test("MemoryPrimaryStepBudgetStore finds what it saved", () => {
  const store = newMemoryPrimaryStepBudgetStore();
  const item = newPrimaryStepBudget("code-72", "label-885");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
