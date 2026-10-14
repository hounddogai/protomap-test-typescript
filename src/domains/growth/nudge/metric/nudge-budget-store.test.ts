import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeBudgetStore } from "./nudge-budget-store.js";
import { newNudgeBudget } from "./nudge-budget.js";

test("MemoryNudgeBudgetStore finds what it saved", () => {
  const store = newMemoryNudgeBudgetStore();
  const item = newNudgeBudget("code-757", "label-4");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
