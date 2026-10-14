import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyPlanStore } from "./journey-plan-store.js";
import { newJourneyPlan } from "./journey-plan.js";

test("MemoryJourneyPlanStore finds what it saved", () => {
  const store = newMemoryJourneyPlanStore();
  const item = newJourneyPlan("code-890", "title-903");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
