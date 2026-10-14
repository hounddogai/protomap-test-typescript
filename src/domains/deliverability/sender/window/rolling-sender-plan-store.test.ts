import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSenderPlanStore } from "./rolling-sender-plan-store.js";
import { newRollingSenderPlan } from "./rolling-sender-plan.js";

test("MemoryRollingSenderPlanStore finds what it saved", () => {
  const store = newMemoryRollingSenderPlanStore();
  const item = newRollingSenderPlan("code-794", "title-884");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
