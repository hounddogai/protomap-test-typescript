import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengePlanStore } from "./challenge-plan-store.js";
import { newChallengePlan } from "./challenge-plan.js";

test("MemoryChallengePlanStore finds what it saved", () => {
  const store = newMemoryChallengePlanStore();
  const item = newChallengePlan("code-523", "name-636");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
