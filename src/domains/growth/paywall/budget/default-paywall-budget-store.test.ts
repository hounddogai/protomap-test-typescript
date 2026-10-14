import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPaywallBudgetStore } from "./default-paywall-budget-store.js";
import { newDefaultPaywallBudget } from "./default-paywall-budget.js";

test("MemoryDefaultPaywallBudgetStore finds what it saved", () => {
  const store = newMemoryDefaultPaywallBudgetStore();
  const item = newDefaultPaywallBudget("code-66", "name-545");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
