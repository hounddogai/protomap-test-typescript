import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPacingPlanStore } from "./legacy-pacing-plan-store.js";
import { newLegacyPacingPlan } from "./legacy-pacing-plan.js";

test("MemoryLegacyPacingPlanStore finds what it saved", () => {
  const store = newMemoryLegacyPacingPlanStore();
  const item = newLegacyPacingPlan("code-309", "label-911");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
