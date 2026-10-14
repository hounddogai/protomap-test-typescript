import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveReplyBudgetStore } from "./adaptive-reply-budget-store.js";
import { newAdaptiveReplyBudget } from "./adaptive-reply-budget.js";

test("MemoryAdaptiveReplyBudgetStore finds what it saved", () => {
  const store = newMemoryAdaptiveReplyBudgetStore();
  const item = newAdaptiveReplyBudget("code-142", "name-889");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
