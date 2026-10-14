import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalActivationBudgetStore } from "./regional-activation-budget-store.js";
import { newRegionalActivationBudget } from "./regional-activation-budget.js";

test("MemoryRegionalActivationBudgetStore finds what it saved", () => {
  const store = newMemoryRegionalActivationBudgetStore();
  const item = newRegionalActivationBudget("code-768", "name-513");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
