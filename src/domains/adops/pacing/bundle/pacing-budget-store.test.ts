import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingBudgetStore } from "./pacing-budget-store.js";
import { newPacingBudget } from "./pacing-budget.js";

test("MemoryPacingBudgetStore finds what it saved", () => {
  const store = newMemoryPacingBudgetStore();
  const item = newPacingBudget("code-82", "name-728");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
