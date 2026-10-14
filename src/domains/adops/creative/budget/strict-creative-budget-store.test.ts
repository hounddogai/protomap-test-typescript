import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCreativeBudgetStore } from "./strict-creative-budget-store.js";
import { newStrictCreativeBudget } from "./strict-creative-budget.js";

test("MemoryStrictCreativeBudgetStore finds what it saved", () => {
  const store = newMemoryStrictCreativeBudgetStore();
  const item = newStrictCreativeBudget("code-536", "label-558");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
