import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationBudgetStore } from "./activation-budget-store.js";
import { newActivationBudget } from "./activation-budget.js";

test("MemoryActivationBudgetStore finds what it saved", () => {
  const store = newMemoryActivationBudgetStore();
  const item = newActivationBudget("code-77", "title-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
