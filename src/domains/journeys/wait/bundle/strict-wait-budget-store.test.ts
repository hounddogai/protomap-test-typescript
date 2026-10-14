import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictWaitBudgetStore } from "./strict-wait-budget-store.js";
import { newStrictWaitBudget } from "./strict-wait-budget.js";

test("MemoryStrictWaitBudgetStore finds what it saved", () => {
  const store = newMemoryStrictWaitBudgetStore();
  const item = newStrictWaitBudget("code-342", "title-98");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
