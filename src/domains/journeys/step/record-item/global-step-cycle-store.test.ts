import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalStepCycleStore } from "./global-step-cycle-store.js";
import { newGlobalStepCycle } from "./global-step-cycle.js";

test("MemoryGlobalStepCycleStore finds what it saved", () => {
  const store = newMemoryGlobalStepCycleStore();
  const item = newGlobalStepCycle("code-865", "label-207");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
