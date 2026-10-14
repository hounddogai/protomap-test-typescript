import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaBudgetStore } from "./sla-budget-store.js";
import { newSlaBudget } from "./sla-budget.js";

test("MemorySlaBudgetStore finds what it saved", () => {
  const store = newMemorySlaBudgetStore();
  const item = newSlaBudget("code-6", "name-683");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
