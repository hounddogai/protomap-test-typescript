import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePreferenceBudgetStore } from "./adaptive-preference-budget-store.js";
import { newAdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

test("MemoryAdaptivePreferenceBudgetStore finds what it saved", () => {
  const store = newMemoryAdaptivePreferenceBudgetStore();
  const item = newAdaptivePreferenceBudget("code-926", "label-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
