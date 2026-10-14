import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBounceBudgetStore } from "./capped-bounce-budget-store.js";
import { newCappedBounceBudget } from "./capped-bounce-budget.js";

test("MemoryCappedBounceBudgetStore finds what it saved", () => {
  const store = newMemoryCappedBounceBudgetStore();
  const item = newCappedBounceBudget("code-589", "name-946");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
