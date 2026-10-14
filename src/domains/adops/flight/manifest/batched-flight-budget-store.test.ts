import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFlightBudgetStore } from "./batched-flight-budget-store.js";
import { newBatchedFlightBudget } from "./batched-flight-budget.js";

test("MemoryBatchedFlightBudgetStore finds what it saved", () => {
  const store = newMemoryBatchedFlightBudgetStore();
  const item = newBatchedFlightBudget("code-312", "name-345");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
