import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupPlanStore } from "./warmup-plan-store.js";
import { newWarmupPlan } from "./warmup-plan.js";

test("MemoryWarmupPlanStore finds what it saved", () => {
  const store = newMemoryWarmupPlanStore();
  const item = newWarmupPlan("code-943", "name-984");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
