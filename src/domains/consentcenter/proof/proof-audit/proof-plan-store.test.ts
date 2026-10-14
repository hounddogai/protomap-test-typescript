import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofPlanStore } from "./proof-plan-store.js";
import { newProofPlan } from "./proof-plan.js";

test("MemoryProofPlanStore finds what it saved", () => {
  const store = newMemoryProofPlanStore();
  const item = newProofPlan("code-295", "title-35");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
