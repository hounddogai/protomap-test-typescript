import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictBadgePlanStore } from "./strict-badge-plan-store.js";
import { newStrictBadgePlan } from "./strict-badge-plan.js";

test("MemoryStrictBadgePlanStore finds what it saved", () => {
  const store = newMemoryStrictBadgePlanStore();
  const item = newStrictBadgePlan("code-441", "label-38");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
