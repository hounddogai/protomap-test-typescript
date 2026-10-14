import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveWarmupBudgetStore } from "./adaptive-warmup-budget-store.js";
import { newAdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

test("MemoryAdaptiveWarmupBudgetStore finds what it saved", () => {
  const store = newMemoryAdaptiveWarmupBudgetStore();
  const item = newAdaptiveWarmupBudget("code-927", "label-939");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
