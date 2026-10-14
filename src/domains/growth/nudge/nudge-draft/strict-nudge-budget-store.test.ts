import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictNudgeBudgetStore } from "./strict-nudge-budget-store.js";
import { newStrictNudgeBudget } from "./strict-nudge-budget.js";

test("MemoryStrictNudgeBudgetStore finds what it saved", () => {
  const store = newMemoryStrictNudgeBudgetStore();
  const item = newStrictNudgeBudget("code-831", "title-492");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
