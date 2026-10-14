import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingInsightPlanStore } from "./pending-insight-plan-store.js";
import { newPendingInsightPlan } from "./pending-insight-plan.js";

test("MemoryPendingInsightPlanStore finds what it saved", () => {
  const store = newMemoryPendingInsightPlanStore();
  const item = newPendingInsightPlan("code-692", "name-58");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
