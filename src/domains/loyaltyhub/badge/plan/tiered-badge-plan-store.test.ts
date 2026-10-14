import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBadgePlanStore } from "./tiered-badge-plan-store.js";
import { newTieredBadgePlan } from "./tiered-badge-plan.js";

test("MemoryTieredBadgePlanStore finds what it saved", () => {
  const store = newMemoryTieredBadgePlanStore();
  const item = newTieredBadgePlan("code-826", "name-985");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
