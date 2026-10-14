import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDomainBudgetStore } from "./tiered-domain-budget-store.js";
import { newTieredDomainBudget } from "./tiered-domain-budget.js";

test("MemoryTieredDomainBudgetStore finds what it saved", () => {
  const store = newMemoryTieredDomainBudgetStore();
  const item = newTieredDomainBudget("code-904", "name-500");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
