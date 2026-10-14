import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInBudgetStore } from "./double-opt-in-budget-store.js";
import { newDoubleOptInBudget } from "./double-opt-in-budget.js";

test("MemoryDoubleOptInBudgetStore finds what it saved", () => {
  const store = newMemoryDoubleOptInBudgetStore();
  const item = newDoubleOptInBudget("code-18", "title-252");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
