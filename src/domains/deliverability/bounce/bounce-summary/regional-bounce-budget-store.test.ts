import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBounceBudgetStore } from "./regional-bounce-budget-store.js";
import { newRegionalBounceBudget } from "./regional-bounce-budget.js";

test("MemoryRegionalBounceBudgetStore finds what it saved", () => {
  const store = newMemoryRegionalBounceBudgetStore();
  const item = newRegionalBounceBudget("code-952", "label-138");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
