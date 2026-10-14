import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingRetentionBudgetStore } from "./pending-retention-budget-store.js";
import { newPendingRetentionBudget } from "./pending-retention-budget.js";

test("MemoryPendingRetentionBudgetStore finds what it saved", () => {
  const store = newMemoryPendingRetentionBudgetStore();
  const item = newPendingRetentionBudget("code-378", "label-816");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
