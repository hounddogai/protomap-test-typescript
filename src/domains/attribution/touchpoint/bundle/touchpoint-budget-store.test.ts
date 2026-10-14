import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointBudgetStore } from "./touchpoint-budget-store.js";
import { newTouchpointBudget } from "./touchpoint-budget.js";

test("MemoryTouchpointBudgetStore finds what it saved", () => {
  const store = newMemoryTouchpointBudgetStore();
  const item = newTouchpointBudget("code-621", "label-280");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
