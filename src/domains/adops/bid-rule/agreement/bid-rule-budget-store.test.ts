import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleBudgetStore } from "./bid-rule-budget-store.js";
import { newBidRuleBudget } from "./bid-rule-budget.js";

test("MemoryBidRuleBudgetStore finds what it saved", () => {
  const store = newMemoryBidRuleBudgetStore();
  const item = newBidRuleBudget("code-821", "title-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
