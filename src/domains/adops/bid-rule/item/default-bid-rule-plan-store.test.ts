import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultBidRulePlanStore } from "./default-bid-rule-plan-store.js";
import { newDefaultBidRulePlan } from "./default-bid-rule-plan.js";

test("MemoryDefaultBidRulePlanStore finds what it saved", () => {
  const store = newMemoryDefaultBidRulePlanStore();
  const item = newDefaultBidRulePlan("code-841", "name-201");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
