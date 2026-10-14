import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPreferencePlanStore } from "./strict-preference-plan-store.js";
import { newStrictPreferencePlan } from "./strict-preference-plan.js";

test("MemoryStrictPreferencePlanStore finds what it saved", () => {
  const store = newMemoryStrictPreferencePlanStore();
  const item = newStrictPreferencePlan("code-741", "title-447");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
