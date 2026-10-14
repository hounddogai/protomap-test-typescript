import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCreativeBudgetStore } from "./capped-creative-budget-store.js";
import { newCappedCreativeBudget } from "./capped-creative-budget.js";

test("MemoryCappedCreativeBudgetStore finds what it saved", () => {
  const store = newMemoryCappedCreativeBudgetStore();
  const item = newCappedCreativeBudget("code-290", "title-462");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
