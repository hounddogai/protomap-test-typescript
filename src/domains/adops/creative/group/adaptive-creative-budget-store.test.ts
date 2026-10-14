import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCreativeBudgetStore } from "./adaptive-creative-budget-store.js";
import { newAdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

test("MemoryAdaptiveCreativeBudgetStore finds what it saved", () => {
  const store = newMemoryAdaptiveCreativeBudgetStore();
  const item = newAdaptiveCreativeBudget("code-887", "title-359");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
