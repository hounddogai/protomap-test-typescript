import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBidRuleBudgetStore } from "./manual-bid-rule-budget-store.js";
import { newManualBidRuleBudget } from "./manual-bid-rule-budget.js";

test("MemoryManualBidRuleBudgetStore finds what it saved", () => {
  const store = newMemoryManualBidRuleBudgetStore();
  const item = newManualBidRuleBudget("code-457", "title-736");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
