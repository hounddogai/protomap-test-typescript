import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgePlanStore } from "./nudge-plan-store.js";
import { newNudgePlan } from "./nudge-plan.js";

test("MemoryNudgePlanStore finds what it saved", () => {
  const store = newMemoryNudgePlanStore();
  const item = newNudgePlan("code-966", "label-396");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
