import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryReplyBudgetStore } from "./primary-reply-budget-store.js";
import { newPrimaryReplyBudget } from "./primary-reply-budget.js";

test("MemoryPrimaryReplyBudgetStore finds what it saved", () => {
  const store = newMemoryPrimaryReplyBudgetStore();
  const item = newPrimaryReplyBudget("code-647", "title-908");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
