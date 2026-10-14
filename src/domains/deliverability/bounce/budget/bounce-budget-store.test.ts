import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceBudgetStore } from "./bounce-budget-store.js";
import { newBounceBudget } from "./bounce-budget.js";

test("MemoryBounceBudgetStore finds what it saved", () => {
  const store = newMemoryBounceBudgetStore();
  const item = newBounceBudget("code-489", "name-668");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
