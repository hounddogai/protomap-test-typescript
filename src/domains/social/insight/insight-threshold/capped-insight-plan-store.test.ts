import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedInsightPlanStore } from "./capped-insight-plan-store.js";
import { newCappedInsightPlan } from "./capped-insight-plan.js";

test("MemoryCappedInsightPlanStore finds what it saved", () => {
  const store = newMemoryCappedInsightPlanStore();
  const item = newCappedInsightPlan("code-720", "name-239");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
