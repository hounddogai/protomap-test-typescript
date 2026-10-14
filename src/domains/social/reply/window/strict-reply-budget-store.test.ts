import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReplyBudgetStore } from "./strict-reply-budget-store.js";
import { newStrictReplyBudget } from "./strict-reply-budget.js";

test("MemoryStrictReplyBudgetStore finds what it saved", () => {
  const store = newMemoryStrictReplyBudgetStore();
  const item = newStrictReplyBudget("code-320", "label-305");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
