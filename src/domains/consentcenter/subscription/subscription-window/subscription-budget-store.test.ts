import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionBudgetStore } from "./subscription-budget-store.js";
import { newSubscriptionBudget } from "./subscription-budget.js";

test("MemorySubscriptionBudgetStore finds what it saved", () => {
  const store = newMemorySubscriptionBudgetStore();
  const item = newSubscriptionBudget("code-790", "title-135");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
